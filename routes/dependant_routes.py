from flask import Blueprint, request, jsonify, session
import mysql.connector
from datetime import date
from config import Config
from utils.auth_middleware import employee_required

dependant_bp = Blueprint("dependant", __name__, url_prefix="/api/employee/dependants")

def get_db_connection():
    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )

def calculate_age(dob):
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

def validate_dependant(employee, relation_id, gender, dob):
    employee_dob = employee["dob"]
    age = calculate_age(dob)

    if relation_id in (2, 3) and gender != ("Male" if relation_id == 2 else "Female"):
        return "Father must be male and Mother must be female"

    if relation_id in (4, 5) and gender != ("Male" if relation_id == 4 else "Female"):
        return "Father In Law must be male and Mother In Law must be female"

    if relation_id in (11, 12) and dob < employee_dob:
        return "Child DOB cannot be before employee DOB"

    if relation_id in (23, 24) and age > 21:
        return "Sibling age cannot be above 21"

    if relation_id in (11, 12) and age > 21:
        return "Child age cannot be above 21"

    if relation_id in (2, 3, 4, 5) and dob > employee_dob:
        return "Parent DOB cannot be after employee DOB"

    return None

@dependant_bp.route("", methods=["GET"])
@employee_required
def get_dependants():
    employee_id = session["user_id"]

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                d.employee_id,
                d.dependant_id,
                d.dependant_name,
                r.relation_name,
                d.gender,
                d.dob
            FROM dependants d
            INNER JOIN relation_master r
                ON d.relation_id = r.relation_id
            WHERE d.employee_id = %s
            ORDER BY d.dependant_id
            """,
            (employee_id,)
        )

        dependants = cursor.fetchall()

        for dependant in dependants:
            if dependant["dob"]:
                dependant["dob"] = dependant["dob"].isoformat()

        return jsonify({"dependants": dependants})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@dependant_bp.route("/relations", methods=["GET"])
@employee_required
def get_relations():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT relation_id, relation_name
            FROM relation_master
            ORDER BY relation_id
            """
        )

        relations = cursor.fetchall()

        return jsonify({"relations": relations})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@dependant_bp.route("/requests", methods=["GET"])
@employee_required
def get_requests():
    employee_id = session["user_id"]

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                dr.request_id,
                dr.employee_id,
                dr.dependant_name,
                r.relation_name,
                dr.gender,
                dr.dob,
                dr.status,
                dr.request_timestamp,
                dr.processed_at,
                dr.remarks
            FROM dependant_requests dr
            INNER JOIN relation_master r
                ON dr.relation_id = r.relation_id
            WHERE dr.employee_id = %s
            ORDER BY dr.request_timestamp DESC
            """,
            (employee_id,)
        )

        requests = cursor.fetchall()

        for item in requests:
            if item["dob"]:
                item["dob"] = item["dob"].isoformat()

            if item["request_timestamp"]:
                item["request_timestamp"] = item["request_timestamp"].isoformat()

            if item["processed_at"]:
                item["processed_at"] = item["processed_at"].isoformat()

        return jsonify({"requests": requests})

    except mysql.connector.Error:
        return jsonify({"message": "Server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@dependant_bp.route("/requests", methods=["POST"])
@employee_required
def create_request():
    employee_id = session["user_id"]
    data = request.get_json(silent=True) or {}

    dependant_name = str(data.get("dependant_name", "")).strip()
    relation_id = data.get("relation_id")
    gender = str(data.get("gender", "")).strip()
    dob_value = str(data.get("dob", "")).strip()

    if not dependant_name:
        return jsonify({"message": "Enter dependant name"}), 400

    if len(dependant_name) > 100:
        return jsonify({"message": "Dependant name is too long"}), 400

    try:
        relation_id = int(relation_id)
    except (TypeError, ValueError):
        return jsonify({"message": "Select a valid relation"}), 400

    if not gender:
        return jsonify({"message": "Select gender"}), 400

    if not dob_value:
        return jsonify({"message": "Select date of birth"}), 400

    try:
        dependant_dob = date.fromisoformat(dob_value)
    except ValueError:
        return jsonify({"message": "Enter a valid date of birth"}), 400

    today = date.today()

    if dependant_dob > today:
        return jsonify({"message": "Date of birth cannot be in the future"}), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT employee_id, dob
            FROM employees
            WHERE employee_id = %s
            """,
            (employee_id,)
        )

        employee = cursor.fetchone()

        if not employee:
            return jsonify({"message": "Employee not found"}), 404

        cursor.execute(
            """
            SELECT relation_id
            FROM relation_master
            WHERE relation_id = %s
            """,
            (relation_id,)
        )

        relation = cursor.fetchone()

        if not relation:
            return jsonify({"message": "Invalid relation"}), 400

        validation_error = validate_dependant(
            employee,
            relation_id,
            gender,
            dependant_dob
        )

        if validation_error:
            return jsonify({"message": validation_error}), 400

        cursor.execute(
            """
            SELECT dependant_id
            FROM dependants
            WHERE employee_id = %s
              AND relation_id = %s
            """,
            (employee_id, relation_id)
        )

        if cursor.fetchone():
            return jsonify({
                "message": "A dependant with this relation already exists"
            }), 409

        cursor.execute(
            """
            SELECT request_id
            FROM dependant_requests
            WHERE employee_id = %s
              AND relation_id = %s
              AND status = 'PENDING'
            """,
            (employee_id, relation_id)
        )

        if cursor.fetchone():
            return jsonify({
                "message": "A request for this relation is already pending"
            }), 409

        cursor.execute(
            """
            INSERT INTO dependant_requests
            (
                employee_id,
                dependant_name,
                relation_id,
                gender,
                dob
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                employee_id,
                dependant_name,
                relation_id,
                gender,
                dependant_dob
            )
        )

        connection.commit()

        return jsonify({
            "message": "Dependant request submitted successfully"
        }), 201

    except mysql.connector.Error:
        if connection:
            connection.rollback()
        return jsonify({"message": "Server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()