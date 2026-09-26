from flask import Flask
import mysql.connector

from config import Config
from routes.auth_routes import auth_bp
from routes.password_routes import password_bp
from routes.employee_routes import employee_bp
from routes.page_routes import page_bp
from routes.dependant_routes import dependant_bp
from routes.hr_routes import hr_bp
from routes.leave_routes import leave_bp
from routes.payroll_routes import payroll_bp

app = Flask(__name__)
app.config.from_object(Config)


def get_db_connection():
    return mysql.connector.connect(
        host=app.config["MYSQL_HOST"],
        port=app.config["MYSQL_PORT"],
        user=app.config["MYSQL_USER"],
        password=app.config["MYSQL_PASSWORD"],
        database=app.config["MYSQL_DATABASE"]
    )


app.register_blueprint(auth_bp)
app.register_blueprint(password_bp)
app.register_blueprint(employee_bp)
app.register_blueprint(dependant_bp)
app.register_blueprint(hr_bp)
app.register_blueprint(leave_bp)
app.register_blueprint(payroll_bp)
app.register_blueprint(page_bp)


@app.route("/api/health")
def health_check():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        database = cursor.fetchone()[0]

        return {
            "status": "ok",
            "database": database
        }

    except mysql.connector.Error:
        return {
            "status": "error",
            "message": "Database connection failed"
        }, 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))