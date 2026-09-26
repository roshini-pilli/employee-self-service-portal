const hrLoginForm = document.getElementById("hrLoginForm");
const hrIdInput = document.getElementById("hrId");
const hrPasswordInput = document.getElementById("hrPassword");

const hrIdError = document.getElementById("hrIdError");
const hrPasswordError = document.getElementById("hrPasswordError");
const hrLoginMessage = document.getElementById("hrLoginMessage");

const hrLoginButton = document.getElementById("hrLoginButton");
const toggleHrPassword = document.getElementById("toggleHrPassword");

toggleHrPassword.addEventListener("click", () => {
    if (hrPasswordInput.type === "password") {
        hrPasswordInput.type = "text";
        toggleHrPassword.textContent = "Hide";
    } else {
        hrPasswordInput.type = "password";
        toggleHrPassword.textContent = "Show";
    }
});

hrLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    hrIdError.textContent = "";
    hrPasswordError.textContent = "";
    hrLoginMessage.textContent = "";

    const hrId = hrIdInput.value.trim();
    const password = hrPasswordInput.value;

    let valid = true;

    if (!hrId) {
        hrIdError.textContent = "Enter HR ID";
        valid = false;
    }

    if (!password) {
        hrPasswordError.textContent = "Enter password";
        valid = false;
    }

    if (!valid) {
        return;
    }

    hrLoginButton.disabled = true;
    hrLoginButton.textContent = "Logging in...";

    try {
        const response = await fetch("/api/auth/hr/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                hr_id: hrId,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.message === "Enter a valid HR ID") {
                hrIdError.textContent = data.message;
            } else if (data.message === "Invalid HR ID or password") {
                hrIdError.textContent = data.message;
            } else if (data.message === "Enter password") {
                hrPasswordError.textContent = data.message;
            } else {
                hrLoginMessage.textContent = data.message || "Unable to login";
            }

            return;
        }

        if (data.must_reset_password) {
            window.location.href = "/reset-password";
            return;
        }

        window.location.href = "/hr-dashboard";

    } catch (error) {
        hrLoginMessage.textContent = "Unable to connect to server";
    } finally {
        hrLoginButton.disabled = false;
        hrLoginButton.textContent = "Login";
    }
});