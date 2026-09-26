const resetForm = document.getElementById("resetPasswordForm");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

const newPasswordError = document.getElementById("newPasswordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");
const resetMessage = document.getElementById("resetMessage");
const resetButton = document.getElementById("resetButton");

const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

toggleNewPassword.addEventListener("click", () => {
    if (newPasswordInput.type === "password") {
        newPasswordInput.type = "text";
        toggleNewPassword.textContent = "Hide";
    } else {
        newPasswordInput.type = "password";
        toggleNewPassword.textContent = "Show";
    }
});

toggleConfirmPassword.addEventListener("click", () => {
    if (confirmPasswordInput.type === "password") {
        confirmPasswordInput.type = "text";
        toggleConfirmPassword.textContent = "Hide";
    } else {
        confirmPasswordInput.type = "password";
        toggleConfirmPassword.textContent = "Show";
    }
});

resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    newPasswordError.textContent = "";
    confirmPasswordError.textContent = "";
    resetMessage.textContent = "";

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let valid = true;

    if (!newPassword) {
        newPasswordError.textContent = "Enter a new password";
        valid = false;
    }

    if (!confirmPassword) {
        confirmPasswordError.textContent = "Confirm your new password";
        valid = false;
    }

    if (!valid) {
        return;
    }

    if (newPassword !== confirmPassword) {
        confirmPasswordError.textContent = "Passwords do not match";
        return;
    }

    if (
        newPassword.length < 8 ||
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/\d/.test(newPassword) ||
        !/[^A-Za-z0-9]/.test(newPassword)
    ) {
        newPasswordError.textContent = "Password does not meet the requirements";
        return;
    }

    resetButton.disabled = true;
    resetButton.textContent = "Saving...";

    try {
        const response = await fetch("/api/password/reset-first-login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            resetMessage.textContent = data.message || "Unable to change password";
            return;
        }

        sessionStorage.removeItem("forgotUserType");
        sessionStorage.removeItem("forgotUserId");

        window.location.href = "/dashboard";

    } catch (error) {
        resetMessage.textContent = "Unable to connect to server";
    } finally {
        resetButton.disabled = false;
        resetButton.textContent = "Set Password";
    }
});