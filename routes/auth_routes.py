from flask import Blueprint, request, jsonify, session
from config import Config
import mysql.connector
from utils.auth import verify_password
from utils.validators import is_valid_user_id

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def get_db_connection():
    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )


@auth_bp.route("/employee/login", methods=["POST"])
def employee_login():
    data = request.get_json(silent=True) or {}

    employee_id = str(data.get("employee_id", "")).strip()
    password = data.get("password", "")

    if not employee_id:
        return jsonify({
            "message": "Enter employee ID"
        }), 400

    if not is_valid_user_id(employee_id):
        return jsonify({
            "message": "Enter a valid employee ID"
        }), 401

    if not password:
        return jsonify({
            "message": "Enter password"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                e.employee_id,
                e.full_name,
                e.department,
                el.password_hash,
                el.must_reset_password
            FROM employees e
            INNER JOIN employee_login el
                ON e.employee_id = el.employee_id
            WHERE e.employee_id = %s
            """,
            (employee_id,)
        )

        employee = cursor.fetchone()

        if not employee:
            return jsonify({
                "message": "Invalid employee ID or password"
            }), 401

        if not verify_password(password, employee["password_hash"]):
            return jsonify({
                "message": "Invalid employee ID or password"
            }), 401

        session.clear()
        session["user_type"] = "EMPLOYEE"
        session["user_id"] = employee["employee_id"]
        session["full_name"] = employee["full_name"]
        session["department"] = employee["department"]

        if employee["must_reset_password"]:
            return jsonify({
                "message": "Password reset required",
                "must_reset_password": True
            })

        return jsonify({
            "message": "Login successful",
            "must_reset_password": False
        })

    except mysql.connector.Error:
        return jsonify({
            "message": "Server error"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@auth_bp.route("/hr/login", methods=["POST"])
def hr_login():
    data = request.get_json(silent=True) or {}

    hr_id = str(data.get("hr_id", "")).strip()
    password = data.get("password", "")

    if not hr_id:
        return jsonify({
            "message": "Enter HR ID"
        }), 400

    if not is_valid_user_id(hr_id):
        return jsonify({
            "message": "Enter a valid HR ID"
        }), 401

    if not password:
        return jsonify({
            "message": "Enter password"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                h.hr_id,
                h.full_name,
                h.department,
                hl.password_hash,
                hl.must_reset_password
            FROM hr h
            INNER JOIN hr_login hl
                ON h.hr_id = hl.hr_id
            WHERE h.hr_id = %s
            """,
            (hr_id,)
        )

        hr = cursor.fetchone()

        if not hr:
            return jsonify({
                "message": "Invalid HR ID or password"
            }), 401

        if not verify_password(password, hr["password_hash"]):
            return jsonify({
                "message": "Invalid HR ID or password"
            }), 401

        session.clear()
        session["user_type"] = "HR"
        session["user_id"] = hr["hr_id"]
        session["full_name"] = hr["full_name"]
        session["department"] = hr["department"]

        if hr["must_reset_password"]:
            return jsonify({
                "message": "Password reset required",
                "must_reset_password": True
            })

        return jsonify({
            "message": "Login successful",
            "must_reset_password": False
        })

    except mysql.connector.Error:
        return jsonify({
            "message": "Server error"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "message": "Logged out successfully"
    })