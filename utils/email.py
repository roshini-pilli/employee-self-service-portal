import smtplib
from email.message import EmailMessage

from config import Config


def send_otp_email(recipient_email, otp):
    message = EmailMessage()

    message["Subject"] = "ESS Password Reset OTP"
    message["From"] = Config.SMTP_FROM
    message["To"] = recipient_email

    message.set_content(
        f"""Hello,

Your OTP for resetting your ESS password is:

{otp}

This OTP is valid for 5 minutes.

If you did not request a password reset, please ignore this email.

Regards,
Employee Self Service Portal
"""
    )

    with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
        server.starttls()
        server.login(
            Config.SMTP_USERNAME,
            Config.SMTP_PASSWORD
        )
        server.send_message(message)