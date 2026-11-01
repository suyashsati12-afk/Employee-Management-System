
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:3000/api/employees";

const emptyForm = {
  employee_code: "",
  name: "",
  email: "",
  department: "",
  designation: "",
  salary: "",
  joining_date: "",
  status: "Active",
};

function App() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showForm, setShowForm] = useState(false);

  async function loadEmployees(pageToLoad = page) {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API, {
        params: {
          page: pageToLoad,
          limit: pageSize,
          search: search.trim(),
          department,
          status,
        },
      });

      const result = response.data;

      setEmployees(Array.isArray(result.data) ? result.data : []);
      setPagination(
        result.pagination || {
          page: pageToLoad,
          limit: pageSize,
          total: result.data?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Employees load nahi hue. Backend server check karo."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees(page);
  }, [page, pageSize, search, department, status]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function handleEdit(employee) {
    setEditingId(employee.id);

    setForm({
      employee_code: employee.employee_code || "",
      name: employee.name || "",
      email: employee.email || "",
      department: employee.department || "",
      designation: employee.designation || "",
      salary: employee.salary ?? "",
      joining_date: employee.joining_date
        ? String(employee.joining_date).slice(0, 10)
        : "",
      status: employee.status || "Active",
    });

    setShowForm(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        salary: Number(form.salary),
      };

      if (editingId !== null) {
        await axios.put(`${API}/${editingId}`, payload);
        setSuccess("Employee successfully updated!");
      } else {
        await axios.post(API, payload);
        setSuccess("Employee successfully added!");
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      if (page !== 1) {
        setPage(1);
      } else {
        await loadEmployees(1);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Employee save nahi hua. Form details check karo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(employee) {
    const confirmed = window.confirm(
      `Kya aap ${employee.name} ka record delete karna chahte ho?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await axios.delete(`${API}/${employee.id}`);
      setSuccess("Employee successfully deleted!");

      const nextPage =
        employees.length === 1 && page > 1 ? page - 1 : page;

      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await loadEmployees(page);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Employee delete nahi ho paya."
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setDepartment("");
    setStatus("");
    setSortBy("newest");
    setPage(1);
  }

  // Sorting is applied to the records loaded on the current page.
  const sortedEmployees = [...employees].sort((a, b) => {
    switch (sortBy) {
      case "name_asc":
        return (a.name || "").localeCompare(b.name || "");

      case "name_desc":
        return (b.name || "").localeCompare(a.name || "");

      case "salary_high":
        return Number(b.salary || 0) - Number(a.salary || 0);

      case "salary_low":
        return Number(a.salary || 0) - Number(b.salary || 0);

      case "joining_new":
        return (
          new Date(b.joining_date || 0).getTime() -
          new Date(a.joining_date || 0).getTime()
        );

      case "joining_old":
        return (
          new Date(a.joining_date || 0).getTime() -
          new Date(b.joining_date || 0).getTime()
        );

      case "newest":
      default:
        return Number(b.id || 0) - Number(a.id || 0);
    }
  });

  const totalEmployees = Number(pagination.total || 0);

  const activeEmployees = employees.filter(
    (employee) => employee.status?.toLowerCase() === "active"
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.status?.toLowerCase() === "inactive"
  ).length;

  const departments = [
    ...new Set(
      employees.map((employee) => employee.department).filter(Boolean)
    ),
  ];

  function formatSalary(salary) {
    const amount = Number(salary);
    if (!Number.isFinite(amount)) return "—";

    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  }

  function formatDate(date) {
    if (!date) return "—";

    const value = String(date).slice(0, 10);
    const parts = value.split("-");

    if (parts.length !== 3) return value;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">E</div>
          <div>
            <h2>EmployeeHub</h2>
            <p>Management System</p>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav className="navigation">
          <button
            className={
              activeTab === "Dashboard" ? "nav-item active" : "nav-item"
            }
            onClick={() => setActiveTab("Dashboard")}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            className={
              activeTab === "Employees" ? "nav-item active" : "nav-item"
            }
            onClick={() => {
              setActiveTab("Employees");
              document
                .getElementById("employee-directory")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span>♙</span> Employees
          </button>

          <button
            className={
              activeTab === "Reports" ? "nav-item active" : "nav-item"
            }
            onClick={() => setActiveTab("Reports")}
          >
            <span>▤</span> Reports
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>System Admin</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace /</span>
            <span className="breadcrumb-current">{activeTab}</span>
          </div>

          <div className="profile-chip">
            <div className="profile-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>Admin Account</span>
            </div>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>
              {activeTab === "Reports"
                ? "Employee Reports"
                : activeTab === "Employees"
                  ? "Employee Directory"
                  : "Employee Dashboard"}
            </h1>
            <p className="subheading">
              Manage your team and employee records in one place.
            </p>
          </div>

          <div className="heading-actions">
            <button
              className="button button-light"
              onClick={() => loadEmployees(page)}
              disabled={loading}
            >
              ↻ {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button className="button button-primary" onClick={openAddForm}>
              + Add Employee
            </button>
          </div>
        </section>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span>
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>✓</span>
            <span>{success}</span>
            <button onClick={() => setSuccess("")}>×</button>
          </div>
        )}

        {activeTab === "Reports" ? (
          <section className="panel report-panel">
            <div className="section-heading">
              <div>
                <h2>Employee Reports</h2>
                <p>Summary of the records matching your current filters.</p>
              </div>
            </div>

            <div className="report-grid">
              <div className="report-card">
                <span>Total matching records</span>
                <strong>{totalEmployees}</strong>
              </div>
              <div className="report-card">
                <span>Active on current page</span>
                <strong>{activeEmployees}</strong>
              </div>
              <div className="report-card">
                <span>Inactive on current page</span>
                <strong>{inactiveEmployees}</strong>
              </div>
            </div>

            <button
              className="button button-primary"
              onClick={() => setActiveTab("Employees")}
            >
              View Employee Directory
            </button>
          </section>
        ) : (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon purple">♙</div>
                  <span className="stat-tag">Records</span>
                </div>
                <p>Total Employees</p>
                <h2>{totalEmployees}</h2>
                <span className="stat-description">
                  Matching your current filters
                </span>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green">✓</div>
                  <span className="stat-tag">Active</span>
                </div>
                <p>Active Employees</p>
                <h2>{activeEmployees}</h2>
                <span className="stat-description">On the current page</span>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon orange">◷</div>
                  <span className="stat-tag">Inactive</span>
                </div>
                <p>Inactive Employees</p>
                <h2>{inactiveEmployees}</h2>
                <span className="stat-description">On the current page</span>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon blue">▤</div>
                  <span className="stat-tag">Departments</span>
                </div>
                <p>Departments</p>
                <h2>{departments.length}</h2>
                <span className="stat-description">On the current page</span>
              </div>
            </section>

            {showForm && (
              <section className="panel form-panel" id="employee-form">
                <div className="section-heading">
                  <div>
                    <h2>{editingId ? "Edit Employee" : "Add New Employee"}</h2>
                    <p>Enter the employee details below.</p>
                  </div>

                  <button
                    className="close-button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                    aria-label="Close form"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <label>
                      Employee Code *
                      <input
                        name="employee_code"
                        value={form.employee_code}
                        onChange={updateForm}
                        placeholder="EMP001"
                        required
                      />
                    </label>

                    <label>
                      Full Name *
                      <input
                        name="name"
                        value={form.name}
                        onChange={updateForm}
                        placeholder="Enter full name"
                        required
                      />
                    </label>

                    <label>
                      Email Address *
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateForm}
                        placeholder="employee@example.com"
                        required
                      />
                    </label>

                    <label>
                      Department *
                      <input
                        name="department"
                        value={form.department}
                        onChange={updateForm}
                        placeholder="e.g. IT"
                        required
                      />
                    </label>

                    <label>
                      Designation *
                      <input
                        name="designation"
                        value={form.designation}
                        onChange={updateForm}
                        placeholder="e.g. Software Developer"
                        required
                      />
                    </label>

                    <label>
                      Salary (₹) *
                      <input
                        name="salary"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.salary}
                        onChange={updateForm}
                        placeholder="Enter salary"
                        required
                      />
                    </label>

                    <label>
                      Joining Date *
                      <input
                        name="joining_date"
                        type="date"
                        value={form.joining_date}
                        onChange={updateForm}
                        required
                      />
                    </label>

                    <label>
                      Employment Status *
                      <select
                        name="status"
                        value={form.status}
                        onChange={updateForm}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="button button-light"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setForm(emptyForm);
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingId
                          ? "Save Changes"
                          : "Add Employee"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="panel directory-panel" id="employee-directory">
              <div className="section-heading">
                <div>
                  <h2>Employee Directory</h2>
                  <p>Search, filter, sort and manage employee records.</p>
                </div>
                <span className="total-badge">{totalEmployees} records</span>
              </div>

              <div className="filters">
                <div className="search-box">
                  <span>⌕</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, code, email..."
                    aria-label="Search employees"
                  />
                </div>

                <select
                  value={department}
                  onChange={(event) => {
                    setDepartment(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by department"
                >
                  <option value="">All Departments</option>
                  {departments.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  aria-label="Sort employees"
                >
                  <option value="newest">Newest First</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                  <option value="salary_high">Salary: High to Low</option>
                  <option value="salary_low">Salary: Low to High</option>
                  <option value="joining_new">Joining Date: Newest</option>
                  <option value="joining_old">Joining Date: Oldest</option>
                </select>

                <button className="button button-light" onClick={resetFilters}>
                  Reset
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th>
                      <th>DEPARTMENT</th>
                      <th>DESIGNATION</th>
                      <th>SALARY</th>
                      <th>JOINING DATE</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          <div className="loader" />
                          Loading employees...
                        </td>
                      </tr>
                    ) : sortedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          <div className="empty-icon">♙</div>
                          <strong>No employees found</strong>
                          <p>Try another search or add a new employee.</p>
                        </td>
                      </tr>
                    ) : (
                      sortedEmployees.map((employee) => (
                        <tr key={employee.id}>
                          <td>
                            <div className="employee-cell">
                              <div className="employee-avatar">
                                {(employee.name || "?")
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <strong>{employee.name}</strong>
                                <span>{employee.employee_code}</span>
                                <small>{employee.email}</small>
                              </div>
                            </div>
                          </td>

                          <td>{employee.department || "—"}</td>
                          <td>{employee.designation || "—"}</td>
                          <td className="salary-cell">
                            {formatSalary(employee.salary)}
                          </td>
                          <td>{formatDate(employee.joining_date)}</td>

                          <td>
                            <span
                              className={`status-badge ${
                                employee.status?.toLowerCase() === "active"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {employee.status || "Unknown"}
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                className="icon-button edit-button"
                                onClick={() => handleEdit(employee)}
                                title="Edit employee"
                                aria-label={`Edit ${employee.name}`}
                              >
                                ✎
                              </button>

                              <button
                                className="icon-button delete-button"
                                onClick={() => handleDelete(employee)}
                                title="Delete employee"
                                aria-label={`Delete ${employee.name}`}
                              >
                                ×
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pagination-bar">
                <div className="pagination-info">
                  Showing{" "}
                  {totalEmployees === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, totalEmployees)} of{" "}
                  {totalEmployees} employees
                </div>

                <div className="pagination-controls">
                  <label>
                    Rows:
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>

                  <button
                    className="page-button"
                    onClick={() => setPage((previous) => previous - 1)}
                    disabled={page <= 1 || loading}
                  >
                    ← Previous
                  </button>

                  <span className="page-number">
                    {page} / {Math.max(1, pagination.totalPages || 1)}
                  </span>

                  <button
                    className="page-button"
                    onClick={() => setPage((previous) => previous + 1)}
                    disabled={
                      page >= (pagination.totalPages || 1) || loading
                    }
                  >
                    Next →
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          <span>© {new Date().getFullYear()} EmployeeHub</span>
          <span>Employee Management System</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
