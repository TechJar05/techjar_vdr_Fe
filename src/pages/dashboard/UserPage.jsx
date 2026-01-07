import React, { useEffect, useState } from "react";
import { FaUser, FaSearch, FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Tooltip from "../../components/Style/Tooltip"; 

import { API_BASE_URL } from "../../config/apiConfig";


const styles = {
  page: {
    padding: 20,
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: "#0f172a",
    background: "#f3f6fb",
    // minHeight: "100vh",
  },

  card: {
    background: "#ffffff",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(2,6,23,0.06)",
    padding: 18,
    border: "1px solid #e9f0fb",
  },

  headerRow: { display: "flex", alignItems: "center", gap: 12 },
  titleRow: { display: "flex", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: 700, color: "#0f172a" },
  subtitle: { color: "#475569", fontSize: 13, marginTop: 6 },

  controlsRow: { display: "flex", gap: 12, alignItems: "center", marginTop: 14, flexWrap: "wrap" },
  searchWrapper: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, border: "1px solid #e6eef8", minWidth: 280, flex: 1, background: "#fbfdff" },
  input: { border: "none", outline: "none", width: "100%", fontSize: 14, background: "transparent" },
  select: { padding: "8px 10px", borderRadius: 8, border: "1px solid #e6eef8", background: "#fff", fontSize: 13 },
  primaryBtn: { padding: "8px 14px", borderRadius: 8, background: "#4f46e5", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 },
  neutralBtn: { padding: "8px 14px", borderRadius: 8, border: "1px solid #e6eef8", background: "#fff", cursor: "pointer", fontSize: 13 },
  metaText: { color: "#6b7280", fontSize: 13, marginLeft: "auto" },

  tableWrap: { overflowX: "auto", marginTop: 18, borderRadius: 10, border: "1px solid #eef2f7", background: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 760 },
  thead: { background: "#fbfdff" },
  th: { textAlign: "left", padding: "14px 16px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 16px", borderTop: "1px solid #f8fafc", verticalAlign: "middle", fontSize: 14, color: "#0f172a" },
  avatar: { height: 36, width: 36, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  actionBtn: { padding: "6px 8px", borderRadius: 8, border: "1px solid #e6eef8", background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },

  pagerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
  pageBtn: { padding: "8px 12px", borderRadius: 8, border: "1px solid #e6eef8", background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 },
  pageInfo: { color: "#6b7280", fontSize: 13 },

  // dialog
  overlay: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500 },
  dialog: { width: 420, background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 20px 60px rgba(2,6,23,0.2)" },
  dialogTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 },
  dialogMessage: { fontSize: 14, color: "#475569", marginBottom: 16 },
  dialogActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 },
  inputLabel: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#374151" },
  textInput: { padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef8", outline: "none", marginTop: 6 },

  // toast
  toastWrap: { position: "fixed", right: 18, bottom: 18, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8 },
  toast: { padding: "10px 14px", borderRadius: 10, color: "#fff", boxShadow: "0 8px 30px rgba(2,6,23,0.12)", fontSize: 13, minWidth: 160 },
  toastSuccess: { background: "#059669" },
  toastError: { background: "#dc2626" },
  toastInfo: { background: "#111827" },
};

const Header = ({ title, subtitle }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={styles.headerRow}>
      {/* <FaUser style={{ color: "#6366f1", fontSize: 20, marginLeft: 10 }} /> */}
      <div>
        <div style={styles.title}>{title}</div>
        <div style={styles.subtitle}>{subtitle}</div>
      </div>
    </div>
  </div>
);

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [error, setError] = useState(null);

  const [confirm, setConfirm] = useState({ open: false, email: null, action: null, message: "" });
  const [editModal, setEditModal] = useState({ open: false, email: null, name: "", role: "" });
  const [toasts, setToasts] = useState([]);

  const buildUrl = (page = 1, limit = meta.limit) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (roleFilter) params.set("role", roleFilter);
    params.set("page", page);
    params.set("limit", limit);
    return `${API_BASE_URL}/users?${params.toString()}`;
  };

  const fetchUsers = async (page = 1, limit = meta.limit) => {
    setLoading(true);
    setError(null);
    try {
      const url = buildUrl(page, limit);
      const res = await fetch(url, { credentials: "include" });
      const text = await res.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }

      if (!res.ok) {
        const msg = (body && (body.message || body.error)) || `Failed to load users: ${res.status}`;
        throw new Error(msg);
      }

      let rows = [];
      let newMeta = { total: 0, page, limit, pages: 1 };

      if (Array.isArray(body)) {
        rows = body;
        newMeta = { total: rows.length, page, limit, pages: Math.max(1, Math.ceil(rows.length / limit)) };
      } else if (body && Array.isArray(body.data)) {
        rows = body.data;
        newMeta = body.meta || { total: rows.length, page, limit, pages: Math.max(1, Math.ceil(rows.length / limit)) };
      } else if (body && Array.isArray(body.rows)) {
        rows = body.rows;
        newMeta = body.meta || { total: rows.length, page, limit, pages: Math.max(1, Math.ceil(rows.length / limit)) };
      } else if (body && Array.isArray(body.result)) {
        rows = body.result;
        newMeta = body.meta || { total: rows.length, page, limit, pages: Math.max(1, Math.ceil(rows.length / limit)) };
      } else if (body && typeof body === "object" && Object.keys(body).length) {
        rows = [body];
        newMeta = { total: 1, page, limit, pages: 1 };
      } else {
        rows = [];
        newMeta = { total: 0, page, limit, pages: 1 };
      }

      const normalized = rows.map((r) => ({
        name: r.NAME ?? r.name ?? r.fullName ?? r.full_name ?? "",
        email: r.EMAIL ?? r.email ?? "",
        role: r.ROLE ?? r.role ?? "",
        CREATED_AT: r.CREATED_AT ?? r.createdAt ?? r.created_at ?? null,
        _raw: r,
      }));

      setUsers(normalized);
      setMeta(newMeta);
    } catch (err) {
      console.error("fetchUsers", err);
      setError(err.message || "Failed to load users");
      setUsers([]);
      setMeta({ total: 0, page: 1, limit: meta.limit, pages: 1 });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(1); /* eslint-disable-next-line */ }, []);

  const handleSearch = (e) => { e?.preventDefault?.(); fetchUsers(1); };
  const goPage = (newPage) => { if (newPage < 1 || newPage > meta.pages) return; fetchUsers(newPage); };

  const openEdit = (email) => {
    const u = users.find((x) => x.email === email);
    if (!u) return pushToast("User not found", "error");
    setEditModal({ open: true, email, name: u.name || "", role: u.role || "" });
  };

  const performEdit = async () => {
    const { email, name, role } = editModal;
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Update failed ${res.status}`);
      }
      setEditModal({ open: false, email: null, name: "", role: "" });
      await fetchUsers(meta.page);
      pushToast("User updated", "success");
    } catch (err) {
      console.error("update", err);
      pushToast("Update failed: " + (err.message || err), "error");
    } finally { setLoading(false); }
  };

  const openDeleteConfirm = (email) => {
    setConfirm({ open: true, email, action: "delete", message: `Are you sure you want to permanently delete ${email}? This action cannot be undone.` });
  };

  const performDelete = async () => {
    const email = confirm.email;
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Delete failed ${res.status}`);
      }
      setConfirm({ open: false, email: null, action: null, message: "" });
      const newPage = Math.min(meta.page, Math.max(1, Math.ceil((meta.total - 1) / meta.limit)));
      await fetchUsers(newPage);
      pushToast("User deleted", "success");
    } catch (err) {
      console.error("delete", err);
      pushToast("Delete failed: " + (err.message || err), "error");
    } finally { setLoading(false); }
  };

  const pushToast = (text, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  const formatDate = (input) => {
    if (!input) return "-";
    try { const d = new Date(input); return d.toLocaleString(); } catch { return String(input); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Header title="Users" subtitle="Manage user accounts, roles and access permissions." />

        <div style={styles.card}>
          <form onSubmit={handleSearch} style={styles.controlsRow}>
            <div style={styles.searchWrapper}>
              <FaSearch style={{ color: "#94a3b8" }} />
              <input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} style={styles.input} />
              <div style={{ marginLeft: 8 }}>{loading ? <span style={{ color: "#64748b", fontSize: 13 }}>Loading...</span> : null}</div>
            </div>

            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={styles.select}>
              <option value="">All roles</option>
              <option value="admin">admin</option>
              <option value="user">user</option>
            </select>

            <button type="submit" style={styles.primaryBtn}>Search</button>
            <button type="button" onClick={() => { setQ(""); setRoleFilter(""); fetchUsers(1); }} style={{ ...styles.neutralBtn, marginLeft: 8 }}>Reset</button>

            <div style={styles.metaText}>{loading ? "Loading..." : `${meta.total} users • page ${meta.page} of ${meta.pages}`}</div>
          </form>

          {error && <div style={{ color: "#dc2626", marginTop: 12 }}>{error}</div>}

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Created At</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !loading ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 28, color: "#6b7280" }}>No users found.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.email} style={{ transition: "background 120ms" }}>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ ...styles.avatar, background: "#eef2ff", color: "#4f46e5" }}>{(u.name || "").charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{u._raw?.displayName || ""}</div>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>{u.role || "—"}</td>
                      <td style={styles.td}>{formatDate(u.CREATED_AT)}</td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8 }}>
                          <Tooltip text="Edit" position="top">
                            <button onClick={() => openEdit(u.email)} style={styles.actionBtn} aria-label={`Edit ${u.email}`}>
                              <FaEdit />
                            </button>
                          </Tooltip>

                          <Tooltip text="Delete" position="top">
                            <button onClick={() => openDeleteConfirm(u.email)} style={{ ...styles.actionBtn, marginLeft: 4, borderColor: "#fdecea", color: "#b91c1c" }} aria-label={`Delete ${u.email}`}>
                              <FaTrash />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.pagerRow}>
            <div>
              <button onClick={() => goPage(meta.page - 1)} disabled={meta.page <= 1} style={{ ...styles.pageBtn, opacity: meta.page <= 1 ? 0.5 : 1 }}>
                <FaChevronLeft /> Prev
              </button>

              <button onClick={() => goPage(meta.page + 1)} disabled={meta.page >= meta.pages} style={{ ...styles.pageBtn, marginLeft: 8, opacity: meta.page >= meta.pages ? 0.5 : 1 }}>
                Next <FaChevronRight />
              </button>
            </div>

            <div style={styles.pageInfo}>Page {meta.page} of {meta.pages} • {meta.total} users</div>
          </div>
        </div>

        {/* Confirm Dialog */}
        {confirm.open && confirm.action === "delete" && (
          <div style={styles.overlay} onClick={() => setConfirm({ open: false, email: null, action: null, message: "" })}>
            <div style={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <h3 style={styles.dialogTitle}>Confirm delete</h3>
              <p style={styles.dialogMessage}>{confirm.message}</p>
              <div style={styles.dialogActions}>
                <button onClick={() => setConfirm({ open: false, email: null, action: null, message: "" })} style={{ ...styles.neutralBtn }}>Cancel</button>
                <button onClick={performDelete} style={{ ...styles.primaryBtn, background: "#ef4444" }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModal.open && (
          <div style={styles.overlay} onClick={() => setEditModal({ open: false, email: null, name: "", role: "" })}>
            <div style={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <h3 style={styles.dialogTitle}>Edit user</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={styles.inputLabel}>
                  Name
                  <input value={editModal.name} onChange={(e) => setEditModal((s) => ({ ...s, name: e.target.value }))} style={styles.textInput} autoFocus />
                </label>

                <label style={styles.inputLabel}>
                  Role
                  <input value={editModal.role} onChange={(e) => setEditModal((s) => ({ ...s, role: e.target.value }))} style={styles.textInput} />
                </label>
              </div>

              <div style={styles.dialogActions}>
                <button onClick={() => setEditModal({ open: false, email: null, name: "", role: "" })} style={{ ...styles.neutralBtn }}>Cancel</button>
                <button onClick={performEdit} style={styles.primaryBtn}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div style={styles.toastWrap}>
          {toasts.map((t) => (
            <div key={t.id} style={{ ...styles.toast, ...(t.type === "success" ? styles.toastSuccess : t.type === "error" ? styles.toastError : styles.toastInfo) }}>{t.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
