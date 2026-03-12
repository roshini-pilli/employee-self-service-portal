function togglePassword(id) {
    const input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
}

function validatePasswords() {
    const pass = document.getElementById("password");
    const confirm = document.getElementById("reset_password");

    if (!pass || !confirm) return true;

    if (pass.value !== confirm.value) {
        alert("Passwords do not match!");
        return false;
    }
    return true;
}

function showDependants() {
    const dependantsView = document.getElementById("dependantsView");
    const requestsView = document.getElementById("requestsView");

    const dependantsBtn = document.getElementById("showDependantsBtn");
    const requestsBtn = document.getElementById("showRequestsBtn");

    if (!dependantsView || !requestsView) return;

    dependantsView.style.display = "block";
    requestsView.style.display = "none";

    dependantsBtn.classList.add("active");
    requestsBtn.classList.remove("active");
}

function showRequests() {
    const dependantsView = document.getElementById("dependantsView");
    const requestsView = document.getElementById("requestsView");

    const dependantsBtn = document.getElementById("showDependantsBtn");
    const requestsBtn = document.getElementById("showRequestsBtn");

    if (!dependantsView || !requestsView) return;

    dependantsView.style.display = "none";
    requestsView.style.display = "block";

    requestsBtn.classList.add("active");
    dependantsBtn.classList.remove("active");
}
function validateLogin(idFieldName) {
    const idField = document.querySelector(`input[name='${idFieldName}']`);
    const password = document.getElementById("password").value.trim();

    const userId = idField.value.trim();

    if (userId === "") {
        alert("Please enter " + (idFieldName === "hr_id" ? "HR ID" : "Employee ID"));
        return false;
    }

    if (!/^\d{6}$/.test(userId)) {
        alert("Please enter valid " + (idFieldName === "hr_id" ? "HR ID" : "Employee ID"));
        return false;
    }

    if (password === "") {
        alert("Please enter password");
        return false;
    }

    return true;
}
function validateResetPassword() {
    const newPass = document.getElementById("new_password").value.trim();
    const confirmPass = document.getElementById("confirm_password").value.trim();

    if (newPass === "") {
        alert("Please enter new password");
        return false;
    }

    if (confirmPass === "") {
        alert("Please confirm password");
        return false;
    }

    if (newPass !== confirmPass) {
        alert("Passwords do not match");
        return false;
    }

    if (newPass.length < 8) {
        alert("Password must be at least 8 characters long");
        return false;
    }

    if (!/[A-Z]/.test(newPass)) {
        alert("Password must contain at least one capital letter");
        return false;
    }

    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(newPass)) {
        alert("Password must contain at least one special character");
        return false;
    }

    return true;
}
function handleRelationChange() {
    const relation = document.getElementById("relation").value;
    const gender = document.getElementById("gender");

    gender.value = "";

    if (relation === "Father" || relation === "Father In Law") {
        gender.value = "Male";
    }

    if (relation === "Mother" || relation === "Mother In Law") {
        gender.value = "Female";
    }
}

function validateDependantForm() {
    const name = document.querySelector("input[name='dependant_name']").value.trim();
    const relation = document.getElementById("relation").value;
    const gender = document.getElementById("gender").value;
    const dobValue = document.getElementById("dob").value;

    // Required fields check
    if (!name || !relation || !gender || !dobValue) {
        alert("Please fill Dependant Name, Relation, Gender and Date of Birth.");
        return false;
    }

    const dob = new Date(dobValue);
    const year = dob.getFullYear();

    // DOB range validation
    if (year < 1940 || year > 2025) {
        alert("Date of Birth must be between 1940 and 2025.");
        return false;
    }

    if (relation.startsWith("Child")) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        if (age > 20) {
            alert("Child age must be 20 years or below.");
            return false;
        }
    }

    return true;
}
function approveRequest(reqId) {
    if (confirm("Are you sure you want to approve this dependant?")) {
        window.location.href = `/approve-dependant/${reqId}`;
    }
}

function rejectRequest(reqId) {
    if (confirm("Are you sure you want to reject this dependant?")) {
        let reason = prompt("Please enter the reason for rejection:");
        if (reason && reason.trim() !== "") {
            window.location.href =
                `/reject-dependant/${reqId}?remarks=` + encodeURIComponent(reason);
        } else {
            alert("Rejection reason is mandatory.");
        }
    }
}
