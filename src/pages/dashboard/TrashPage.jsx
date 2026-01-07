// src/pages/TrashPage.jsx
import React, { useEffect, useState } from "react";
import {
  FaTrashRestore,
  FaTrash,
  FaFileAlt,
  FaFolder,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaSyncAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Tooltip from "../../components/Style/Tooltip";
import Button from "../../components/Style/Button";
import ToastBar from "../../components/Style/Toastbar";
import apiRequest from "../../utils/apiClient";

export default function TrashPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  // Confirm dialog state for restore and delete
  const [confirm, setConfirm] = useState({ open: false, id: null, message: "", action: null });

  // Toast state
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

  useEffect(() => {
    fetchTrash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest("/api/trash");
      setItems(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (err) {
      console.error("fetchTrash", err);
      setError(err.message || "Failed to load trash");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // open confirmation modal for restore
  const openRestoreConfirm = (id, name) => {
    setConfirm({
      open: true,
      id,
      message: `Restore "${name}" from trash?`,
      action: "restore",
    });
  };

  // open confirmation modal for permanent delete
  const openDeleteConfirm = (id, name) => {
    setConfirm({
      open: true,
      id,
      message: `Permanently delete "${name}"? This action cannot be undone and will remove the file from storage.`,
      action: "delete",
    });
  };

  // perform restore (called when confirm dialog's Confirm pressed)
  const performRestore = async () => {
    const id = confirm.id;
    if (!id) return;
    // optimistic flag
    setItems((prev) => prev.map((it) => (it.ID === id ? { ...it, _restoring: true } : it)));
    setConfirm({ open: false, id: null, message: "", action: null });

    try {
      await apiRequest(`/api/trash/restore/${encodeURIComponent(id)}`, {
        method: "POST",
      });

      setItems((prev) => prev.filter((it) => it.ID !== id));
      setToast({ show: true, type: "success", message: "Item restored" });
    } catch (err) {
      console.error("restore", err);
      setToast({ show: true, type: "error", message: "Restore failed: " + (err.message || err) });
      // rollback optimistic flag
      setItems((prev) => prev.map((it) => (it.ID === id ? { ...it, _restoring: false } : it)));
    }
  };

  // perform permanent delete (called when confirm dialog's Confirm pressed)
  const performPermanentDelete = async () => {
    const id = confirm.id;
    if (!id) return;
    // optimistic flag
    setItems((prev) => prev.map((it) => (it.ID === id ? { ...it, _deleting: true } : it)));
    setConfirm({ open: false, id: null, message: "", action: null });

    try {
      await apiRequest(`/api/trash/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      setItems((prev) => prev.filter((it) => it.ID !== id));
      setToast({ show: true, type: "success", message: "Item permanently deleted" });
    } catch (err) {
      console.error("permanent delete", err);
      setToast({ show: true, type: "error", message: "Delete failed: " + (err.message || err) });
      // rollback optimistic flag
      setItems((prev) => prev.map((it) => (it.ID === id ? { ...it, _deleting: false } : it)));
    }
  };

  // derived filtered list
  const filtered = items
    .filter((it) => {
      if (typeFilter && String(it.ITEM_TYPE).toLowerCase() !== typeFilter.toLowerCase()) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        String(it.NAME || it.name || it.FILE_NAME || "").toLowerCase().includes(s) ||
        String(it.ID || "").toLowerCase().includes(s) ||
        String(it.DELETED_BY || "").toLowerCase().includes(s)
      );
    })
    .sort((a, b) => new Date(b.DELETED_AT) - new Date(a.DELETED_AT));

  const pages = Math.max(1, Math.ceil(filtered.length / limit));
  const visible = filtered.slice((page - 1) * limit, page * limit);

  // auto-hide toast
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((s) => ({ ...s, show: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.show]);

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.h1}>Trash</h1>
          <p style={styles.sub}>View, search and restore deleted items.</p>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.searchRow}>
            <div style={styles.searchBox}>
              <FaSearch style={styles.iconMuted} />
              <input
                placeholder="Search by name, id or user"
                style={styles.searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button style={styles.clearBtn} onClick={() => setQ("")} aria-label="Clear search">
                  <FaTimes />
                </button>
              )}
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={styles.select}
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              <option value="file">file</option>
              <option value="folder">folder</option>
            </select>

            <Button
              text={loading ? "Loading..." : "Refresh"}
              icon={loading ? <FaSpinner className="spin" /> : <FaSyncAlt />}
              onClick={fetchTrash}
              style={styles.ghostBtn}
              disabled={loading}
            />
          </div>
        </div>
      </header>

      <main>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.gridContainer}>
          {loading ? (
            <div style={styles.loadingRow}>
              <FaSpinner style={{ marginRight: 8 }} /> Loading trash...
            </div>
          ) : visible.length === 0 ? (
            <div style={styles.empty}>No deleted items match your search.</div>
          ) : (
            visible.map((it) => {
              const name = it.ITEM_NAME || it.NAME || it.FILE_NAME || it.name || "Untitled";
              const type = String(it.ITEM_TYPE || "file").toLowerCase();
              const deletedAt = it.DELETED_AT ? new Date(it.DELETED_AT).toLocaleString() : "-";
              const deleter = it.DELETED_BY || "Unknown";

              return (
                <div key={it.ID} style={styles.card}>
                  <div style={styles.cardRow}>
                    <div style={styles.avatar}>
                      {type === "folder" ? <FaFolder /> : <FaFileAlt />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={styles.name}>{name}</div>
                      <div style={styles.meta}>
                        <span>ID: {it.ID}</span>
                        <span> • Deleted: {deletedAt}</span>
                        <span> • By: {deleter}</span>
                      </div>
                    </div>

                    <div style={styles.actions}>
                      <Tooltip text="Restore item">
                        <Button
                          text={it._restoring ? "Restoring..." : ""}
                          icon={<FaTrashRestore />}
                          onClick={() => openRestoreConfirm(it.ID, name)}
                          style={{
                            ...styles.restoreBtn,
                            opacity: it._restoring || it._deleting ? 0.7 : 1,
                            cursor: it._restoring || it._deleting ? "not-allowed" : "pointer",
                          }}
                          disabled={it._restoring || it._deleting}
                        />
                      </Tooltip>
                      <Tooltip text="Permanently delete">
                        <Button
                          text={it._deleting ? "Deleting..." : ""}
                          icon={<FaTrash />}
                          onClick={() => openDeleteConfirm(it.ID, name)}
                          style={{
                            ...styles.deleteBtn,
                            opacity: it._restoring || it._deleting ? 0.7 : 1,
                            cursor: it._restoring || it._deleting ? "not-allowed" : "pointer",
                          }}
                          disabled={it._restoring || it._deleting}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* pagination controls */}
        <div style={styles.pagerRow}>
          <div style={styles.pagerLeft}>
            <small style={{ color: "#6b7280" }}>
              Showing {visible.length} of {filtered.length} deleted items
            </small>
          </div>

          <div style={styles.pagerRight}>
            <Button
              text="Prev"
              icon={<FaChevronLeft />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ ...styles.pageBtn, opacity: page <= 1 ? 0.5 : 1 }}
              disabled={page <= 1}
            />
            <div style={styles.pageInfo}>{page} / {pages}</div>
            <Button
              text="Next"
              icon={<FaChevronRight />}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              style={{ ...styles.pageBtn, opacity: page >= pages ? 0.5 : 1 }}
              disabled={page >= pages}
            />
          </div>
        </div>
      </main>

      {/* Confirm Dialog (Restore/Delete) */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.action === "delete" ? "Permanently Delete Item" : "Restore item"}
        message={confirm.message}
        confirmText={confirm.action === "delete" ? "Delete Permanently" : "Restore"}
        confirmButtonStyle={confirm.action === "delete" ? dialogStyles.deleteConfirmBtn : dialogStyles.confirmBtn}
        onCancel={() => setConfirm({ open: false, id: null, message: "", action: null })}
        onConfirm={confirm.action === "delete" ? performPermanentDelete : performRestore}
      />

      {/* ToastBar */}
      {toast.show && <ToastBar type={toast.type === "error" ? "error" : "success"} message={toast.message} />}

      {/* spinner animation style */}
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ---------------- ConfirmDialog (inline) ---------------- */
const ConfirmDialog = ({ open, title = "Confirm", message = "", onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", confirmButtonStyle }) => {
  if (!open) return null;
  return (
    <div style={dialogStyles.overlay} onClick={onCancel}>
      <div style={dialogStyles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 style={dialogStyles.title}>{title}</h3>
        <p style={dialogStyles.message}>{message}</p>

        <div style={dialogStyles.actions}>
          <Button text={cancelText} onClick={onCancel} style={dialogStyles.cancelBtn} />
          <Button text={confirmText} onClick={onConfirm} style={confirmButtonStyle || dialogStyles.confirmBtn} />
        </div>
      </div>
    </div>
  );
};

/* ---------------- Styles ---------------- */
const styles = {
  wrapper: { padding: 15, fontFamily: "Inter, Roboto, system-ui, Arial", minHeight: "100vh", color: "#0f172a" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerLeft: {},
  h1: { margin: 0, fontSize: 22, display: "flex", alignItems: "center", gap: 8 },
  sub: { margin: 0, color: "#6b7280", fontSize: 13 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },

  searchRow: { display: "flex", gap: 10, alignItems: "center" },
  searchBox: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "#fff", border: "1px solid #e6edf3", boxShadow: "0 1px 2px rgba(15,23,42,0.03)" },
  iconMuted: { color: "#94a3b8" },
  searchInput: { border: "none", outline: "none", width: 260, fontSize: 13 },
  clearBtn: { border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" },
  select: { padding: "8px 10px", borderRadius: 8, border: "1px solid #e6edf3", background: "#fff", fontSize: 13 },
  ghostBtn: { padding: "8px 12px", borderRadius: 8, border: "1px solid #e6edf3", background: "transparent", cursor: "pointer", fontSize: 13,color:'black' },

  error: { padding: 10, background: "#fff1f2", color: "#9f1239", borderRadius: 8, border: "1px solid #fecaca", marginBottom: 12 },

  gridContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 12, marginTop: 8 },
  card: { background: "#fff", borderRadius: 10, padding: 12, boxShadow: "0 6px 18px rgba(2,6,23,0.04)", border: "1px solid #eef2f7" },
  cardRow: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontSize: 18 },
  name: { fontWeight: 600, fontSize: 14, color: "#0f172a" },
  meta: { fontSize: 12, color: "#6b7280", marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" },
  actions: { display: "flex", gap: 8 },
  restoreBtn: { padding: "8px 10px", borderRadius: 8, background: "#ecfeff", border: "1px solid #99f6e4", color: "#065f46", cursor: "pointer", fontSize: 13, display: "flex", gap: 8, alignItems: "center" },
  deleteBtn: { padding: "8px 10px", borderRadius: 8, background: "#fff1f2", border: "1px solid #fecaca", color: "#991b1b", cursor: "pointer", fontSize: 13, display: "flex", gap: 8, alignItems: "center" },

  loadingRow: { padding: 24, textAlign: "center", color: "#6b7280" },
  empty: { padding: 40, textAlign: "center", color: "#6b7280", background: "#fff", borderRadius: 10, border: "1px dashed #e6edf3" },

  pagerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  pagerLeft: {},
  pagerRight: { display: "flex", alignItems: "center", gap: 10 },
  pageBtn: { padding: "8px 12px", borderRadius: 8, border: "1px solid #e6edf3", background: "#fff", cursor: "pointer" },
  pageInfo: { minWidth: 56, textAlign: "center", color: "#475569" },
};

const dialogStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500,
  },
  dialog: {
    width: 420,
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 12px 40px rgba(2,6,23,0.2)",
  },
  title: { margin: 0, fontSize: 18, fontWeight: 600, color: "#0f172a", marginBottom: 8 },
  message: { fontSize: 14, color: "#475569", marginBottom: 16 },
  actions: { display: "flex", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { background: "#f3f4f6", color: "#374151", padding: "8px 12px", borderRadius: 8, border: "none" },
  confirmBtn: { background: "#10b981", color: "#fff", padding: "8px 12px", borderRadius: 8, border: "none" },
  deleteConfirmBtn: { background: "#dc2626", color: "#fff", padding: "8px 12px", borderRadius: 8, border: "none" },
};

