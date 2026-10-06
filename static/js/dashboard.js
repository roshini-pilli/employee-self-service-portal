const navItems = document.querySelectorAll(".nav-item");
const modules = document.querySelectorAll(".module-section");

const profileContent = document.getElementById("profileContent");
const welcomeText = document.getElementById("welcomeText");
const headerUser = document.getElementById("headerUser");
const logoutButton = document.getElementById("logoutButton");

const dependantTabs = document.querySelectorAll("[data-dependant-tab]");
const dependantTabContents = document.querySelectorAll(".dependant-tab-content");

const dependantsTableBody = document.getElementById("dependantsTableBody");
const dependantRequestsTableBody = document.getElementById("dependantRequestsTableBody");

const dependantForm = document.getElementById("dependantForm");
const dependantFormCard = document.getElementById("dependantFormCard");
const showDependantFormButton = document.getElementById("showDependantFormButton");
const cancelDependantButton = document.getElementById("cancelDependantButton");

const dependantName = document.getElementById("dependantName");
const relation = document.getElementById("relation");
const dependantGender = document.getElementById("dependantGender");
const dependantDob = document.getElementById("dependantDob");

const dependantNameError = document.getElementById("dependantNameError");
const relationError = document.getElementById("relationError");
const dependantGenderError = document.getElementById("dependantGenderError");
const dependantDobError = document.getElementById("dependantDobError");

const dependantFormMessage = document.getElementById("dependantFormMessage");
const submitDependantButton = document.getElementById("submitDependantButton");

const leaveTabs = document.querySelectorAll("[data-leave-tab]");
const leaveTabContents = document.querySelectorAll(".leave-tab-content");

const leaveHistoryTableBody = document.getElementById("leaveHistoryTableBody");
const leaveRequestsTableBody = document.getElementById("leaveRequestsTableBody");

const leaveHistoryMonth = document.getElementById("leaveHistoryMonth");
const leaveHistoryYear = document.getElementById("leaveHistoryYear");
const filterLeaveHistoryButton = document.getElementById("filterLeaveHistoryButton");
const resetLeaveHistoryButton = document.getElementById("resetLeaveHistoryButton");

const leaveForm = document.getElementById("leaveForm");
const leaveFormCard = document.getElementById("leaveFormCard");
const showLeaveFormButton = document.getElementById("showLeaveFormButton");
const cancelLeaveButton = document.getElementById("cancelLeaveButton");

const leaveDate = document.getElementById("leaveDate");
const leaveType = document.getElementById("leaveType");
const leaveDescription = document.getElementById("leaveDescription");

const leaveDateError = document.getElementById("leaveDateError");
const leaveTypeError = document.getElementById("leaveTypeError");
const leaveDescriptionError = document.getElementById("leaveDescriptionError");

const leaveFormMessage = document.getElementById("leaveFormMessage");
const submitLeaveButton = document.getElementById("submitLeaveButton");

const payrollMonth = document.getElementById("payrollMonth");
const payrollYear = document.getElementById("payrollYear");
const filterPayrollButton = document.getElementById("filterPayrollButton");
const payrollTableBody = document.getElementById("payrollTableBody");
const payrollMessage = document.getElementById("payrollMessage");

let leaveHistoryData = [];

function escapeHtml(value) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatMonth(value) {
    if (!value) {
        return "—";
    }

    const monthMap = {
        Jan: "January",
        Feb: "February",
        Mar: "March",
        Apr: "April",
        May: "May",
        Jun: "June",
        Jul: "July",
        Aug: "August",
        Sep: "September",
        Oct: "October",
        Nov: "November",
        Dec: "December"
    };

    return monthMap[value] || value;
}

function formatAmount(value) {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return "₹0.00";
    }

    return `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function createRow(label, value) {
    return `
        <div class="profile-row">
            <span class="profile-label">${escapeHtml(label)}</span>
            <span class="profile-value">${escapeHtml(value)}</span>
        </div>
    `;
}

function displayProfile(employee) {
    const fullName = employee.full_name || "Employee";

    welcomeText.textContent = `Hi, ${fullName}`;
    headerUser.textContent = employee.employee_id || "Employee";

    profileContent.innerHTML = `
        <div class="profile-card">
            <h3>Personal Information</h3>
            ${createRow("Employee ID", employee.employee_id)}
            ${createRow("Full Name", employee.full_name)}
            ${createRow("Date of Birth", formatDate(employee.dob))}
            ${createRow("Gender", employee.gender)}
        </div>

        <div class="profile-card">
            <h3>Employment Information</h3>
            ${createRow("Department", employee.department)}
            ${createRow("Role", employee.role)}
        </div>

        <div class="profile-card full-width">
            <h3>Contact Information</h3>
            ${createRow("Phone", employee.phone)}
            ${createRow("Email", employee.email)}
            ${createRow("Address Line 1", employee.address_line1)}
            ${createRow("Address Line 2", employee.address_line2)}
            ${createRow("City", employee.city)}
            ${createRow("State", employee.state)}
            ${createRow("Pincode", employee.pincode)}
            ${createRow("Country", employee.country)}
        </div>
    `;
}

async function checkAuthentication() {
    try {
        const response = await fetch("/api/employee/profile", {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin"
        });

        if (response.status === 401) {
            window.location.replace("/login");
            return false;
        }

        return response.ok;
    } catch (error) {
        return true;
    }
}

async function loadProfile() {
    profileContent.innerHTML = `
        <div class="loading-state">Loading profile...</div>
    `;

    try {
        const response = await fetch("/api/employee/profile", {
            cache: "no-store",
            credentials: "same-origin"
        });

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            profileContent.innerHTML = `
                <div class="loading-state">
                    ${escapeHtml(data.message || "Unable to load profile")}
                </div>
            `;
            return;
        }

        displayProfile(data.employee);
    } catch (error) {
        profileContent.innerHTML = `
            <div class="loading-state">
                Unable to connect to the server.
            </div>
        `;
    }
}

async function loadRelations() {
    try {
        const response = await fetch(
            "/api/employee/dependants/relations",
            {
                cache: "no-store",
                credentials: "same-origin"
            }
        );

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            return;
        }

        relation.innerHTML = `
            <option value="">Select relation</option>
        `;

        data.relations.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.relation_id;
            option.textContent = item.relation_name;
            relation.appendChild(option);
        });
    } catch (error) {
        relation.innerHTML = `
            <option value="">Unable to load relations</option>
        `;
    }
}

async function loadDependants() {
    dependantsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="table-message">
                Loading dependants...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            "/api/employee/dependants",
            {
                cache: "no-store",
                credentials: "same-origin"
            }
        );

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            dependantsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-message">
                        ${escapeHtml(data.message || "Unable to load dependants")}
                    </td>
                </tr>
            `;
            return;
        }

        if (!data.dependants || data.dependants.length === 0) {
            dependantsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-message">
                        No approved dependants found.
                    </td>
                </tr>
            `;
            return;
        }

        dependantsTableBody.innerHTML = data.dependants.map((item) => `
            <tr>
                <td>${escapeHtml(item.employee_id)}</td>
                <td>${escapeHtml(item.dependant_id)}</td>
                <td>${escapeHtml(item.dependant_name)}</td>
                <td>${escapeHtml(item.relation_name)}</td>
                <td>${escapeHtml(item.gender)}</td>
                <td>${formatDate(item.dob)}</td>
            </tr>
        `).join("");
    } catch (error) {
        dependantsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    Unable to connect to the server.
                </td>
            </tr>
        `;
    }
}

function getStatusClass(status) {
    if (status === "APPROVED") {
        return "status-approved";
    }

    if (status === "REJECTED") {
        return "status-rejected";
    }

    return "status-pending";
}

async function loadDependantRequests() {
    dependantRequestsTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="table-message">
                Loading requests...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            "/api/employee/dependants/requests",
            {
                cache: "no-store",
                credentials: "same-origin"
            }
        );

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            dependantRequestsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="table-message">
                        ${escapeHtml(data.message || "Unable to load requests")}
                    </td>
                </tr>
            `;
            return;
        }

        if (!data.requests || data.requests.length === 0) {
            dependantRequestsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="table-message">
                        No dependant requests found.
                    </td>
                </tr>
            `;
            return;
        }

        dependantRequestsTableBody.innerHTML = data.requests.map((item) => `
            <tr>
                <td>${escapeHtml(item.request_id)}</td>
                <td>${escapeHtml(item.dependant_name)}</td>
                <td>${escapeHtml(item.relation_name)}</td>
                <td>${escapeHtml(item.gender)}</td>
                <td>${formatDate(item.dob)}</td>
                <td>
                    <span class="status-badge ${getStatusClass(item.status)}">
                        ${escapeHtml(item.status)}
                    </span>
                </td>
                <td>${formatDate(item.request_timestamp)}</td>
                <td>${escapeHtml(item.remarks)}</td>
            </tr>
        `).join("");
    } catch (error) {
        dependantRequestsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="table-message">
                    Unable to connect to the server.
                </td>
            </tr>
        `;
    }
}

function clearDependantErrors() {
    dependantNameError.textContent = "";
    relationError.textContent = "";
    dependantGenderError.textContent = "";
    dependantDobError.textContent = "";
    dependantFormMessage.textContent = "";
    dependantFormMessage.className = "form-message";
}

function validateDependantForm() {
    clearDependantErrors();

    let valid = true;

    const name = dependantName.value.trim();
    const relationId = Number(relation.value);
    const gender = dependantGender.value;
    const dob = dependantDob.value;

    if (!name) {
        dependantNameError.textContent = "Enter dependant name";
        valid = false;
    } else if (name.length > 100) {
        dependantNameError.textContent = "Dependant name is too long";
        valid = false;
    }

    if (!relationId) {
        relationError.textContent = "Select relation";
        valid = false;
    }

    if (!gender) {
        dependantGenderError.textContent = "Select gender";
        valid = false;
    }

    if (!dob) {
        dependantDobError.textContent = "Select date of birth";
        valid = false;
    } else {
        const selectedDate = new Date(`${dob}T00:00:00`);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const hundredYearsAgo = new Date(
            today.getFullYear() - 100,
            today.getMonth(),
            today.getDate()
        );

        if (selectedDate > today) {
            dependantDobError.textContent =
                "Date of birth cannot be in the future";
            valid = false;
        } else if (selectedDate < hundredYearsAgo) {
            dependantDobError.textContent =
                "Date of birth cannot be more than 100 years ago";
            valid = false;
        }
    }

    if (relationId === 2 && gender !== "Male") {
        dependantGenderError.textContent = "Father must be male";
        valid = false;
    }

    if (relationId === 3 && gender !== "Female") {
        dependantGenderError.textContent = "Mother must be female";
        valid = false;
    }

    if (relationId === 4 && gender !== "Male") {
        dependantGenderError.textContent = "Father In Law must be male";
        valid = false;
    }

    if (relationId === 5 && gender !== "Female") {
        dependantGenderError.textContent = "Mother In Law must be female";
        valid = false;
    }

    if (
        relationId === 11 ||
        relationId === 12 ||
        relationId === 23 ||
        relationId === 24
    ) {
        if (dob) {
            const selectedDate = new Date(`${dob}T00:00:00`);
            const today = new Date();

            today.setHours(0, 0, 0, 0);

            let age =
                today.getFullYear() -
                selectedDate.getFullYear();

            const monthDifference =
                today.getMonth() -
                selectedDate.getMonth();

            if (
                monthDifference < 0 ||
                (
                    monthDifference === 0 &&
                    today.getDate() < selectedDate.getDate()
                )
            ) {
                age--;
            }

            if (age > 21) {
                dependantDobError.textContent =
                    relationId === 11 || relationId === 12
                        ? "Child age cannot be above 21"
                        : "Sibling age cannot be above 21";

                valid = false;
            }
        }
    }

    return valid;
}

function clearDependantForm() {
    dependantForm.reset();
    clearDependantErrors();
}

async function submitDependantRequest(event) {
    event.preventDefault();

    if (!validateDependantForm()) {
        return;
    }

    submitDependantButton.disabled = true;
    submitDependantButton.textContent = "Submitting...";
    dependantFormMessage.textContent = "";
    dependantFormMessage.className = "form-message";

    try {
        const response = await fetch(
            "/api/employee/dependants/requests",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    dependant_name: dependantName.value.trim(),
                    relation_id: Number(relation.value),
                    gender: dependantGender.value,
                    dob: dependantDob.value
                })
            }
        );

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            dependantFormMessage.textContent =
                data.message || "Unable to submit request.";
            dependantFormMessage.className = "form-message error";
            return;
        }

        dependantFormMessage.textContent =
            "Dependant request submitted successfully.";
        dependantFormMessage.className =
            "form-message success";

        clearDependantForm();

        await loadDependantRequests();
    } catch (error) {
        dependantFormMessage.textContent =
            "Unable to connect to the server.";
        dependantFormMessage.className =
            "form-message error";
    } finally {
        submitDependantButton.disabled = false;
        submitDependantButton.textContent = "Submit Request";
    }
}

function setLeaveDateLimits() {
    if (!leaveDate) {
        return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");

    leaveDate.min = `${year}-${month}-${day}`;
}

function clearLeaveErrors() {
    leaveDateError.textContent = "";
    leaveTypeError.textContent = "";
    leaveDescriptionError.textContent = "";
    leaveFormMessage.textContent = "";
    leaveFormMessage.className = "form-message";
}

function validateLeaveForm() {
    clearLeaveErrors();

    let valid = true;

    const selectedDateValue = leaveDate.value;
    const selectedType = leaveType.value;
    const description = leaveDescription.value.trim();

    if (!selectedDateValue) {
        leaveDateError.textContent =
            "Select a leave date";
        valid = false;
    } else {
        const selectedDate =
            new Date(`${selectedDateValue}T00:00:00`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
            leaveDateError.textContent =
                "Leave date must be after today";
            valid = false;
        }
    }

    if (!selectedType) {
        leaveTypeError.textContent =
            "Select leave type";
        valid = false;
    }

    if (description.length > 100) {
        leaveDescriptionError.textContent =
            "Reason cannot exceed 100 characters";
        valid = false;
    }

    return valid;
}

function clearLeaveForm() {
    leaveForm.reset();
    clearLeaveErrors();
    setLeaveDateLimits();
}

function getMonthKey(dateValue) {
    if (!dateValue) {
        return null;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;
}

function createLeaveSummary(leaves) {
    const summaries = {};

    leaves.forEach((item) => {
        if (!item.leave_date) {
            return;
        }

        const monthKey = getMonthKey(item.leave_date);

        if (!monthKey) {
            return;
        }

        if (!summaries[monthKey]) {
            summaries[monthKey] = {
                monthKey,
                month: "",
                year: "",
                sick: 0,
                casual: 0,
                other: 0
            };
        }

        const date = new Date(`${monthKey}-01T00:00:00`);

        summaries[monthKey].month =
            date.toLocaleDateString("en-IN", {
                month: "long"
            });

        summaries[monthKey].year =
            date.getFullYear();

        if (item.status === "APPROVED") {
            if (item.leave_type === "SL") {
                summaries[monthKey].sick++;
            }

            if (item.leave_type === "CL") {
                summaries[monthKey].casual++;
            }

            if (item.leave_type === "OL") {
                summaries[monthKey].other++;
            }
        }
    });

    return Object.values(summaries).sort(
        (a, b) => b.monthKey.localeCompare(a.monthKey)
    );
}

function displayLeaveHistory(summaries) {
    if (!summaries || summaries.length === 0) {
        leaveHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    No approved leave history found.
                </td>
            </tr>
        `;
        return;
    }

    const selectedMonth = leaveHistoryMonth
        ? leaveHistoryMonth.value
        : "";

    const selectedYear = leaveHistoryYear
        ? leaveHistoryYear.value
        : "";

    const filteredSummaries = summaries.filter((item) => {
        let monthMatches = true;
        let yearMatches = true;

        if (selectedMonth) {
            const monthDate = new Date(
                `${item.monthKey}-01T00:00:00`
            );

            const monthNumber = String(
                monthDate.getMonth() + 1
            ).padStart(2, "0");

            const selectedMonthNumber =
                String(
                    [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec"
                    ].indexOf(selectedMonth) + 1
                ).padStart(2, "0");

            monthMatches =
                monthNumber === selectedMonthNumber;
        }

        if (selectedYear) {
            yearMatches =
                String(item.year) === String(selectedYear);
        }

        return monthMatches && yearMatches;
    });

    if (filteredSummaries.length === 0) {
        leaveHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    No leave history found for the selected filter.
                </td>
            </tr>
        `;
        return;
    }

    leaveHistoryTableBody.innerHTML =
        filteredSummaries.map((item) => {
            const total =
                item.sick +
                item.casual +
                item.other;

            return `
                <tr>
                    <td>${escapeHtml(item.month)}</td>
                    <td>${escapeHtml(item.year)}</td>
                    <td>${item.sick}</td>
                    <td>${item.casual}</td>
                    <td>${item.other}</td>
                    <td>${total}</td>
                </tr>
            `;
        }).join("");
}

async function loadLeaveHistory() {
    leaveHistoryTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="table-message">
                Loading leave history...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            "/api/leave/history",
            {
                cache: "no-store",
                credentials: "same-origin"
            }
        );

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            leaveHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-message">
                        ${escapeHtml(
                            data.message ||
                            "Unable to load leave history"
                        )}
                    </td>
                </tr>
            `;
            return;
        }

        if (!data.leaves || data.leaves.length === 0) {
            leaveHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-message">
                        No leave history found.
                    </td>
                </tr>
            `;
            return;
        }

        leaveHistoryData =
            createLeaveSummary(data.leaves);

        displayLeaveHistory(leaveHistoryData);
    } catch (error) {
        leaveHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    Unable to connect to the server.
                </td>
            </tr>
        `;
    }
}

async function loadLeaveRequests() {
    leaveRequestsTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="table-message">
                Loading leave requests...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            "/api/leave/history",
            {
                cache: "no-store",
                credentials: "same-origin"
            }
        );

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            leaveRequestsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="table-message">
                        ${escapeHtml(
                            data.message ||
                            "Unable to load leave requests"
                        )}
                    </td>
                </tr>
            `;
            return;
        }

        if (!data.leaves || data.leaves.length === 0) {
            leaveRequestsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="table-message">
                        No leave requests found.
                    </td>
                </tr>
            `;
            return;
        }

        leaveRequestsTableBody.innerHTML =
            data.leaves.map((item) => `
                <tr>
                    <td>${escapeHtml(item.leave_id)}</td>
                    <td>${formatDate(item.leave_date)}</td>
                    <td>${escapeHtml(item.leave_type)}</td>
                    <td>${escapeHtml(item.description)}</td>
                    <td>
                        <span class="status-badge ${getStatusClass(item.status)}">
                            ${escapeHtml(item.status)}
                        </span>
                    </td>
                    <td>${formatDate(item.requested_at)}</td>
                    <td>${escapeHtml(item.remark)}</td>
                </tr>
            `).join("");
    } catch (error) {
        leaveRequestsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-message">
                    Unable to connect to the server.
                </td>
            </tr>
        `;
    }
}

async function submitLeaveRequest(event) {
    event.preventDefault();

    if (!validateLeaveForm()) {
        return;
    }

    submitLeaveButton.disabled = true;
    submitLeaveButton.textContent = "Submitting...";
    leaveFormMessage.textContent = "";
    leaveFormMessage.className = "form-message";

    try {
        const response = await fetch(
            "/api/leave/requests",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    leave_date: leaveDate.value,
                    leave_type: leaveType.value,
                    description: leaveDescription.value.trim()
                })
            }
        );

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            leaveFormMessage.textContent =
                data.message ||
                "Unable to submit leave request.";
            leaveFormMessage.className =
                "form-message error";
            return;
        }

        leaveFormMessage.textContent =
            "Leave request submitted successfully.";
        leaveFormMessage.className =
            "form-message success";

        clearLeaveForm();

        await loadLeaveRequests();
        await loadLeaveHistory();
    } catch (error) {
        leaveFormMessage.textContent =
            "Unable to connect to the server.";
        leaveFormMessage.className =
            "form-message error";
    } finally {
        submitLeaveButton.disabled = false;
        submitLeaveButton.textContent =
            "Submit Request";
    }
}

async function loadPayroll() {
    payrollTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="table-message">
                Loading payroll...
            </td>
        </tr>
    `;

    payrollMessage.textContent = "";
    payrollMessage.className = "form-message";

    try {
        const selectedMonth = payrollMonth.value;
        const selectedYear = payrollYear.value;

        const params = new URLSearchParams();

        if (selectedMonth) {
            params.append("month", selectedMonth);
        }

        if (selectedYear) {
            params.append("year", selectedYear);
        }

        const queryString = params.toString();

        const url = queryString
            ? `/api/payroll/employee?${queryString}`
            : "/api/payroll/employee";

        const response = await fetch(url, {
            cache: "no-store",
            credentials: "same-origin"
        });

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            payrollTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-message">
                        ${escapeHtml(
                            data.message ||
                            "Unable to load payroll"
                        )}
                    </td>
                </tr>
            `;
            return;
        }

        if (!data.salaries || data.salaries.length === 0) {
            payrollTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-message">
                        No payroll records found.
                    </td>
                </tr>
            `;
            return;
        }

        payrollTableBody.innerHTML = data.salaries.map((item) => `
            <tr>
                <td>${escapeHtml(item.year)}</td>
                <td>${escapeHtml(item.month)}</td>
                <td>${formatAmount(item.gross_pay)}</td>
                <td>${formatAmount(item.tax)}</td>
                <td>${formatAmount(item.other_deductions)}</td>
                <td>${formatAmount(item.net_pay)}</td>
            </tr>
        `).join("");
    } catch (error) {
        payrollTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    Unable to connect to the server.
                </td>
            </tr>
        `;
    }
}

function openDependantForm() {
    dependantFormCard.style.display = "block";

    setTimeout(() => {
        dependantFormCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 50);
}

function closeDependantForm() {
    dependantFormCard.style.display = "none";
    clearDependantForm();
}

function openLeaveForm() {
    leaveFormCard.style.display = "block";
    setLeaveDateLimits();

    setTimeout(() => {
        leaveFormCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 50);
}

function closeLeaveForm() {
    leaveFormCard.style.display = "none";
    clearLeaveForm();
}

navItems.forEach((item) => {
    item.addEventListener("click", () => {
        const moduleName = item.dataset.module;

        navItems.forEach((navItem) => {
            navItem.classList.remove("active");
        });

        modules.forEach((module) => {
            module.classList.remove("active");
        });

        item.classList.add("active");

        const selectedModule =
            document.getElementById(`${moduleName}Module`);

        if (selectedModule) {
            selectedModule.classList.add("active");
        }

        closeDependantForm();
        closeLeaveForm();

        if (moduleName === "dependants") {
            loadDependants();
            loadDependantRequests();
            loadRelations();
        }

        if (moduleName === "leave") {
            loadLeaveHistory();
            loadLeaveRequests();
            setLeaveDateLimits();
        }

        if (moduleName === "payroll") {
            loadPayroll();
        }
    });
});

dependantTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const selectedTab =
            tab.dataset.dependantTab;

        dependantTabs.forEach((item) => {
            item.classList.remove("active");
        });

        dependantTabContents.forEach((content) => {
            content.classList.remove("active");
        });

        tab.classList.add("active");

        const selectedContent =
            document.getElementById(`${selectedTab}Tab`);

        if (selectedContent) {
            selectedContent.classList.add("active");
        }

        closeDependantForm();

        if (selectedTab === "dependants") {
            loadDependants();
        }

        if (selectedTab === "requests") {
            loadDependantRequests();
        }
    });
});

leaveTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const selectedTab =
            tab.dataset.leaveTab;

        leaveTabs.forEach((item) => {
            item.classList.remove("active");
        });

        leaveTabContents.forEach((content) => {
            content.classList.remove("active");
        });

        tab.classList.add("active");

        const selectedContent =
            document.getElementById(
                `leave${
                    selectedTab === "history"
                        ? "History"
                        : "Requests"
                }Tab`
            );

        if (selectedContent) {
            selectedContent.classList.add("active");
        }

        closeLeaveForm();

        if (selectedTab === "history") {
            loadLeaveHistory();
        }

        if (selectedTab === "requests") {
            loadLeaveRequests();
            setLeaveDateLimits();
        }
    });
});

showDependantFormButton.addEventListener(
    "click",
    openDependantForm
);

cancelDependantButton.addEventListener(
    "click",
    closeDependantForm
);

showLeaveFormButton.addEventListener(
    "click",
    openLeaveForm
);

cancelLeaveButton.addEventListener(
    "click",
    closeLeaveForm
);

filterPayrollButton.addEventListener(
    "click",
    loadPayroll
);

if (filterLeaveHistoryButton) {
    filterLeaveHistoryButton.addEventListener(
        "click",
        () => {
            displayLeaveHistory(leaveHistoryData);
        }
    );
}

if (resetLeaveHistoryButton) {
    resetLeaveHistoryButton.addEventListener(
        "click",
        () => {
            leaveHistoryMonth.value = "";
            leaveHistoryYear.value = "";
            displayLeaveHistory(leaveHistoryData);
        }
    );
}

relation.addEventListener("change", () => {
    const relationId = Number(relation.value);

    if (relationId === 2 || relationId === 4) {
        dependantGender.value = "Male";
    } else if (relationId === 3 || relationId === 5) {
        dependantGender.value = "Female";
    }

    relationError.textContent = "";
    dependantGenderError.textContent = "";
});

dependantGender.addEventListener("change", () => {
    dependantGenderError.textContent = "";
});

dependantDob.addEventListener("change", () => {
    dependantDobError.textContent = "";
});

dependantName.addEventListener("input", () => {
    dependantNameError.textContent = "";
});

leaveDate.addEventListener("change", () => {
    leaveDateError.textContent = "";
});

leaveType.addEventListener("change", () => {
    leaveTypeError.textContent = "";
});

leaveDescription.addEventListener("input", () => {
    leaveDescriptionError.textContent = "";
});

dependantForm.addEventListener(
    "submit",
    submitDependantRequest
);

leaveForm.addEventListener(
    "submit",
    submitLeaveRequest
);

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";

    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store"
        });
    } finally {
        sessionStorage.setItem("essLoggedOut", "true");
        window.location.replace("/login");
    }
});

window.addEventListener("pageshow", async (event) => {
    if (sessionStorage.getItem("essLoggedOut") === "true") {
        sessionStorage.removeItem("essLoggedOut");

        const authenticated = await checkAuthentication();

        if (!authenticated) {
            window.location.replace("/login");
        }

        return;
    }

    if (event.persisted) {
        const authenticated = await checkAuthentication();

        if (!authenticated) {
            window.location.replace("/login");
        }
    }
});

loadProfile();
loadRelations();
loadDependants();
loadDependantRequests();
loadLeaveHistory();
loadLeaveRequests();
setLeaveDateLimits();