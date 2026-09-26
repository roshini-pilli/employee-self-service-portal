const welcomeText = document.getElementById("welcomeText");
const headerUser = document.getElementById("headerUser");
const logoutButton = document.getElementById("logoutButton");

const profileModule = document.getElementById("profileModule");
const employeesModule = document.getElementById("employeesModule");
const yourDependantsModule = document.getElementById("yourDependantsModule");
const yourLeavesModule = document.getElementById("yourLeavesModule");
const yourPayrollModule = document.getElementById("yourPayrollModule");

const employeesNavButton = document.getElementById("employeesNavButton");
const employeesSubmenu = document.getElementById("employeesSubmenu");
const employeesArrow = document.getElementById("employeesArrow");

const navItems = document.querySelectorAll(
    ".hr-nav > .hr-nav-item"
);

const employeeSubitems = document.querySelectorAll(
    ".hr-subitem"
);

const employeeSections = {
    details: document.getElementById("employeeDetailsSection"),
    dependants: document.getElementById("employeeDependantsSection"),
    leave: document.getElementById("employeeLeaveSection"),
    salary: document.getElementById("employeeSalarySection")
};

const modules = {
    profile: profileModule,
    employees: employeesModule,
    yourDependants: yourDependantsModule,
    yourLeaves: yourLeavesModule,
    yourPayroll: yourPayrollModule
};

let currentEmployeeSection = "details";
let dependantRequestStatus = "PENDING";
let leaveRequestStatus = "PENDING";

function clearActiveNav() {
    navItems.forEach(item => {
        item.classList.remove("active");
    });

    employeeSubitems.forEach(item => {
        item.classList.remove("active");
    });

    employeesNavButton.classList.remove("active");
}

function hideModules() {
    Object.values(modules).forEach(module => {
        if (module) {
            module.classList.remove("active");
        }
    });
}

function showModule(moduleName) {
    hideModules();

    if (modules[moduleName]) {
        modules[moduleName].classList.add("active");
    }
}

function setEmployeeSection(sectionName) {
    currentEmployeeSection = sectionName;

    Object.values(employeeSections).forEach(section => {
        if (section) {
            section.classList.remove("active");
        }
    });

    employeeSubitems.forEach(item => {
        item.classList.remove("active");
    });

    const selectedSection = employeeSections[sectionName];

    if (selectedSection) {
        selectedSection.classList.add("active");
    }

    const selectedNav = document.querySelector(
        `[data-employee-section="${sectionName}"]`
    );

    if (selectedNav) {
        selectedNav.classList.add("active");
    }

    if (sectionName === "details") {
        loadEmployeeDetails();
    }

    if (sectionName === "dependants") {
        loadEmployeeDependants();
        loadHrDependantRequests(dependantRequestStatus);
    }

    if (sectionName === "leave") {
        loadEmployeeLeave();
        loadHrLeaveRequests(leaveRequestStatus);
    }

    if (sectionName === "salary") {
        loadEmployeeSalary();
    }
}

function formatDate(date) {
    if (!date) {
        return "-";
    }

    return String(date).split("T")[0];
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    return String(value)
        .replace("T", " ")
        .slice(0, 19);
}

function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "₹0.00";
    }

    return `₹${amount.toFixed(2)}`;
}

function statusBadge(status) {
    const value = String(status || "").toUpperCase();

    if (value === "APPROVED") {
        return `<span class="hr-status approved">Approved</span>`;
    }

    if (value === "REJECTED") {
        return `<span class="hr-status rejected">Rejected</span>`;
    }

    return `<span class="hr-status pending">Pending</span>`;
}

function showTableMessage(elementId, message, colspan) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.innerHTML = `
        <tr>
            <td colspan="${colspan}" class="hr-table-message">
                ${message}
            </td>
        </tr>
    `;
}

async function loadHrProfile() {
    try {
        const response = await fetch("/api/hr/profile");
        const data = await response.json();

        if (!response.ok) {
            return;
        }

        const hr = data.hr;

        welcomeText.textContent = `Hi, ${hr.full_name}`;

        const initials = hr.full_name
            .split(" ")
            .filter(Boolean)
            .map(name => name[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

        headerUser.textContent = initials;

        document.getElementById("profileHrId").textContent =
            hr.hr_id || "-";

        document.getElementById("profileFullName").textContent =
            hr.full_name || "-";

        document.getElementById("profileDob").textContent =
            formatDate(hr.dob);

        document.getElementById("profileGender").textContent =
            hr.gender || "-";

        document.getElementById("profileDepartment").textContent =
            hr.department || "-";

        document.getElementById("profileRole").textContent =
            hr.role || "-";

        document.getElementById("profilePhone").textContent =
            hr.phone || "-";

        document.getElementById("profileEmail").textContent =
            hr.email || "-";

        document.getElementById("profileAddress1").textContent =
            hr.address_line1 || "-";

        document.getElementById("profileAddress2").textContent =
            hr.address_line2 || "-";

        document.getElementById("profileCity").textContent =
            hr.city || "-";

        document.getElementById("profileState").textContent =
            hr.state || "-";

        document.getElementById("profilePincode").textContent =
            hr.pincode || "-";

        document.getElementById("profileCountry").textContent =
            hr.country || "-";

    } catch (error) {
        console.error(error);
    }
}

async function loadEmployeeDetails() {
    const employeeId =
        document.getElementById("employeeDetailsId").value.trim();

    const params = new URLSearchParams();

    if (employeeId) {
        params.set("employee_id", employeeId);
    }

    showTableMessage(
        "employeeDetailsTableBody",
        "Loading employees...",
        8
    );

    try {
        const response = await fetch(
            `/api/hr/employees/details?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
            showTableMessage(
                "employeeDetailsTableBody",
                data.message || "Unable to load employees",
                8
            );
            return;
        }

        const employees = data.employees || [];

        if (employees.length === 0) {
            showTableMessage(
                "employeeDetailsTableBody",
                "No employees found",
                8
            );
            return;
        }

        document.getElementById(
            "employeeDetailsTableBody"
        ).innerHTML = employees.map(employee => `
            <tr>
                <td>${employee.employee_id}</td>
                <td>${employee.full_name || "-"}</td>
                <td>${formatDate(employee.dob)}</td>
                <td>${employee.gender || "-"}</td>
                <td>${employee.department || "-"}</td>
                <td>${employee.role || "-"}</td>
                <td>${employee.phone || "-"}</td>
                <td>${employee.email || "-"}</td>
            </tr>
        `).join("");

    } catch (error) {
        showTableMessage(
            "employeeDetailsTableBody",
            "Unable to connect to server",
            8
        );
    }
}

async function loadEmployeeDependants() {
    const employeeId =
        document.getElementById("employeeDependantsId").value.trim();

    const params = new URLSearchParams();

    if (employeeId) {
        params.set("employee_id", employeeId);
    }

    showTableMessage(
        "employeeDependantsTableBody",
        "Loading dependants...",
        7
    );

    try {
        const response = await fetch(
            `/api/hr/employees/dependants?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
            showTableMessage(
                "employeeDependantsTableBody",
                data.message || "Unable to load dependants",
                7
            );
            return;
        }

        const dependants = data.dependants || [];

        if (dependants.length === 0) {
            showTableMessage(
                "employeeDependantsTableBody",
                "No dependants found",
                7
            );
            return;
        }

        document.getElementById(
            "employeeDependantsTableBody"
        ).innerHTML = dependants.map(dependant => `
            <tr>
                <td>${dependant.employee_id}</td>
                <td>${dependant.employee_name || "-"}</td>
                <td>${dependant.dependant_id || "-"}</td>
                <td>${dependant.dependant_name || "-"}</td>
                <td>${dependant.relation_name || "-"}</td>
                <td>${dependant.gender || "-"}</td>
                <td>${formatDate(dependant.dob)}</td>
            </tr>
        `).join("");

    } catch (error) {
        showTableMessage(
            "employeeDependantsTableBody",
            "Unable to connect to server",
            7
        );
    }
}

async function loadHrDependantRequests(status = "PENDING") {
    const colspan = status === "PENDING" ? 8 : 10;

    showTableMessage(
        "hrDependantRequestsTableBody",
        "Loading requests...",
        colspan
    );

    try {
        const response = await fetch(
            `/api/hr/dependants/requests?status=${encodeURIComponent(status)}`
        );

        const data = await response.json();

        if (!response.ok) {
            showTableMessage(
                "hrDependantRequestsTableBody",
                data.message || "Unable to load requests",
                colspan
            );
            return;
        }

        const requests = data.requests || [];

        if (requests.length === 0) {
            showTableMessage(
                "hrDependantRequestsTableBody",
                status === "PENDING"
                    ? "No pending requests"
                    : "No processed requests",
                colspan
            );
            return;
        }

        document.getElementById(
            "hrDependantRequestsTableBody"
        ).innerHTML = requests.map(item => {
            if (status === "PENDING") {
                return `
                    <tr>
                        <td>${item.employee_id}</td>
                        <td>${item.employee_name || "-"}</td>
                        <td>${item.dependant_name || "-"}</td>
                        <td>${item.relation_name || "-"}</td>
                        <td>${item.gender || "-"}</td>
                        <td>${formatDate(item.dob)}</td>
                        <td>${formatDateTime(item.request_timestamp)}</td>
                        <td>
                            <div class="hr-actions">
                                <button
                                    type="button"
                                    class="hr-action-button hr-approve-button"
                                    data-dependant-action="approve"
                                    data-request-id="${item.request_id}"
                                >
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    class="hr-action-button hr-reject-button"
                                    data-dependant-action="reject"
                                    data-request-id="${item.request_id}"
                                >
                                    Reject
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }

            return `
                <tr>
                    <td>${item.employee_id}</td>
                    <td>${item.employee_name || "-"}</td>
                    <td>${item.dependant_name || "-"}</td>
                    <td>${item.relation_name || "-"}</td>
                    <td>${item.gender || "-"}</td>
                    <td>${formatDate(item.dob)}</td>
                    <td>${statusBadge(item.status)}</td>
                    <td>${formatDateTime(item.processed_at)}</td>
                    <td>${item.processed_by || "-"}</td>
                    <td>${item.remarks || "-"}</td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        showTableMessage(
            "hrDependantRequestsTableBody",
            "Unable to connect to server",
            colspan
        );
    }
}

async function processDependantRequest(requestId, action) {
    let remarks = "";

    if (action === "reject") {
        remarks = window.prompt(
            "Enter remarks for rejecting this request:"
        );

        if (remarks === null) {
            return;
        }

        remarks = remarks.trim();

        if (!remarks) {
            alert("Remarks are required when rejecting a request.");
            return;
        }
    }

    const confirmation = window.confirm(
        action === "approve"
            ? "Are you sure you want to approve this dependant request?"
            : "Are you sure you want to reject this dependant request?"
    );

    if (!confirmation) {
        return;
    }

    try {
        const response = await fetch(
            `/api/hr/dependants/requests/${requestId}/${action}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    remarks
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to process request.");
            return;
        }

        await loadHrDependantRequests(dependantRequestStatus);
        await loadEmployeeDependants();

    } catch (error) {
        alert("Unable to connect to server.");
    }
}

async function loadEmployeeLeave() {
    const employeeId =
        document.getElementById("employeeLeaveId").value.trim();

    const month =
        document.getElementById("employeeLeaveMonth").value;

    const year =
        document.getElementById("employeeLeaveYear").value;

    const params = new URLSearchParams();

    if (employeeId) {
        params.set("employee_id", employeeId);
    }

    if (month) {
        params.set("month", month);
    }

    if (year) {
        params.set("year", year);
    }

    showTableMessage(
        "employeeLeaveTableBody",
        "Loading leave records...",
        8
    );

    try {
        const response = await fetch(
            `/api/hr/employees/leave?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
            showTableMessage(
                "employeeLeaveTableBody",
                data.message || "Unable to load leave records",
                8
            );
            return;
        }

        const leaves = data.leaves || [];

        const approvedLeaves = leaves.filter(
            leave => String(leave.status).toUpperCase() === "APPROVED"
        );

        if (approvedLeaves.length === 0) {
            showTableMessage(
                "employeeLeaveTableBody",
                "No leave records found",
                8
            );
            return;
        }

        const summary = {};

        approvedLeaves.forEach(leave => {
            const date = new Date(leave.leave_date);

            if (Number.isNaN(date.getTime())) {
                return;
            }

            const employeeId = leave.employee_id;
            const employeeName = leave.employee_name || "-";
            const monthName = date.toLocaleString("en-US", {
                month: "short"
            });
            const recordYear = date.getFullYear();

            const key = `${employeeId}-${recordYear}-${monthName}`;

            if (!summary[key]) {
                summary[key] = {
                    employee_id: employeeId,
                    employee_name: employeeName,
                    month: monthName,
                    year: recordYear,
                    sick_leave: 0,
                    casual_leave: 0,
                    other_leave: 0
                };
            }

            const type = String(
                leave.leave_type || ""
            ).toUpperCase();

            if (type === "SL") {
                summary[key].sick_leave += 1;
            }

            if (type === "CL") {
                summary[key].casual_leave += 1;
            }

            if (type === "OL") {
                summary[key].other_leave += 1;
            }
        });

        const records = Object.values(summary).map(item => ({
            ...item,
            total_leaves:
                item.sick_leave +
                item.casual_leave +
                item.other_leave
        }));

        records.sort((a, b) => {
            if (a.year !== b.year) {
                return b.year - a.year;
            }

            if (a.employee_id !== b.employee_id) {
                return String(a.employee_id)
                    .localeCompare(String(b.employee_id));
            }

            return a.month.localeCompare(b.month);
        });

        if (records.length === 0) {
            showTableMessage(
                "employeeLeaveTableBody",
                "No approved leave records found",
                8
            );
            return;
        }

        document.getElementById(
            "employeeLeaveTableBody"
        ).innerHTML = records.map(leave => `
            <tr>
                <td>${leave.employee_id}</td>
                <td>${leave.employee_name}</td>
                <td>${leave.month}</td>
                <td>${leave.year}</td>
                <td>${leave.sick_leave}</td>
                <td>${leave.casual_leave}</td>
                <td>${leave.other_leave}</td>
                <td>${leave.total_leaves}</td>
            </tr>
        `).join("");

    } catch (error) {
        showTableMessage(
            "employeeLeaveTableBody",
            "Unable to connect to server",
            8
        );
    }
}

async function loadHrLeaveRequests(status = "PENDING") {
    const colspan = status === "PENDING" ? 6 : 9;

    showTableMessage(
        "hrLeaveRequestsTableBody",
        "Loading requests...",
        colspan
    );

    try {
        const response = await fetch(
            `/api/hr/leave/requests?status=${encodeURIComponent(status)}`
        );

        const data = await response.json();

        if (!response.ok) {
            showTableMessage(
                "hrLeaveRequestsTableBody",
                data.message || "Unable to load requests",
                colspan
            );
            return;
        }

        const requests = data.requests || [];

        if (requests.length === 0) {
            showTableMessage(
                "hrLeaveRequestsTableBody",
                status === "PENDING"
                    ? "No pending requests"
                    : "No processed requests",
                colspan
            );
            return;
        }

        document.getElementById(
            "hrLeaveRequestsTableBody"
        ).innerHTML = requests.map(item => {
            if (status === "PENDING") {
                return `
                    <tr>
                        <td>${item.employee_id}</td>
                        <td>${item.employee_name || "-"}</td>
                        <td>${formatDate(item.leave_date)}</td>
                        <td>${item.leave_type || "-"}</td>
                        <td>${item.description || "-"}</td>
                        <td>
                            <div class="hr-actions">
                                <button
                                    type="button"
                                    class="hr-action-button hr-approve-button"
                                    data-leave-action="approve"
                                    data-request-id="${item.leave_id}"
                                >
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    class="hr-action-button hr-reject-button"
                                    data-leave-action="reject"
                                    data-request-id="${item.leave_id}"
                                >
                                    Reject
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }

            return `
                <tr>
                    <td>${item.employee_id}</td>
                    <td>${item.employee_name || "-"}</td>
                    <td>${formatDate(item.leave_date)}</td>
                    <td>${item.leave_type || "-"}</td>
                    <td>${item.description || "-"}</td>
                    <td>${statusBadge(item.status)}</td>
                    <td>${formatDateTime(item.processed_at)}</td>
                    <td>${item.processed_by || "-"}</td>
                    <td>${item.remark || "-"}</td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        showTableMessage(
            "hrLeaveRequestsTableBody",
            "Unable to connect to server",
            colspan
        );
    }
}

async function processLeaveRequest(requestId, action) {
    let remarks = "";

    if (action === "reject") {
        remarks = window.prompt(
            "Enter remarks for rejecting this request:"
        );

        if (remarks === null) {
            return;
        }

        remarks = remarks.trim();

        if (!remarks) {
            alert("Remarks are required when rejecting a request.");
            return;
        }
    }

    const confirmation = window.confirm(
        action === "approve"
            ? "Are you sure you want to approve this leave request?"
            : "Are you sure you want to reject this leave request?"
    );

    if (!confirmation) {
        return;
    }

    try {
        const response = await fetch(
            `/api/hr/leave/requests/${requestId}/${action}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    remarks
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to process request.");
            return;
        }

        await loadHrLeaveRequests(leaveRequestStatus);
        await loadEmployeeLeave();

    } catch (error) {
        alert("Unable to connect to server.");
    }
}

async function loadEmployeeSalary() {
    const employeeId =
        document.getElementById("employeeSalaryId").value.trim();

    const month =
        document.getElementById("employeeSalaryMonth").value;

    const year =
        document.getElementById("employeeSalaryYear").value;

    const params = new URLSearchParams();

    if (employeeId) {
        params.set("employee_id", employeeId);
    }

    if (month) {
        params.set("month", month);
    }

    if (year) {
        params.set("year", year);
    }

    showTableMessage(
        "employeeSalaryTableBody",
        "Loading salary records...",
        8
    );

    try {
        const response = await fetch(
            `/api/payroll/hr?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
            showTableMessage(
                "employeeSalaryTableBody",
                data.message || "Unable to load salary records",
                8
            );
            return;
        }

        const salaries = data.salaries || [];

        if (salaries.length === 0) {
            showTableMessage(
                "employeeSalaryTableBody",
                "No salary records found",
                8
            );
            return;
        }

        document.getElementById(
            "employeeSalaryTableBody"
        ).innerHTML = salaries.map(salary => `
            <tr>
                <td>${salary.employee_id}</td>
                <td>${salary.employee_name || "-"}</td>
                <td>${salary.year}</td>
                <td>${salary.month}</td>
                <td>${formatMoney(salary.gross_pay)}</td>
                <td>${formatMoney(salary.tax)}</td>
                <td>${formatMoney(salary.other_deductions)}</td>
                <td>${formatMoney(salary.net_pay)}</td>
            </tr>
        `).join("");

    } catch (error) {
        showTableMessage(
            "employeeSalaryTableBody",
            "Unable to connect to server",
            8
        );
    }
}

async function loadYourDependants() {
    showTableMessage(
        "yourDependantsTableBody",
        "Loading dependants...",
        6
    );

    try {
        const response = await fetch(
            "/api/hr/your-dependants"
        );

        const data = await response.json();

        if (!response.ok) {
            showTableMessage(
                "yourDependantsTableBody",
                data.message || "Unable to load dependants",
                6
            );
            return;
        }

        const dependants = data.dependants || [];

        if (dependants.length === 0) {
            showTableMessage(
                "yourDependantsTableBody",
                "No dependants found",
                6
            );
            return;
        }

        document.getElementById(
            "yourDependantsTableBody"
        ).innerHTML = dependants.map(dependant => `
            <tr>
                <td>${dependant.employee_id}</td>
                <td>${dependant.dependant_id}</td>
                <td>${dependant.dependant_name || "-"}</td>
                <td>${dependant.relation_name || "-"}</td>
                <td>${dependant.gender || "-"}</td>
                <td>${formatDate(dependant.dob)}</td>
            </tr>
        `).join("");

    } catch (error) {
        showTableMessage(
            "yourDependantsTableBody",
            "Unable to connect to server",
            6
        );
    }
}

async function loadYourLeaveHistory() {
    showTableMessage(
        "yourLeaveHistoryTableBody",
        "Loading leave history...",
        6
    );

    try {
        const response = await fetch(
            "/api/hr/your-leaves"
        );

        const data = await response.json();

        if (!response.ok) {
            showTableMessage(
                "yourLeaveHistoryTableBody",
                data.message || "Unable to load leave history",
                6
            );
            return;
        }

        const leaves = data.leaves || [];

        if (leaves.length === 0) {
            showTableMessage(
                "yourLeaveHistoryTableBody",
                "No leave history found",
                6
            );
            return;
        }

        document.getElementById(
            "yourLeaveHistoryTableBody"
        ).innerHTML = leaves.map(leave => `
            <tr>
                <td>${leave.month || "-"}</td>
                <td>${leave.year || "-"}</td>
                <td>${leave.sick_leave ?? 0}</td>
                <td>${leave.casual_leave ?? 0}</td>
                <td>${leave.other_leave ?? 0}</td>
                <td>${leave.total_leaves ?? 0}</td>
            </tr>
        `).join("");

    } catch (error) {
        showTableMessage(
            "yourLeaveHistoryTableBody",
            "Unable to connect to server",
            6
        );
    }
}

async function loadYourPayroll() {
    const month =
        document.getElementById("yourPayrollMonth").value;

    const year =
        document.getElementById("yourPayrollYear").value;

    const params = new URLSearchParams();

    if (month) {
        params.set("month", month);
    }

    if (year) {
        params.set("year", year);
    }

    showTableMessage(
        "yourPayrollTableBody",
        "Loading payroll...",
        6
    );

    try {
        const response = await fetch(
            `/api/hr/your-payroll?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
            showTableMessage(
                "yourPayrollTableBody",
                data.message || "Unable to load payroll",
                6
            );
            return;
        }

        const salaries = data.salaries || [];

        if (salaries.length === 0) {
            showTableMessage(
                "yourPayrollTableBody",
                "No payroll records found",
                6
            );
            return;
        }

        document.getElementById(
            "yourPayrollTableBody"
        ).innerHTML = salaries.map(salary => `
            <tr>
                <td>${salary.year}</td>
                <td>${salary.month}</td>
                <td>${formatMoney(salary.gross_pay)}</td>
                <td>${formatMoney(salary.tax)}</td>
                <td>${formatMoney(salary.other_deductions)}</td>
                <td>${formatMoney(salary.net_pay)}</td>
            </tr>
        `).join("");

    } catch (error) {
        showTableMessage(
            "yourPayrollTableBody",
            "Unable to connect to server",
            6
        );
    }
}

navItems.forEach(item => {
    item.addEventListener("click", () => {
        const moduleName = item.dataset.module;

        if (moduleName === "employees") {
            return;
        }

        clearActiveNav();
        item.classList.add("active");

        employeesSubmenu.classList.remove("open");
        employeesArrow.classList.remove("open");

        showModule(moduleName);

        if (moduleName === "profile") {
            loadHrProfile();
        }

        if (moduleName === "yourDependants") {
            loadYourDependants();
        }

        if (moduleName === "yourLeaves") {
            loadYourLeaveHistory();
        }

        if (moduleName === "yourPayroll") {
            loadYourPayroll();
        }
    });
});

employeesNavButton.addEventListener("click", () => {
    const isOpen = employeesSubmenu.classList.contains("open");

    if (isOpen) {
        employeesSubmenu.classList.remove("open");
        employeesArrow.classList.remove("open");
        employeesNavButton.classList.remove("active");

        showModule("profile");

        navItems.forEach(item => {
            if (item.dataset.module === "profile") {
                item.classList.add("active");
            }
        });

        return;
    }

    clearActiveNav();

    employeesNavButton.classList.add("active");
    employeesSubmenu.classList.add("open");
    employeesArrow.classList.add("open");

    showModule("employees");
    setEmployeeSection(currentEmployeeSection);
});

employeeSubitems.forEach(item => {
    item.addEventListener("click", event => {
        event.stopPropagation();

        const sectionName = item.dataset.employeeSection;

        clearActiveNav();

        employeesNavButton.classList.add("active");
        employeesSubmenu.classList.add("open");
        employeesArrow.classList.add("open");

        showModule("employees");
        setEmployeeSection(sectionName);
    });
});

document
    .getElementById("filterEmployeeDetailsButton")
    .addEventListener("click", loadEmployeeDetails);

document
    .getElementById("filterEmployeeDependantsButton")
    .addEventListener("click", loadEmployeeDependants);

document
    .getElementById("filterEmployeeLeaveButton")
    .addEventListener("click", loadEmployeeLeave);

document
    .getElementById("filterEmployeeSalaryButton")
    .addEventListener("click", loadEmployeeSalary);

document
    .getElementById("filterYourPayrollButton")
    .addEventListener("click", loadYourPayroll);

document
    .querySelectorAll("[data-hr-dependant-tab]")
    .forEach(tab => {
        tab.addEventListener("click", () => {
            document
                .querySelectorAll("[data-hr-dependant-tab]")
                .forEach(item => item.classList.remove("active"));

            tab.classList.add("active");

            document
                .getElementById("hrDependantsTab")
                .classList.toggle(
                    "active",
                    tab.dataset.hrDependantTab === "dependants"
                );

            document
                .getElementById("hrDependantRequestsTab")
                .classList.toggle(
                    "active",
                    tab.dataset.hrDependantTab === "requests"
                );

            if (tab.dataset.hrDependantTab === "requests") {
                loadHrDependantRequests(dependantRequestStatus);
            } else {
                loadEmployeeDependants();
            }
        });
    });

document
    .querySelectorAll("[data-hr-dependant-request-tab]")
    .forEach(tab => {
        tab.addEventListener("click", () => {
            document
                .querySelectorAll("[data-hr-dependant-request-tab]")
                .forEach(item => item.classList.remove("active"));

            tab.classList.add("active");

            dependantRequestStatus =
                tab.dataset.hrDependantRequestTab === "processed"
                    ? "PROCESSED"
                    : "PENDING";

            loadHrDependantRequests(dependantRequestStatus);
        });
    });

document
    .querySelectorAll("[data-hr-leave-tab]")
    .forEach(tab => {
        tab.addEventListener("click", () => {
            document
                .querySelectorAll("[data-hr-leave-tab]")
                .forEach(item => item.classList.remove("active"));

            tab.classList.add("active");

            document
                .getElementById("hrLeavesTab")
                .classList.toggle(
                    "active",
                    tab.dataset.hrLeaveTab === "leaves"
                );

            document
                .getElementById("hrLeaveRequestsTab")
                .classList.toggle(
                    "active",
                    tab.dataset.hrLeaveTab === "requests"
                );

            if (tab.dataset.hrLeaveTab === "requests") {
                loadHrLeaveRequests(leaveRequestStatus);
            } else {
                loadEmployeeLeave();
            }
        });
    });

document
    .querySelectorAll("[data-hr-leave-request-tab]")
    .forEach(tab => {
        tab.addEventListener("click", () => {
            document
                .querySelectorAll("[data-hr-leave-request-tab]")
                .forEach(item => item.classList.remove("active"));

            tab.classList.add("active");

            leaveRequestStatus =
                tab.dataset.hrLeaveRequestTab === "processed"
                    ? "PROCESSED"
                    : "PENDING";

            loadHrLeaveRequests(leaveRequestStatus);
        });
    });

document.addEventListener("click", event => {
    const dependantButton =
        event.target.closest("[data-dependant-action]");

    if (dependantButton) {
        const action =
            dependantButton.dataset.dependantAction;

        const requestId =
            dependantButton.dataset.requestId;

        processDependantRequest(requestId, action);
        return;
    }

    const leaveButton =
        event.target.closest("[data-leave-action]");

    if (leaveButton) {
        const action =
            leaveButton.dataset.leaveAction;

        const requestId =
            leaveButton.dataset.requestId;

        processLeaveRequest(requestId, action);
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        await fetch("/api/auth/logout", {
            method: "POST"
        });
    } finally {
        window.location.href = "/hr-login";
    }
});

document
    .getElementById("employeeDetailsId")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            loadEmployeeDetails();
        }
    });

document
    .getElementById("employeeDependantsId")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            loadEmployeeDependants();
        }
    });

document
    .getElementById("employeeLeaveId")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            loadEmployeeLeave();
        }
    });

document
    .getElementById("employeeSalaryId")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            loadEmployeeSalary();
        }
    });

loadHrProfile();
showModule("profile");

navItems.forEach(item => {
    if (item.dataset.module === "profile") {
        item.classList.add("active");
    }
});