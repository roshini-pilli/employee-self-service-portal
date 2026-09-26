const loginForm = document.getElementById("loginForm");
const employeeIdInput = document.getElementById("employeeId");
const passwordInput = document.getElementById("password");

const employeeIdError = document.getElementById("employeeIdError");
const passwordError = document.getElementById("passwordError");
const loginMessage = document.getElementById("loginMessage");

const loginButton = document.getElementById("loginButton");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
    }
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    employeeIdError.textContent = "";
    passwordError.textContent = "";
    loginMessage.textContent = "";

    const employeeId = employeeIdInput.value.trim();
    const password = passwordInput.value;

    let valid = true;

    if (!employeeId) {
        employeeIdError.textContent = "Enter employee ID";
        valid = false;
    }

    if (!password) {
        passwordError.textContent = "Enter password";
        valid = false;
    }

    if (!valid) {
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {
        const response = await fetch("/api/auth/employee/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                employee_id: employeeId,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.message === "Invalid employee ID or password") {
                employeeIdError.textContent = data.message;
            } else if (data.message === "Enter a valid employee ID") {
                employeeIdError.textContent = data.message;
            } else {
                loginMessage.textContent = data.message || "Unable to login";
            }

            return;
        }

        if (data.must_reset_password) {
            window.location.href = "/reset-password";
            return;
        }

        window.location.href = "/dashboard";

    } catch (error) {
        loginMessage.textContent = "Unable to connect to server";
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
});