// ============================================================
//  script.js  —  Employee Directory
//  Lab 9: Reads employee data from XML and displays it.
// ============================================================

// ---- Grab DOM references ----
const tbody        = document.getElementById("employeeBody");
const totalCountEl = document.getElementById("totalCount");
const resultCountEl= document.getElementById("resultCount");
const searchInput  = document.getElementById("searchInput");

// ---- Store the full employee list from XML ----
let allEmployees = [];

// ============================================================
//  1.  LOAD XML  — fetch employees.xml and parse it
// ============================================================
async function loadEmployees() {
    showLoading();                        // Show spinner while fetching

    try {
        const response = await fetch("employees.xml");

        // If the server returned an error status, throw so we catch below
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const xmlText = await response.text();

        // Use DOMParser to convert the XML string into a DOM tree
        const parser  = new DOMParser();
        const xmlDoc  = parser.parseFromString(xmlText, "application/xml");

        // Check if DOMParser flagged a parse error
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
            throw new Error("XML parse error — check the employees.xml file.");
        }

        // Extract <employee> nodes and convert each to a plain JS object
        const nodes = xmlDoc.querySelectorAll("employee");
        allEmployees = Array.from(nodes).map(node => ({
            id:          getText(node, "id"),
            name:        getText(node, "name"),
            department:  getText(node, "department"),
            designation: getText(node, "designation"),
            email:       getText(node, "email"),
            salary:      getText(node, "salary")
        }));

        // Update the total-employee count badge
        totalCountEl.textContent = allEmployees.length;

        // Render all employees (no search filter yet)
        renderTable(allEmployees);

    } catch (error) {
        showError(error.message);
    }
}

// ---- Helper: safely get text content of a child element ----
function getText(parentNode, tagName) {
    const el = parentNode.querySelector(tagName);
    return el ? el.textContent.trim() : "—";
}

// ============================================================
//  2.  RENDER TABLE  — build <tr> rows from the data array
// ============================================================
function renderTable(employees) {
    tbody.innerHTML = "";   // Clear any existing rows

    if (employees.length === 0) {
        showEmpty();
        updateResultCount(0);
        return;
    }

    employees.forEach(emp => {
        const tr = document.createElement("tr");
        tr.classList.add("animated");

        tr.innerHTML = `
            <td><span class="badge-id">${escapeHtml(emp.id)}</span></td>
            <td>
                <span class="emp-name">
                    <span class="avatar">${getInitials(emp.name)}</span>
                    ${escapeHtml(emp.name)}
                </span>
            </td>
            <td><span class="dept-chip ${getDeptClass(emp.department)}">${escapeHtml(emp.department)}</span></td>
            <td>${escapeHtml(emp.designation)}</td>
            <td><a href="mailto:${escapeHtml(emp.email)}" class="email-link">${escapeHtml(emp.email)}</a></td>
            <td><span class="salary-val">${formatSalary(emp.salary)}</span></td>
        `;

        tbody.appendChild(tr);
    });

    updateResultCount(employees.length);
}

// ============================================================
//  3.  SEARCH  — filter employees by name, dept or designation
// ============================================================
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();

    if (query === "") {
        // If the search box is empty, show everyone
        renderTable(allEmployees);
        return;
    }

    const filtered = allEmployees.filter(emp => {
        return (
            emp.name.toLowerCase().includes(query)        ||
            emp.department.toLowerCase().includes(query)  ||
            emp.designation.toLowerCase().includes(query)
        );
    });

    renderTable(filtered);
}

// Listen for keystrokes in the search box
searchInput.addEventListener("input", handleSearch);

// ============================================================
//  4.  STATE HELPERS  — loading / empty / error UI
// ============================================================
function showLoading() {
    tbody.innerHTML = `
        <tr class="state-row">
            <td colspan="6">
                <div class="spinner"></div>
                <p>Loading employee data…</p>
            </td>
        </tr>
    `;
}

function showEmpty() {
    tbody.innerHTML = `
        <tr class="state-row">
            <td colspan="6">
                <div class="state-icon">🔍</div>
                <p>No employees match your search. Try a different keyword.</p>
            </td>
        </tr>
    `;
}

function showError(message) {
    tbody.innerHTML = `
        <tr class="state-row">
            <td colspan="6">
                <div class="state-icon">⚠️</div>
                <p><strong>Could not load data.</strong><br>${escapeHtml(message)}</p>
            </td>
        </tr>
    `;
    // Also reset the total count on error
    totalCountEl.textContent = "—";
}

function updateResultCount(count) {
    resultCountEl.textContent =
        count === allEmployees.length
            ? `Showing all ${count} employees`
            : `${count} of ${allEmployees.length} employees`;
}

// ============================================================
//  5.  UTILITY FUNCTIONS
// ============================================================

// Get initials from a full name (e.g., "Arjun Mehta" → "AM")
function getInitials(name) {
    return name
        .split(" ")
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");
}

// Map department name to a CSS class for the colour chip
function getDeptClass(dept) {
    const map = {
        "engineering":    "dept-engineering",
        "design":         "dept-design",
        "human resources":"dept-hr",
        "marketing":      "dept-marketing",
        "finance":        "dept-finance"
    };
    return map[dept.toLowerCase()] || "dept-default";
}

// Format salary: "95000" → "₹95,000"
function formatSalary(value) {
    const num = parseInt(value, 10);
    if (isNaN(num)) return value;
    return "₹" + num.toLocaleString("en-IN");
}

// Prevent XSS by escaping HTML special characters
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ============================================================
//  ENTRY POINT  — Run when the page has fully loaded
// ============================================================
document.addEventListener("DOMContentLoaded", loadEmployees);
