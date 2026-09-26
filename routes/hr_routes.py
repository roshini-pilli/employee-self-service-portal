from flask import Blueprint, jsonify, request, session
import mysql.connector

from config import Config
from utils.auth_middleware import hr_required

hr_bp = Blueprint("hr", __name__, url_prefix="/api/hr")


def get_db_connection():
    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )


def close_db(connection, cursor):
    if cursor:
        cursor.close()
    if connection:
        connection.close()


def serialize_dates(rows):
    for row in rows:
        for key, value in row.items():
            if hasattr(value, "isoformat"):
                row[key] = value.isoformat()
    return rows


@hr_bp.route("/profile", methods=["GET"])
@hr_required
def get_profile():
    hr_id = session["user_id"]

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
                h.gender,
                h.dob,
                h.department,
                h.role,
                c.phone,
                c.email,
                c.address_line1,
                c.address_line2,
                c.city,
                c.state,
                c.pincode,
                c.country
            FROM hr h
            LEFT JOIN hr_contact_info c
                ON h.hr_id = c.hr_id
            WHERE h.hr_id = %s
            """,
            (hr_id,)
        )

        profile = cursor.fetchone()

        if not profile:
            return jsonify({"message": "HR not found"}), 404

        serialize_dates([profile])

        return jsonify({"hr": profile})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route("/employees/details", methods=["GET"])
@hr_required
def get_department_employees():
    department = session["department"]
    employee_id = request.args.get("employee_id", "").strip()

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        conditions = ["e.department = %s"]
        params = [department]

        if employee_id:
            if not employee_id.isdigit() or len(employee_id) != 6:
                return jsonify({"message": "Enter a valid employee ID"}), 400

            conditions.append("e.employee_id = %s")
            params.append(employee_id)

        cursor.execute(
            f"""
            SELECT
                e.employee_id,
                e.full_name,
                e.gender,
                e.dob,
                e.department,
                e.role,
                c.phone,
                c.email
            FROM employees e
            LEFT JOIN contact_info c
                ON e.employee_id = c.employee_id
            WHERE {" AND ".join(conditions)}
            ORDER BY e.employee_id
            """,
            tuple(params)
        )

        employees = cursor.fetchall()
        serialize_dates(employees)

        return jsonify({"employees": employees})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route("/employees/dependants", methods=["GET"])
@hr_required
def get_employee_dependants():
    department = session["department"]
    employee_id = request.args.get("employee_id", "").strip()

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        conditions = ["e.department = %s"]
        params = [department]

        if employee_id:
            if not employee_id.isdigit() or len(employee_id) != 6:
                return jsonify({"message": "Enter a valid employee ID"}), 400

            conditions.append("d.employee_id = %s")
            params.append(employee_id)

        cursor.execute(
            f"""
            SELECT
                d.dependant_id,
                d.employee_id,
                e.full_name AS employee_name,
                d.dependant_name,
                d.relation_id,
                rm.relation_name,
                d.gender,
                d.dob
            FROM dependants d
            INNER JOIN employees e
                ON d.employee_id = e.employee_id
            INNER JOIN relation_master rm
                ON d.relation_id = rm.relation_id
            WHERE {" AND ".join(conditions)}
            ORDER BY d.employee_id, d.relation_id
            """,
            tuple(params)
        )

        dependants = cursor.fetchall()
        serialize_dates(dependants)

        return jsonify({"dependants": dependants})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route("/dependants/requests", methods=["GET"])
@hr_required
def get_dependant_requests():
    department = session["department"]
    status = request.args.get("status", "PENDING").upper()

    if status not in ["PENDING", "PROCESSED"]:
        return jsonify({"message": "Invalid status"}), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        if status == "PENDING":
            status_condition = "dr.status = 'PENDING'"
        else:
            status_condition = "dr.status IN ('APPROVED', 'REJECTED')"

        cursor.execute(
            f"""
            SELECT
                dr.request_id,
                dr.employee_id,
                e.full_name AS employee_name,
                dr.dependant_name,
                dr.relation_id,
                rm.relation_name,
                dr.gender,
                dr.dob,
                dr.status,
                dr.request_timestamp,
                dr.processed_at,
                dr.processed_by,
                dr.remarks
            FROM dependant_requests dr
            INNER JOIN employees e
                ON dr.employee_id = e.employee_id
            INNER JOIN relation_master rm
                ON dr.relation_id = rm.relation_id
            WHERE e.department = %s
              AND {status_condition}
            ORDER BY dr.request_timestamp DESC
            """,
            (department,)
        )

        requests = cursor.fetchall()
        serialize_dates(requests)

        return jsonify({"requests": requests})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route(
    "/dependants/requests/<int:request_id>/<action>",
    methods=["POST"]
)
@hr_required
def process_dependant_request(request_id, action):
    if action not in ["approve", "reject"]:
        return jsonify({"message": "Invalid action"}), 400

    department = session["department"]
    hr_id = session["user_id"]

    data = request.get_json(silent=True) or {}
    remarks = str(data.get("remarks", "")).strip()

    if action == "reject" and not remarks:
        return jsonify({
            "message": "Remarks are required when rejecting a request"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        connection.start_transaction()

        cursor.execute(
            """
            SELECT
                dr.request_id,
                dr.employee_id,
                dr.dependant_name,
                dr.relation_id,
                dr.gender,
                dr.dob,
                dr.status
            FROM dependant_requests dr
            INNER JOIN employees e
                ON dr.employee_id = e.employee_id
            WHERE dr.request_id = %s
              AND e.department = %s
            FOR UPDATE
            """,
            (request_id, department)
        )

        request_data = cursor.fetchone()

        if not request_data:
            connection.rollback()
            return jsonify({"message": "Request not found"}), 404

        if request_data["status"] != "PENDING":
            connection.rollback()
            return jsonify({
                "message": "Request has already been processed"
            }), 400

        if action == "approve":
            dependant_id = (
                int(request_data["employee_id"]) * 100
                + int(request_data["relation_id"])
            )

            cursor.execute(
                """
                SELECT dependant_id
                FROM dependants
                WHERE employee_id = %s
                  AND relation_id = %s
                """,
                (
                    request_data["employee_id"],
                    request_data["relation_id"]
                )
            )

            existing = cursor.fetchone()

            if existing:
                connection.rollback()
                return jsonify({
                    "message": "A dependant with this relation already exists"
                }), 400

            cursor.execute(
                """
                INSERT INTO dependants (
                    dependant_id,
                    employee_id,
                    dependant_name,
                    relation_id,
                    gender,
                    dob
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    dependant_id,
                    request_data["employee_id"],
                    request_data["dependant_name"],
                    request_data["relation_id"],
                    request_data["gender"],
                    request_data["dob"]
                )
            )

            cursor.execute(
                """
                UPDATE dependant_requests
                SET
                    status = 'APPROVED',
                    processed_at = CURRENT_TIMESTAMP,
                    processed_by = %s,
                    remarks = %s
                WHERE request_id = %s
                """,
                (hr_id, remarks or None, request_id)
            )

        else:
            cursor.execute(
                """
                UPDATE dependant_requests
                SET
                    status = 'REJECTED',
                    processed_at = CURRENT_TIMESTAMP,
                    processed_by = %s,
                    remarks = %s
                WHERE request_id = %s
                """,
                (hr_id, remarks, request_id)
            )

        connection.commit()

        return jsonify({
            "message": (
                "Dependant request approved"
                if action == "approve"
                else "Dependant request rejected"
            )
        })

    except mysql.connector.Error:
        if connection:
            connection.rollback()

        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route("/employees/leave", methods=["GET"])
@hr_required
def get_employee_leave():
    department = session["department"]

    employee_id = request.args.get("employee_id", "").strip()
    month = request.args.get("month", "").strip()
    year = request.args.get("year", "").strip()

    valid_months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        conditions = ["e.department = %s"]
        params = [department]

        if employee_id:
            if not employee_id.isdigit() or len(employee_id) != 6:
                return jsonify({"message": "Enter a valid employee ID"}), 400

            conditions.append("lr.employee_id = %s")
            params.append(employee_id)

        if month:
            if month not in valid_months:
                return jsonify({"message": "Invalid month"}), 400

            conditions.append(
                "DATE_FORMAT(lr.leave_date, '%%b') = %s"
            )
            params.append(month)

        if year:
            if not year.isdigit() or len(year) != 4:
                return jsonify({"message": "Invalid year"}), 400

            conditions.append(
                "YEAR(lr.leave_date) = %s"
            )
            params.append(int(year))

        cursor.execute(
            f"""
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
            ORDER BY lr.leave_date DESC, lr.requested_at DESC
            """,
            tuple(params)
        )

        leaves = cursor.fetchall()
        serialize_dates(leaves)

        return jsonify({"leaves": leaves})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route("/leave/requests", methods=["GET"])
@hr_required
def get_leave_requests():
    department = session["department"]
    status = request.args.get("status", "PENDING").upper()

    if status not in ["PENDING", "PROCESSED"]:
        return jsonify({"message": "Invalid status"}), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        if status == "PENDING":
            status_condition = "lr.status = 'PENDING'"
        else:
            status_condition = "lr.status IN ('APPROVED', 'REJECTED')"

        cursor.execute(
            f"""
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
            WHERE e.department = %s
              AND {status_condition}
            ORDER BY lr.requested_at DESC
            """,
            (department,)
        )

        requests = cursor.fetchall()
        serialize_dates(requests)

        return jsonify({"requests": requests})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route(
    "/leave/requests/<int:leave_id>/<action>",
    methods=["POST"]
)
@hr_required
def process_leave_request(leave_id, action):
    if action not in ["approve", "reject"]:
        return jsonify({"message": "Invalid action"}), 400

    department = session["department"]
    hr_id = session["user_id"]

    data = request.get_json(silent=True) or {}
    remarks = str(data.get("remarks", "")).strip()

    if action == "reject" and not remarks:
        return jsonify({
            "message": "Remarks are required when rejecting a request"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        connection.start_transaction()

        cursor.execute(
            """
            SELECT
                lr.leave_id,
                lr.employee_id,
                lr.leave_date,
                lr.leave_type,
                lr.status
            FROM leave_requests lr
            INNER JOIN employees e
                ON lr.employee_id = e.employee_id
            WHERE lr.leave_id = %s
              AND e.department = %s
            FOR UPDATE
            """,
            (leave_id, department)
        )

        leave = cursor.fetchone()

        if not leave:
            connection.rollback()
            return jsonify({"message": "Leave request not found"}), 404

        if leave["status"] != "PENDING":
            connection.rollback()
            return jsonify({
                "message": "Leave request has already been processed"
            }), 400

        if action == "approve":
            cursor.execute(
                """
                UPDATE leave_requests
                SET
                    status = 'APPROVED',
                    processed_at = CURRENT_TIMESTAMP,
                    processed_by = %s,
                    remark = %s
                WHERE leave_id = %s
                """,
                (hr_id, remarks or None, leave_id)
            )
        else:
            cursor.execute(
                """
                UPDATE leave_requests
                SET
                    status = 'REJECTED',
                    processed_at = CURRENT_TIMESTAMP,
                    processed_by = %s,
                    remark = %s
                WHERE leave_id = %s
                """,
                (hr_id, remarks, leave_id)
            )

        connection.commit()

        return jsonify({
            "message": (
                "Leave request approved"
                if action == "approve"
                else "Leave request rejected"
            )
        })

    except mysql.connector.Error:
        if connection:
            connection.rollback()

        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route("/your-dependants", methods=["GET"])
@hr_required
def get_your_dependants():
    hr_id = session["user_id"]

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                d.dependant_id,
                d.employee_id,
                d.dependant_name,
                d.relation_id,
                rm.relation_name,
                d.gender,
                d.dob
            FROM dependants d
            INNER JOIN relation_master rm
                ON d.relation_id = rm.relation_id
            WHERE d.employee_id = %s
            ORDER BY d.relation_id
            """,
            (hr_id,)
        )

        dependants = cursor.fetchall()
        serialize_dates(dependants)

        return jsonify({"dependants": dependants})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route("/your-leaves", methods=["GET"])
@hr_required
def get_your_leaves():
    hr_id = session["user_id"]

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                month,
                year,
                casual_leave,
                sick_leave,
                other_leave,
                (
                    casual_leave +
                    sick_leave +
                    other_leave
                ) AS total_leaves
            FROM attendance
            WHERE employee_id = %s
            ORDER BY
                year DESC,
                FIELD(
                    month,
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ) DESC
            """,
            (hr_id,)
        )

        leaves = cursor.fetchall()

        return jsonify({"leaves": leaves})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)


@hr_bp.route("/your-payroll", methods=["GET"])
@hr_required
def get_your_payroll():
    hr_id = session["user_id"]

    month = request.args.get("month", "").strip()
    year = request.args.get("year", "").strip()

    valid_months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]

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
        params = [hr_id]

        if month:
            conditions.append("month = %s")
            params.append(month)

        if year:
            conditions.append("year = %s")
            params.append(year)

        cursor.execute(
            f"""
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
            """,
            tuple(params)
        )

        salaries = cursor.fetchall()

        return jsonify({"salaries": salaries})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        close_db(connection, cursor)