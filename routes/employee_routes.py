from flask import Blueprint, jsonify, session
import mysql.connector
from config import Config
from utils.auth_middleware import employee_required

employee_bp = Blueprint("employee", __name__, url_prefix="/api/employee")

def get_db_connection():
    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )

@employee_bp.route("/profile", methods=["GET"])
@employee_required
def get_profile():
    employee_id = session["user_id"]

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
                e.gender,
                e.dob,
                e.department,
                e.role,
                c.phone,
                c.email,
                c.address_line1,
                c.address_line2,
                c.city,
                c.state,
                c.pincode,
                c.country
            FROM employees e
            LEFT JOIN contact_info c
                ON e.employee_id = c.employee_id
            WHERE e.employee_id = %s
            """,
            (employee_id,)
        )

        employee = cursor.fetchone()

        if not employee:
            return jsonify({"message": "Employee not found"}), 404

        if employee["dob"]:
            employee["dob"] = employee["dob"].isoformat()

        return jsonify({
            "employee": employee
        })

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()