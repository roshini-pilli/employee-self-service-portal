from functools import wraps
from flask import session, jsonify


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_type" not in session or "user_id" not in session:
            return jsonify({"message": "Unauthorized"}), 401

        return f(*args, **kwargs)

    return decorated_function


def employee_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_type" not in session or "user_id" not in session:
            return jsonify({"message": "Unauthorized"}), 401

        if session.get("user_type") != "EMPLOYEE":
            return jsonify({"message": "Access denied"}), 403

        return f(*args, **kwargs)

    return decorated_function


def hr_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_type" not in session or "user_id" not in session:
            return jsonify({"message": "Unauthorized"}), 401

        if session.get("user_type") != "HR":
            return jsonify({"message": "Access denied"}), 403

        return f(*args, **kwargs)

    return decorated_function