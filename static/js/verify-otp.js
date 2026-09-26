const verifyOtpForm = document.getElementById("verifyOtpForm");
const otpInput = document.getElementById("otp");
const otpError = document.getElementById("otpError");
const otpMessage = document.getElementById("otpMessage");
const verifyOtpButton = document.getElementById("verifyOtpButton");

verifyOtpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    otpError.textContent = "";
    otpMessage.textContent = "";

    const otp = otpInput.value.trim();
    const userType = sessionStorage.getItem("forgotUserType");
    const userId = sessionStorage.getItem("forgotUserId");

    if (!userType || !userId) {
        otpMessage.textContent = "Password reset session expired";
        return;
    }

    if (!otp) {
        otpError.textContent = "Enter OTP";
        return;
    }

    if (!/^\d{6}$/.test(otp)) {
        otpError.textContent = "Enter a valid 6-digit OTP";
        return;
    }

    verifyOtpButton.disabled = true;
    verifyOtpButton.textContent = "Verifying...";

    try {
        const response = await fetch("/api/password/forgot/verify-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_type: userType,
                user_id: userId,
                otp: otp
            })
        });

        const data = await response.json();

        if (!response.ok) {
            otpError.textContent = data.message || "Invalid or expired OTP";
            return;
        }

        window.location.href = "/reset-password";

    } catch (error) {
        otpMessage.textContent = "Unable to connect to server";
    } finally {
        verifyOtpButton.disabled = false;
        verifyOtpButton.textContent = "Verify OTP";
    }
});