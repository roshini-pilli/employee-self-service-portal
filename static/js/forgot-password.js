const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const userTypeInput = document.getElementById("userType");
const userIdInput = document.getElementById("userId");

const userTypeError = document.getElementById("userTypeError");
const userIdError = document.getElementById("userIdError");
const forgotMessage = document.getElementById("forgotMessage");

const sendOtpButton = document.getElementById("sendOtpButton");

forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    userTypeError.textContent = "";
    userIdError.textContent = "";
    forgotMessage.textContent = "";

    const userType = userTypeInput.value;
    const userId = userIdInput.value.trim();

    let valid = true;

    if (!userType) {
        userTypeError.textContent = "Select account type";
        valid = false;
    }

    if (!userId) {
        userIdError.textContent = "Enter your ID";
        valid = false;
    }

    if (!valid) {
        return;
    }

    sendOtpButton.disabled = true;
    sendOtpButton.textContent = "Sending...";

    try {
        const response = await fetch("/api/password/forgot/send-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_type: userType,
                user_id: userId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.message === "Enter your ID") {
                userIdError.textContent = data.message;
            } else {
                forgotMessage.textContent = data.message || "Unable to send OTP";
            }

            return;
        }

        sessionStorage.setItem("forgotUserType", userType);
        sessionStorage.setItem("forgotUserId", userId);

        window.location.href = "/verify-otp";

    } catch (error) {
        forgotMessage.textContent = "Unable to connect to server";
    } finally {
        sendOtpButton.disabled = false;
        sendOtpButton.textContent = "Send OTP";
    }
});