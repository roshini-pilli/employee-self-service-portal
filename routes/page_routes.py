from flask import Blueprint, render_template, session, redirect, url_for

page_bp = Blueprint("pages", __name__)


@page_bp.route("/")
def home():
    if session.get("user_type") == "HR":
        return redirect(url_for("pages.hr_dashboard_page"))

    if session.get("user_type") == "EMPLOYEE":
        return redirect(url_for("pages.dashboard_page"))

    return redirect(url_for("pages.login_page"))


@page_bp.route("/login")
def login_page():
    return render_template("login.html")


@page_bp.route("/hr-login")
def hr_login_page():
    return render_template("hr-login.html")


@page_bp.route("/reset-password")
def reset_password_page():
    if "user_type" in session and "user_id" in session:
        return render_template("reset-password.html")

    if (
        session.get("password_reset_verified")
        and session.get("password_reset_user_type")
        and session.get("password_reset_user_id")
    ):
        return render_template("reset-password.html")

    return redirect(url_for("pages.login_page"))


@page_bp.route("/forgot-password")
def forgot_password_page():
    return render_template("forgot-password.html")


@page_bp.route("/verify-otp")
def verify_otp_page():
    return render_template("verify-otp.html")


@page_bp.route("/dashboard")
def dashboard_page():
    if session.get("user_type") != "EMPLOYEE":
        if session.get("user_type") == "HR":
            return redirect(url_for("pages.hr_dashboard_page"))

        return redirect(url_for("pages.login_page"))

    return render_template("dashboard.html")


@page_bp.route("/hr-dashboard")
def hr_dashboard_page():
    if session.get("user_type") != "HR":
        if session.get("user_type") == "EMPLOYEE":
            return redirect(url_for("pages.dashboard_page"))

        return redirect(url_for("pages.hr_login_page"))

    return render_template("hr-dashboard.html")