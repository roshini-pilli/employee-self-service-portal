from flask import Blueprint, request, jsonify, session
import mysql.connector
from datetime import datetime

from config import Config
from utils.auth import hash_password
from utils.validators import validate_password
from utils.otp import generate_otp, hash_otp, get_otp_expiry, verify_otp
from utils.email import send_otp_email

password_bp = Blueprint("password", __name__, url_prefix="/api/password")


def get_db_connection():
    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )


@password_bp.route("/reset-first-login", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}

    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not new_password:
        return jsonify({
            "message": "Enter a new password"
        }), 400

    if not confirm_password:
        return jsonify({
            "message": "Confirm your new password"
        }), 400

    if new_password != confirm_password:
        return jsonify({
            "message": "Passwords do not match"
        }), 400

    password_errors = validate_password(new_password)

    if password_errors:
        return jsonify({
            "message": password_errors[0]
        }), 400

    user_type = None
    user_id = None
    reset_mode = None

    if "user_type" in session and "user_id" in session:
        user_type = session["user_type"]
        user_id = session["user_id"]
        reset_mode = "FIRST_LOGIN"

    elif (
        session.get("password_reset_verified")
        and session.get("password_reset_user_type")
        and session.get("password_reset_user_id")
    ):
        user_type = session["password_reset_user_type"]
        user_id = session["password_reset_user_id"]
        reset_mode = "FORGOT_PASSWORD"

    else:
        return jsonify({
            "message": "Unauthorized"
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        if user_type == "EMPLOYEE":
            cursor.execute(
                """
                SELECT password_hash, must_reset_password
                FROM employee_login
                WHERE employee_id = %s
                """,
                (user_id,)
            )

        elif user_type == "HR":
            cursor.execute(
                """
                SELECT password_hash, must_reset_password
                FROM hr_login
                WHERE hr_id = %s
                """,
                (user_id,)
            )

        else:
            return jsonify({
                "message": "Invalid user type"
            }), 400

        login_data = cursor.fetchone()

        if not login_data:
            return jsonify({
                "message": "User account not found"
            }), 404

        if reset_mode == "FIRST_LOGIN":
            if not login_data["must_reset_password"]:
                return jsonify({
                    "message": "Password reset is not required"
                }), 400

        new_password_hash = hash_password(new_password)

        if user_type == "EMPLOYEE":
            cursor.execute(
                """
                UPDATE employee_login
                SET
                    password_hash = %s,
                    must_reset_password = FALSE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE employee_id = %s
                """,
                (new_password_hash, user_id)
            )

        else:
            cursor.execute(
                """
                UPDATE hr_login
                SET
                    password_hash = %s,
                    must_reset_password = FALSE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE hr_id = %s
                """,
                (new_password_hash, user_id)
            )

        connection.commit()

        if reset_mode == "FORGOT_PASSWORD":
            session.clear()

        return jsonify({
            "message": "Password changed successfully"
        })

    except mysql.connector.Error:
        if connection:
            connection.rollback()

        return jsonify({
            "message": "Server error"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@password_bp.route("/forgot/send-otp", methods=["POST"])
def send_forgot_password_otp():
    data = request.get_json(silent=True) or {}

    user_type = str(data.get("user_type", "")).strip().upper()
    user_id = str(data.get("user_id", "")).strip()

    if user_type not in ["EMPLOYEE", "HR"]:
        return jsonify({
            "message": "Invalid account type"
        }), 400

    if not user_id:
        return jsonify({
            "message": "Enter your ID"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        if user_type == "EMPLOYEE":
            cursor.execute(
                """
                SELECT e.employee_id, c.email
                FROM employees e
                INNER JOIN contact_info c
                    ON e.employee_id = c.employee_id
                WHERE e.employee_id = %s
                """,
                (user_id,)
            )
        else:
            cursor.execute(
                """
                SELECT h.hr_id, c.email
                FROM hr h
                INNER JOIN hr_contact_info c
                    ON h.hr_id = c.hr_id
                WHERE h.hr_id = %s
                """,
                (user_id,)
            )

        user = cursor.fetchone()

        if not user or not user["email"]:
            return jsonify({
                "message": "Unable to send OTP"
            }), 400

        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expires_at = get_otp_expiry()

        cursor.execute(
            """
            UPDATE password_otps
            SET used_at = CURRENT_TIMESTAMP
            WHERE user_type = %s
              AND user_id = %s
              AND used_at IS NULL
            """,
            (user_type, user_id)
        )

        cursor.execute(
            """
            INSERT INTO password_otps (
                user_type,
                user_id,
                otp_hash,
                expires_at
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                user_type,
                user_id,
                otp_hash,
                expires_at
            )
        )

        send_otp_email(
            user["email"],
            otp
        )

        connection.commit()

        return jsonify({
            "message": "OTP sent successfully"
        })

    except mysql.connector.Error:
        if connection:
            connection.rollback()

        return jsonify({
            "message": "Unable to send OTP"
        }), 500

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "message": "Unable to send OTP"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@password_bp.route("/forgot/verify-otp", methods=["POST"])
def verify_forgot_password_otp():
    data = request.get_json(silent=True) or {}

    user_type = str(data.get("user_type", "")).strip().upper()
    user_id = str(data.get("user_id", "")).strip()
    otp = str(data.get("otp", "")).strip()

    if user_type not in ["EMPLOYEE", "HR"]:
        return jsonify({
            "message": "Invalid account type"
        }), 400

    if not user_id:
        return jsonify({
            "message": "Enter your ID"
        }), 400

    if not otp:
        return jsonify({
            "message": "Enter OTP"
        }), 400

    if not otp.isdigit() or len(otp) != 6:
        return jsonify({
            "message": "Enter a valid 6-digit OTP"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                otp_id,
                otp_hash,
                expires_at,
                attempts,
                used_at
            FROM password_otps
            WHERE user_type = %s
              AND user_id = %s
              AND used_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user_type, user_id)
        )

        otp_record = cursor.fetchone()

        if not otp_record:
            return jsonify({
                "message": "Invalid or expired OTP"
            }), 400

        if otp_record["attempts"] >= 5:
            return jsonify({
                "message": "Too many incorrect attempts"
            }), 400

        if datetime.now() > otp_record["expires_at"]:
            return jsonify({
                "message": "OTP has expired"
            }), 400

        if not verify_otp(otp, otp_record["otp_hash"]):
            cursor.execute(
                """
                UPDATE password_otps
                SET attempts = attempts + 1
                WHERE otp_id = %s
                """,
                (otp_record["otp_id"],)
            )

            connection.commit()

            return jsonify({
                "message": "Invalid or expired OTP"
            }), 400

        cursor.execute(
            """
            UPDATE password_otps
            SET used_at = CURRENT_TIMESTAMP
            WHERE otp_id = %s
            """,
            (otp_record["otp_id"],)
        )

        connection.commit()

        session["password_reset_verified"] = True
        session["password_reset_user_type"] = user_type
        session["password_reset_user_id"] = int(user_id)

        return jsonify({
            "message": "OTP verified successfully"
        })

    except mysql.connector.Error:
        if connection:
            connection.rollback()

        return jsonify({
            "message": "Unable to verify OTP"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()