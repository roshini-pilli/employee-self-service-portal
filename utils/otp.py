import hashlib
import secrets
from datetime import datetime, timedelta


def generate_otp():
    return f"{secrets.randbelow(1000000):06d}"


def hash_otp(otp):
    return hashlib.sha256(otp.encode()).hexdigest()


def verify_otp(otp, otp_hash):
    return secrets.compare_digest(
        hash_otp(otp),
        otp_hash
    )


def get_otp_expiry():
    return datetime.now() + timedelta(minutes=5)