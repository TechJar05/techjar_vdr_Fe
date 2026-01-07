import React, { useEffect, useMemo, useState } from "react";
import { FaDownload, FaSearch, FaSyncAlt } from "react-icons/fa";
import apiRequest from "../../utils/apiClient";

const styles = {
  page: {
    padding: "24px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
    color: "#0f172a",
  },
  header: { marginBottom: 18 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: "#0f172a" },
  subtitle: { margin: "6px 0 0", fontSize: 14, color: "#475569" },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  label: { fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 14,
    outline: "none",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#fff",
  },
  btnRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 8,
  },
  btn: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  primary: { background: "#10b981", color: "#fff" },
  ghost: { background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0" },
  danger: { background: "#f97316", color: "#fff" },
  tableWrap: { marginTop: 14, overflowX: "auto", borderRadius: 12, border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 720 },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    fontSize: 12,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  td: { padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 14, color: "#0f172a" },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    background: "#eef2ff",
    color: "#4338ca",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  badge: { fontSize: 12, color: "#475569", background: "#e2e8f0", padding: "4px 8px", borderRadius: 6 },
  empty: { padding: 28, textAlign: "center", color: "#64748b" },
  error: { color: "#dc2626", marginTop: 8 },
  meta: { fontSize: 13, color: "#475569" },
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
};

const exportCsv = (rows) => {
  const headers = ["#", "User Name", "Role", "Created Date", "IP Address", "Description", "Action"];
  const csv = [
    headers.join(","),
    ...rows.map((row, idx) =>
      [
        idx + 1,
        `"${(row.USER_NAME || row.USER_EMAIL || "").replace(/"/g, '""')}"`,
        `"${(row.ROLE || "").replace(/"/g, '""')}"`,
        `"${formatDate(row.CREATED_AT)}"`,
        `"${(row.IP_ADDRESS || "").replace(/"/g, '""')}"`,
        `"${(row.DESCRIPTION || "").replace(/"/g, '""')}"`,
        `"${(row.ACTION || "").replace(/"/g, '""')}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `user-logs-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function UserLogsPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    user: "",
    search: "",
    from: "",
    to: "",
  });

  const fetchUsers = async () => {
    try {
      const data = await apiRequest("/api/users");
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users for filter", err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.user) params.set("user", filters.user);
      if (filters.search) params.set("q", filters.search);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      params.set("limit", 400);

      const response = await apiRequest(`/api/logs?${params.toString()}`);
      const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setLogs(rows);
    } catch (err) {
      console.error("Failed to fetch logs", err);
      setError(err.message || "Failed to load logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    setFilters({ user: "", search: "", from: "", to: "" });
    fetchLogs();
  };

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        label: u.NAME || u.name || u.email || u.EMAIL,
        value: u.EMAIL || u.email,
      })),
    [users]
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>User Logs</h1>
        <p style={styles.subtitle}>Monitor every action performed across the workspace.</p>
      </div>

      <div style={styles.card}>
        <div style={styles.filters}>
          <div>
            <div style={styles.label}>Select User</div>
            <select
              value={filters.user}
              onChange={(e) => setFilters((s) => ({ ...s, user: e.target.value }))}
              style={styles.input}
            >
              <option value="">All users</option>
              {userOptions.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={styles.label}>From Date</div>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))}
              style={styles.input}
            />
          </div>

          <div>
            <div style={styles.label}>To Date</div>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))}
              style={styles.input}
            />
          </div>

          <div>
            <div style={styles.label}>Search</div>
            <div style={styles.searchBox}>
              <FaSearch style={{ color: "#94a3b8" }} />
              <input
                placeholder="Search description or action"
                value={filters.search}
                onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))}
                style={{ border: "none", outline: "none", width: "100%", background: "transparent" }}
              />
            </div>
          </div>
        </div>

        <div style={styles.btnRow}>
          <button style={{ ...styles.btn, ...styles.primary }} onClick={fetchLogs} disabled={loading}>
            <FaSyncAlt /> {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button style={{ ...styles.btn, ...styles.ghost }} onClick={handleReset} disabled={loading}>
            Reset
          </button>
          <button
            style={{ ...styles.btn, ...styles.danger, marginLeft: "auto" }}
            onClick={() => logs.length && exportCsv(logs)}
            disabled={!logs.length}
          >
            <FaDownload /> Export CSV
          </button>
          <div style={styles.meta}>{logs.length} records</div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>User Name</th>
                <th style={styles.th}>Created Date</th>
                <th style={styles.th}>User IP Address</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} style={styles.empty}>
                    No log entries found for the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.ID || idx}>
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontWeight: 700 }}>{log.USER_NAME || log.USER_EMAIL || "—"}</span>
                        <span style={styles.badge}>{log.USER_EMAIL || "—"}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{formatDate(log.CREATED_AT)}</td>
                    <td style={styles.td}>{log.IP_ADDRESS || "—"}</td>
                    <td style={styles.td}>{log.DESCRIPTION || "—"}</td>
                    <td style={styles.td}>
                      <span style={styles.pill}>{log.ACTION || "—"}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
