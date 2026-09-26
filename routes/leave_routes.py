from flask import Blueprint, jsonify, request, session
import mysql.connector
from datetime import date

from config import Config
from utils.auth_middleware import employee_required, hr_required

leave_bp = Blueprint("leave", __name__, url_prefix="/api/leave")


def get_db_connection():
    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )


@leave_bp.route("/history", methods=["GET"])
@employee_required
def get_leave_history():
    employee_id = session["user_id"]

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                leave_id,
                leave_date,
                leave_type,
                description,
                status,
                remark,
                requested_at,
                processed_at,
                processed_by
            FROM leave_requests
            WHERE employee_id = %s
            ORDER BY leave_date DESC, leave_id DESC
            """,
            (employee_id,)
        )

        leaves = cursor.fetchall()

        for leave in leaves:
            if leave["leave_date"]:
                leave["leave_date"] = leave["leave_date"].isoformat()

            if leave["requested_at"]:
                leave["requested_at"] = leave["requested_at"].isoformat()

            if leave["processed_at"]:
                leave["processed_at"] = leave["processed_at"].isoformat()

        return jsonify({
            "leaves": leaves
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


@leave_bp.route("/requests", methods=["POST"])
@employee_required
def create_leave_request():
    data = request.get_json(silent=True) or {}

    leave_date = str(data.get("leave_date", "")).strip()
    leave_type = str(data.get("leave_type", "")).strip().upper()
    description = str(data.get("description", "")).strip()

    if not leave_date:
        return jsonify({
            "message": "Select a leave date"
        }), 400

    if leave_type not in ["CL", "SL", "OL"]:
        return jsonify({
            "message": "Select a valid leave type"
        }), 400

    if len(description) > 100:
        return jsonify({
            "message": "Reason cannot exceed 100 characters"
        }), 400

    try:
        selected_date = date.fromisoformat(leave_date)
    except ValueError:
        return jsonify({
            "message": "Enter a valid leave date"
        }), 400

    if selected_date <= date.today():
        return jsonify({
            "message": "Leave date must be after today"
        }), 400

    employee_id = session["user_id"]

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT leave_id
            FROM leave_requests
            WHERE employee_id = %s
              AND leave_date = %s
              AND status = 'PENDING'
            LIMIT 1
            """,
            (
                employee_id,
                selected_date
            )
        )

        existing_request = cursor.fetchone()

        if existing_request:
            return jsonify({
                "message": "A leave request already exists for this date"
            }), 400

        cursor.execute(
            """
            INSERT INTO leave_requests (
                employee_id,
                leave_date,
                leave_type,
                description
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                employee_id,
                selected_date,
                leave_type,
                description or None
            )
        )

        connection.commit()

        return jsonify({
            "message": "Leave request submitted successfully"
        }), 201

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


@leave_bp.route("/hr/requests", methods=["GET"])
@hr_required
def get_hr_leave_requests():
    hr_department = session["department"]
    status = request.args.get("status", "NEW").strip().upper()
    employee_id = request.args.get("employee_id", "").strip()
    month = request.args.get("month", "").strip()

    if status not in ["NEW", "PROCESSED"]:
        return jsonify({
            "message": "Invalid status"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        conditions = ["e.department = %s"]
        params = [hr_department]

        if status == "NEW":
            conditions.append("lr.status = 'PENDING'")
        else:
            conditions.append(
                "lr.status IN ('APPROVED', 'REJECTED')"
            )

        if employee_id:
            conditions.append("lr.employee_id = %s")
            params.append(employee_id)

        if month:
            if not month.isdigit() or not 1 <= int(month) <= 12:
                return jsonify({
                    "message": "Invalid month"
                }), 400

            conditions.append("MONTH(lr.leave_date) = %s")
            params.append(int(month))

        query = f"""
            SELECT
                lr.leave_id,
                lr.employee_id,
                e.full_name AS employee_name,
                lr.leave_date,
                lr.leave_type,
                lr.description,
                lr.status,
                lr.remark,
                lr.requested_at,
                lr.processed_at,
                lr.processed_by
            FROM leave_requests lr
            INNER JOIN employees e
                ON lr.employee_id = e.employee_id
            WHERE {" AND ".join(conditions)}
            ORDER BY lr.leave_date DESC, lr.leave_id DESC
        """

        cursor.execute(query, tuple(params))

        leaves = cursor.fetchall()

        for leave in leaves:
            if leave["leave_date"]:
                leave["leave_date"] = leave["leave_date"].isoformat()

            if leave["requested_at"]:
                leave["requested_at"] = leave["requested_at"].isoformat()

            if leave["processed_at"]:
                leave["processed_at"] = leave["processed_at"].isoformat()

        return jsonify({
            "leaves": leaves
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


@leave_bp.route(
    "/hr/requests/<int:leave_id>/process",
    methods=["POST"]
)
@hr_required
def process_leave_request(leave_id):
    data = request.get_json(silent=True) or {}

    action = str(data.get("action", "")).strip().upper()
    remark = str(data.get("remark", "")).strip()

    if action not in ["APPROVE", "REJECT"]:
        return jsonify({
            "message": "Invalid action"
        }), 400

    if action == "REJECT" and not remark:
        return jsonify({
            "message": "Rejection remarks are required"
        }), 400

    if len(remark) > 255:
        return jsonify({
            "message": "Remarks cannot exceed 255 characters"
        }), 400

    hr_id = session["user_id"]
    hr_department = session["department"]

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        connection.start_transaction()

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                lr.leave_id,
                lr.employee_id,
                lr.status,
                e.department
            FROM leave_requests lr
            INNER JOIN employees e
                ON lr.employee_id = e.employee_id
            WHERE lr.leave_id = %s
            FOR UPDATE
            """,
            (leave_id,)
        )

        leave_request = cursor.fetchone()

        if not leave_request:
            connection.rollback()

            return jsonify({
                "message": "Leave request not found"
            }), 404

        if leave_request["department"] != hr_department:
            connection.rollback()

            return jsonify({
                "message": "Access denied"
            }), 403

        if leave_request["status"] != "PENDING":
            connection.rollback()

            return jsonify({
                "message": "Leave request has already been processed"
            }), 400

        new_status = "APPROVED" if action == "APPROVE" else "REJECTED"

        cursor.execute(
            """
            UPDATE leave_requests
            SET
                status = %s,
                remark = %s,
                processed_at = CURRENT_TIMESTAMP,
                processed_by = %s
            WHERE leave_id = %s
            """,
            (
                new_status,
                remark or None,
                hr_id,
                leave_id
            )
        )

        connection.commit()

        return jsonify({
            "message": (
                "Leave request approved"
                if action == "APPROVE"
                else "Leave request rejected"
            )
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