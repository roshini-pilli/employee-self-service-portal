from flask import Blueprint, jsonify, request, session
import mysql.connector

from config import Config
from utils.auth_middleware import employee_required, hr_required

payroll_bp = Blueprint("payroll", __name__, url_prefix="/api/payroll")


def get_db_connection():
    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )


def get_valid_months():
    return [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]


@payroll_bp.route("/employee", methods=["GET"])
@employee_required
def get_employee_payroll():
    employee_id = session["user_id"]
    month = request.args.get("month", "").strip()
    year = request.args.get("year", "").strip()

    valid_months = get_valid_months()

    if month and month not in valid_months:
        return jsonify({"message": "Invalid month"}), 400

    if year:
        if not year.isdigit() or len(year) != 4:
            return jsonify({"message": "Invalid year"}), 400
        year = int(year)

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        conditions = ["employee_id = %s"]
        params = [employee_id]

        if month:
            conditions.append("month = %s")
            params.append(month)

        if year:
            conditions.append("year = %s")
            params.append(year)

        query = f"""
            SELECT
                salary_id,
                employee_id,
                year,
                month,
                gross_pay,
                tax,
                other_deductions,
                net_pay
            FROM salary
            WHERE {" AND ".join(conditions)}
            ORDER BY
                year DESC,
                FIELD(
                    month,
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ) DESC
        """

        cursor.execute(query, tuple(params))
        salaries = cursor.fetchall()

        return jsonify({"salaries": salaries})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@payroll_bp.route("/hr", methods=["GET"])
@hr_required
def get_hr_payroll():
    hr_department = session["department"]

    employee_id = request.args.get("employee_id", "").strip()
    month = request.args.get("month", "").strip()
    year = request.args.get("year", "").strip()

    valid_months = get_valid_months()

    if month and month not in valid_months:
        return jsonify({"message": "Invalid month"}), 400

    if year:
        if not year.isdigit() or len(year) != 4:
            return jsonify({"message": "Invalid year"}), 400
        year = int(year)

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        conditions = ["e.department = %s"]
        params = [hr_department]

        if employee_id:
            if not employee_id.isdigit() or len(employee_id) != 6:
                return jsonify({"message": "Enter a valid employee ID"}), 400

            conditions.append("s.employee_id = %s")
            params.append(employee_id)

        if month:
            conditions.append("s.month = %s")
            params.append(month)

        if year:
            conditions.append("s.year = %s")
            params.append(year)

        query = f"""
            SELECT
                s.salary_id,
                s.employee_id,
                e.full_name AS employee_name,
                s.year,
                s.month,
                s.gross_pay,
                s.tax,
                s.other_deductions,
                s.net_pay
            FROM salary s
            INNER JOIN employees e
                ON s.employee_id = e.employee_id
            WHERE {" AND ".join(conditions)}
            ORDER BY
                s.year DESC,
                FIELD(
                    s.month,
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ) DESC,
                s.employee_id ASC
        """

        cursor.execute(query, tuple(params))
        salaries = cursor.fetchall()

        return jsonify({"salaries": salaries})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()