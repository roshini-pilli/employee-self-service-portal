from flask import Flask, request, redirect, render_template, url_for, session
import mysql.connector
import hashlib
import re
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv("SECRET_KEY")

def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        auth_plugin="mysql_native_password",
        autocommit=True
    )

@app.route("/", methods=["GET", "POST"])
@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "POST":
        emp_id = request.form.get("employee_id", "").strip()
        password = request.form.get("password", "").strip()

        password_hash = hashlib.sha256(password.encode()).hexdigest()
        initial_hash = hashlib.sha256(emp_id.encode()).hexdigest()

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT e.employee_id, e.full_name, l.password_hash
            FROM employees e
            JOIN employee_login l ON e.employee_id=l.employee_id
            WHERE e.employee_id=%s
        """, (emp_id,))
        user = cursor.fetchone()

        cursor.close()
        db.close()

        if not user:
            return render_template("login.html", error="Employee ID not found")

        if user["password_hash"] != password_hash:
            return render_template("login.html", error="Incorrect password")

        session.clear()
        session["employee_id"] = user["employee_id"]
        session["employee_name"] = user["full_name"]

        if user["password_hash"] == initial_hash:
            session["reset_user"] = emp_id
            session["reset_role"] = "employee"
            return redirect(url_for("verify_dob"))

        return redirect(url_for("menu_page"))

    return render_template("login.html")

@app.route("/admin-login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        hr_id = request.form.get("hr_id", "").strip()
        password = request.form.get("password", "").strip()

        password_hash = hashlib.sha256(password.encode()).hexdigest()
        initial_hash = hashlib.sha256(hr_id.encode()).hexdigest()

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT h.hr_id, h.full_name, l.password_hash
            FROM hr h
            JOIN hr_login l ON h.hr_id=l.hr_id
            WHERE h.hr_id=%s
        """, (hr_id,))
        hr = cursor.fetchone()

        cursor.close()
        db.close()

        if not hr:
            return render_template("admin-login.html", error="HR ID not found")

        if hr["password_hash"] != password_hash:
            return render_template("admin-login.html", error="Incorrect password")

        session.clear()
        session["admin_id"] = hr["hr_id"]
        session["admin_name"] = hr["full_name"]

        if hr["password_hash"] == initial_hash:
            session["reset_user"] = hr_id
            session["reset_role"] = "hr"
            return redirect(url_for("verify_dob"))

        return redirect(url_for("hr_menu"))

    return render_template("admin-login.html")
@app.route("/verify-dob", methods=["GET", "POST"])
def verify_dob():
    if request.method == "POST":
        user_id = request.form.get("employee_id")
        dob = request.form.get("dob")

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT e.employee_id
            FROM employees e
            JOIN employee_login l ON e.employee_id = l.employee_id
            WHERE e.employee_id=%s AND e.dob=%s
        """, (user_id, dob))
        emp = cursor.fetchone()

        if emp:
            cursor.close()
            db.close()
            session.clear()
            session["reset_user"] = user_id
            session["reset_role"] = "employee"
            return redirect(url_for("reset_password"))

        cursor.execute("""
            SELECT h.hr_id
            FROM hr h
            JOIN hr_login l ON h.hr_id = l.hr_id
            WHERE h.hr_id=%s AND h.dob=%s
        """, (user_id, dob))
        hr = cursor.fetchone()

        cursor.close()
        db.close()

        if hr:
            session.clear()
            session["reset_user"] = user_id
            session["reset_role"] = "hr"
            return redirect(url_for("reset_password"))

        return render_template("verify-dob.html", error="Invalid ID or Date of Birth")

    return render_template("verify-dob.html")
@app.route("/reset-password", methods=["GET", "POST"])
def reset_password():
    if "reset_user" not in session or "reset_role" not in session:
        return redirect(url_for("login_page"))

    if request.method == "POST":
        new = request.form["new_password"]
        confirm = request.form["confirm_password"]

        if new != confirm:
            return render_template("reset-password.html", error="Passwords do not match")

        if len(new) < 8:
            return render_template("reset-password.html", error="Password must be at least 8 characters long")

        if not re.search(r"[A-Z]", new):
            return render_template("reset-password.html", error="Password must contain at least one capital letter")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", new):
            return render_template("reset-password.html", error="Password must contain at least one special character")

        hashed = hashlib.sha256(new.encode()).hexdigest()
        user_id = session["reset_user"]
        role = session["reset_role"]

        db = get_db()
        cursor = db.cursor(dictionary=True)

        if role == "employee":
            cursor.execute(
                "UPDATE employee_login SET password_hash=%s WHERE employee_id=%s",
                (hashed, user_id)
            )

            cursor.execute(
                "SELECT full_name FROM employees WHERE employee_id=%s",
                (user_id,)
            )
            emp = cursor.fetchone()

            cursor.close()
            db.close()

            session.clear()
            session["employee_id"] = user_id
            session["employee_name"] = emp["full_name"]
            return redirect(url_for("menu_page"))

        else:
            cursor.execute(
                "UPDATE hr_login SET password_hash=%s WHERE hr_id=%s",
                (hashed, user_id)
            )

            cursor.execute(
                "SELECT full_name FROM hr WHERE hr_id=%s",
                (user_id,)
            )
            hr = cursor.fetchone()

            cursor.close()
            db.close()

            session.clear()
            session["admin_id"] = user_id
            session["admin_name"] = hr["full_name"]
            return redirect(url_for("hr_menu"))

    return render_template("reset-password.html")

@app.route("/menu", methods=["GET", "POST"])
def menu_page():
    if "employee_id" not in session:
        return redirect(url_for("login_page"))

    emp_id = session["employee_id"]
    section = request.args.get("section", "profile")
    show_add_form = request.args.get("add") == "1"

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT e.*, c.*
        FROM employees e
        LEFT JOIN contact_info c ON e.employee_id=c.employee_id
        WHERE e.employee_id=%s
    """, (emp_id,))
    user = cursor.fetchone()

    dependants = []
    dependant_requests = []
    attendance = []
    salary = []
    leaves=[]
    error = None

    if section == "dependants":
        cursor.execute("""
            SELECT dependant_name, relation, gender, dob
            FROM dependants
            WHERE employee_id=%s
            ORDER BY dependant_name
        """, (emp_id,))
        dependants = cursor.fetchall()

        # ✅ Requests made by THIS employee
        cursor.execute("""
            SELECT 
                dependant_name,
                relation,
                gender,
                dob,
                status,
                remarks,
                DATE_FORMAT(request_timestamp, '%d-%m-%Y %H:%i') AS request_timestamp,
                DATE_FORMAT(approved_timestamp, '%d-%m-%Y %H:%i') AS approved_timestamp
            FROM dependant_requests
            WHERE employee_id=%s
            ORDER BY request_timestamp DESC
        """, (emp_id,))
        dependant_requests = cursor.fetchall()


        if request.method == "POST":
            name = request.form.get("dependant_name")
            relation = request.form.get("relation")
            gender = request.form.get("gender")
            dob = request.form.get("dob")

            if relation in ("Father", "Father In Law"):
                gender = "Male"
            elif relation in ("Mother", "Mother In Law"):
                gender = "Female"

            if not name or not relation or not gender or not dob:
                cursor.close()
                db.close()
                return render_template(
                    "menu.html",
                    name=session["employee_name"],
                    section="dependants",
                    show_add_form=True,
                    user=user,
                    dependants=dependants,
                    error="All fields are mandatory"
                )

            cursor.execute("""
                INSERT INTO dependant_requests
                (employee_id, dependant_name, relation, gender, dob)
                VALUES (%s,%s,%s,%s,%s)
            """, (emp_id, name, relation, gender, dob))

            cursor.close()
            db.close()
            return redirect(url_for("menu_page", section="dependants"))

    if section == "attendance":
        cursor.execute("""
            SELECT * FROM attendance
            WHERE employee_id=%s
            ORDER BY year DESC, month DESC
        """, (emp_id,))
        attendance = cursor.fetchall()

    if section == "pay":
        month_year = request.args.get("month_year")

        query = "SELECT * FROM salary WHERE employee_id = %s"
        params = [emp_id]

        if month_year:
            month, year = month_year.split("-")
            query += " AND month = %s AND year = %s"
            params.extend([month, year])

        query += " ORDER BY year DESC"

        cursor.execute(query, tuple(params))
        salary = cursor.fetchall()

    
    if section == "leaves":
        cursor.execute("""
            SELECT leave_date, leave_type, description, status, remark
            FROM leave_requests
            WHERE employee_id=%s
            ORDER BY requested_at DESC
        """, (emp_id,))
        leaves = cursor.fetchall()

        if request.method == "POST":
            leave_date = request.form.get("leave_date")
            leave_type = request.form.get("leave_type")
            description = request.form.get("description")

            cursor.execute("""
                INSERT INTO leave_requests
                (employee_id, leave_date, leave_type, description)
                VALUES (%s,%s,%s,%s)
            """, (emp_id, leave_date, leave_type, description))

            cursor.close()
            db.close()
            return redirect(url_for("menu_page", section="leaves"))


    cursor.close()
    db.close()

    return render_template(
        "menu.html",
        name=session["employee_name"],
        section=section,
        show_add_form=show_add_form,
        user=user,
        dependants=dependants,
        dependant_requests=dependant_requests,
        attendance=attendance,
        salary=salary,
        leaves=leaves,
        error=error
    )

@app.route("/admin-dashboard")
def hr_menu():
    if "admin_id" not in session:
        return redirect(url_for("admin_login"))

    section = request.args.get("section", "profile")
    hr_id = session["admin_id"]

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM hr WHERE hr_id=%s", (hr_id,))
    hr_user = cursor.fetchone()

    if not hr_user:
        cursor.close()
        db.close()
        return redirect(url_for("admin_login"))

    department = hr_user["department"]

    employees = []
    dependants = []
    dependant_requests = []
    attendance = []
    salary = []
    new_leaves = []
    processed_leaves = []

    if section == "employees":
        cursor.execute(
            "SELECT * FROM employees WHERE department=%s",
            (department,)
        )
        employees = cursor.fetchall()

    if section == "dependants":
        cursor.execute("""
            SELECT 
                d.dependant_id,
                d.employee_id,
                d.dependant_name,
                d.relation,
                d.gender,
                d.dob,
                e.full_name
            FROM dependants d
            JOIN employees e ON d.employee_id = e.employee_id
            WHERE e.department = %s
        """, (department,))
        dependants = cursor.fetchall()

        cursor.execute("""
            SELECT dr.*, e.full_name
            FROM dependant_requests dr
            JOIN employees e ON dr.employee_id=e.employee_id
            WHERE e.department=%s AND dr.status='PENDING'
            ORDER BY dr.request_timestamp DESC
        """, (department,))
        dependant_requests = cursor.fetchall()

    if section == "attendance":
        month_year = request.args.get("month_year")

        query = """
            SELECT a.*, e.full_name
            FROM attendance a
            JOIN employees e ON a.employee_id=e.employee_id
            WHERE e.department=%s
        """
        params = [department]

        if month_year:
            month, year = month_year.split("-")
            query += " AND a.month=%s AND a.year=%s"
            params.extend([month, year])

        query += " ORDER BY a.year DESC, a.month DESC"

        cursor.execute(query, tuple(params))
        attendance = cursor.fetchall()


    if section == "pay":
        emp_id = request.args.get("employee_id")
        month_year = request.args.get("month_year")


        query = """
            SELECT s.*, e.full_name
            FROM salary s
            JOIN employees e ON s.employee_id = e.employee_id
            WHERE e.department = %s
        """
        params = [department]

        if emp_id:
            query += " AND s.employee_id = %s"
            params.append(emp_id)

        if month_year:
            month, year = month_year.split("-")
            query += " AND s.month=%s AND s.year=%s"
            params.extend([month, year])


        query += " ORDER BY s.year DESC, s.month DESC"

        cursor.execute(query, tuple(params))
        salary = cursor.fetchall()
    
    if section == "leaves":
        cursor.execute("""
            SELECT * FROM leave_requests
            WHERE status='PENDING'
            ORDER BY requested_at DESC
        """)
        new_leaves = cursor.fetchall()

        cursor.execute("""
            SELECT * FROM leave_requests
            WHERE status!='PENDING'
            ORDER BY processed_at DESC
        """)
        processed_leaves = cursor.fetchall()

    cursor.close()
    db.close()

    return render_template(
        "admin-dashboard.html",
        name=session["admin_name"],
        section=section,
        user=hr_user,
        employees=employees,
        dependants=dependants,
        dependant_requests=dependant_requests,
        attendance=attendance,
        salary=salary,
        new_leaves=new_leaves,
        processed_leaves=processed_leaves

    )

@app.route("/approve-dependant/<int:req_id>")
def approve_dependant(req_id):
    if "admin_id" not in session:
        return redirect(url_for("admin_login"))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT * FROM dependant_requests
        WHERE request_id=%s AND status='PENDING'
    """, (req_id,))
    req = cursor.fetchone()

    if req:
        cursor.execute(
            "SELECT relation_id FROM relation WHERE relation=%s",
            (req["relation"],)
        )
        rel = cursor.fetchone()

        if not rel:
            cursor.close()
            db.close()
            return "Invalid relation", 400

        relation_id = rel["relation_id"]

        dependant_id = req["employee_id"] * 100 + relation_id

        cursor.execute("""
            INSERT INTO dependants
            (dependant_id, employee_id, dependant_name, relation, gender, dob)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            dependant_id,
            req["employee_id"],
            req["dependant_name"],
            req["relation"],
            req["gender"],
            req["dob"]
        ))

        cursor.execute("""
            UPDATE dependant_requests
            SET status='APPROVED', approved_timestamp=NOW()
            WHERE request_id=%s
        """, (req_id,))

    cursor.close()
    db.close()
    return redirect(url_for("hr_menu", section="dependants"))

@app.route("/reject-dependant/<int:req_id>")
def reject_dependant(req_id):
    if "admin_id" not in session:
        return redirect(url_for("admin_login"))

    remarks = request.args.get("remarks")

    if not remarks:
        return redirect(url_for("hr_menu", section="dependants"))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        UPDATE dependant_requests
        SET status='REJECTED',
            approved_timestamp=NOW(),
            remarks=%s
        WHERE request_id=%s AND status='PENDING'
    """, (remarks, req_id))

    cursor.close()
    db.close()

    return redirect(url_for("hr_menu", section="dependants"))

@app.route("/approve-leave/<int:leave_id>")
def approve_leave(leave_id):
    if "admin_id" not in session:
        return redirect(url_for("admin_login"))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT employee_id, leave_type, leave_date
        FROM leave_requests
        WHERE leave_id=%s
    """, (leave_id,))
    l = cursor.fetchone()

    if not l:
        cursor.close()
        db.close()
        return redirect(url_for("hr_menu", section="leaves"))

    month = l["leave_date"].strftime("%b")
    year = l["leave_date"].year

    field_map = {
        "CL": "casual_leave",
        "SL": "sick_leave",
        "OL": "other_leave"
    }

    cursor.execute(f"""
        UPDATE attendance
        SET {field_map[l["leave_type"]]} =
            {field_map[l["leave_type"]]} + 1
        WHERE employee_id=%s AND month=%s AND year=%s
    """, (l["employee_id"], month, year))

    cursor.execute("""
        UPDATE leave_requests
        SET status='APPROVED',
            processed_at=NOW(),
            processed_by=%s
        WHERE leave_id=%s
    """, (session["admin_id"], leave_id))

    cursor.close()
    db.close()
    return redirect(url_for("hr_menu", section="leaves"))
@app.route("/reject-leave/<int:leave_id>")
def reject_leave(leave_id):
    if "admin_id" not in session:
        return redirect(url_for("admin_login"))

    remark = request.args.get("remark")
    if not remark:
        return redirect(url_for("hr_menu", section="leaves"))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        UPDATE leave_requests
        SET status='REJECTED',
            remark=%s,
            processed_at=NOW(),
            processed_by=%s
        WHERE leave_id=%s
    """, (remark, session["admin_id"], leave_id))

    cursor.close()
    db.close()
    return redirect(url_for("hr_menu", section="leaves"))


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))

if __name__ == "__main__":
    app.run(debug=True)
