import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaEye, FaTimes } from "react-icons/fa";
import Button from "../../components/Style/Button";
import Toastbar from "../../components/Style/Toastbar";
import { API_BASE_URL } from "../../config/apiConfig";

/**
 * UserGroupPage
 * Admin-only page to create, view, and delete user groups.
 * Features: Clean table UI, create group modal, email notifications, proper toast positioning
 */
export default function UserGroupPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create group modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    groupName: "",
    userEmails: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, group: null });
  const [creatorName, setCreatorName] = useState("");

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Check admin role on mount
  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "admin");
    // Always load groups, but only admins can create/delete
    fetchGroups();
    // fetch current user name for creator display
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const resp = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        setCreatorName(data.name || data.fullName || "");
      } catch (e) {
        console.error("Failed to fetch creator name", e.message || e);
      }
    })();
  }, [navigate]);

  // Show toast message
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // Fetch groups from backend
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to fetch groups (${response.status})`);
      }

      const data = await response.json();
      setGroups(data || []);
    } catch (err) {
      console.error("[fetchGroups] error:", err.message);
      setError(err.message || "Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Validate email format
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Handle create group form submission
  const handleCreateGroup = async () => {
    setFormErrors({});
    const { groupName, userEmails } = formData;
    const adminName = creatorName || null;

    // Validate
    const errors = {};
    if (!groupName.trim()) {
      errors.groupName = "Group name is required";
    }
    if (!userEmails.trim()) {
      errors.userEmails = "At least one email is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast("Please fix the form errors", "error");
      return;
    }

    // Parse emails
    const emails = userEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const invalidEmails = emails.filter((e) => !isValidEmail(e));
    if (invalidEmails.length > 0) {
      setFormErrors({
        userEmails: `Invalid email(s): ${invalidEmails.slice(0, 2).join(", ")}`,
      });
      showToast("Invalid email format", "error");
      return;
    }

    setLoading(true);
    try {
      if (!isAdmin) {
        showToast("Access denied: Admins only", "error");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName: groupName.trim(),
          users: emails,
          adminName: adminName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to create group");
      }

      const result = await response.json();
      showToast("Group created successfully! Users will be notified.", "success");
      
      // Reset form and refresh groups
      setFormData({ groupName: "", userEmails: "" });
      setShowCreateModal(false);
      await fetchGroups();
    } catch (err) {
      console.error("[handleCreateGroup] error:", err.message);
      showToast(err.message || "Failed to create group", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete group
  const handleDeleteGroup = async (id, name) => {
    if (!isAdmin) {
      showToast("Access denied: Admins only", "error");
      return;
    }

    if (!window.confirm(`Delete group "${name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete group");
      }

      showToast("Group deleted successfully", "success");
      await fetchGroups();
    } catch (err) {
      console.error("[handleDeleteGroup] error:", err.message);
      showToast(err.message || "Failed to delete group", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle view group members
  const handleViewGroup = (group) => {
    setViewModal({ open: true, group });
  };

  const closeViewModal = () => setViewModal({ open: false, group: null });

  return (
    <div style={styles.container}>
      {/* Toast Notification - positioned above navbar */}
      {toast.show && (
        <Toastbar type={toast.type} message={toast.message} />
      )}

      {/* Error Banner */}
      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button
            style={styles.closeErrorBtn}
            onClick={() => setError(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>User Groups</h1>
          <p style={styles.subtitle}>
            Create and manage user groups. Members will receive email notifications.
          </p>
        </div>
        <Button
          text="Add User Group"
          icon={<FaPlus />}
          onClick={() => setShowCreateModal(true)}
          style={styles.createBtn}
          disabled={!isAdmin}
        />
      </div>

      {/* Groups Table */}
      <div style={styles.tableWrapper}>
        {loading && !groups.length ? (
          <div style={styles.loadingState}>Loading groups...</div>
        ) : error ? (
          <div style={styles.emptyState}>Unable to load groups. Please try again.</div>
        ) : groups.length === 0 ? (
          <div style={styles.emptyState}>
            No groups yet. Click "Add User Group" to create one.
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={{ ...styles.headerCell, width: "5%" }}>#</th>
                <th style={{ ...styles.headerCell, width: "35%" }}>User Group Name</th>
                <th style={{ ...styles.headerCell, width: "20%" }}>Users</th>
                <th style={{ ...styles.headerCell, width: "40%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, idx) => {
                const memberCount = Array.isArray(group.MEMBERS)
                  ? group.MEMBERS.length
                  : 0;
                return (
                  <tr key={group.ID || idx} style={styles.bodyRow}>
                    <td style={styles.bodyCell}>{idx + 1}</td>
                    <td style={{ ...styles.bodyCell, fontWeight: 600 }}>
                      {group.GROUP_NAME || "—"}
                    </td>
                    <td style={styles.bodyCell}>
                      {memberCount}
                    </td>
                    <td style={styles.actionCell}>
                      <Button
                        text="View"
                        icon={<FaEye />}
                        onClick={() => handleViewGroup(group)}
                        style={styles.viewBtn}
                      />
                      <Button
                        text="Remove"
                        icon={<FaTrash />}
                        onClick={() =>
                          handleDeleteGroup(group.ID, group.GROUP_NAME)
                        }
                        style={styles.removeBtn}
                        disabled={!isAdmin}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div
            style={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create User Group</h2>
              <button
                style={styles.closeBtn}
                onClick={() => setShowCreateModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Group Name Input */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Group Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Engineering Team"
                  value={formData.groupName}
                  onChange={(e) =>
                    setFormData({ ...formData, groupName: e.target.value })
                  }
                  style={{
                    ...styles.input,
                    borderColor: formErrors.groupName ? "#ef4444" : "#d1d5db",
                  }}
                />
                {formErrors.groupName && (
                  <div style={styles.errorText}>{formErrors.groupName}</div>
                )}
              </div>

              {/* Member Emails Input */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Member Emails (comma separated) *</label>
                <textarea
                  placeholder="alice@example.com, bob@example.com, charlie@example.com"
                  value={formData.userEmails}
                  onChange={(e) =>
                    setFormData({ ...formData, userEmails: e.target.value })
                  }
                  style={{
                    ...styles.textarea,
                    borderColor: formErrors.userEmails ? "#ef4444" : "#d1d5db",
                  }}
                  rows={4}
                />
                {formErrors.userEmails && (
                  <div style={styles.errorText}>{formErrors.userEmails}</div>
                )}
              </div>

              {/* Creator (non-editable) */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Creator</label>
                <input
                  type="text"
                  value={creatorName || "(Unknown)"}
                  readOnly
                  style={{ ...styles.input, background: "#f3f4f6", cursor: "default" }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={styles.modalFooter}>
              <Button
                text="Cancel"
                onClick={() => setShowCreateModal(false)}
                style={styles.cancelBtn}
              />
              <Button
                text={loading ? "Creating..." : "Create Group"}
                onClick={handleCreateGroup}
                style={styles.submitBtn}
                disabled={!isAdmin || loading}
              />
            </div>
          </div>
        </div>
      )}
      {/* View Group Modal */}
      {viewModal.open && (
        <div style={styles.modalOverlay} onClick={closeViewModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Group Details</h2>
              <button style={styles.closeBtn} onClick={closeViewModal}><FaTimes /></button>
            </div>
            <div style={styles.modalBody}>
              <h3 style={{ marginTop: 0 }}>{viewModal.group.GROUP_NAME}</h3>
              <p><strong>Created By:</strong> {viewModal.group.CREATED_BY || "-"}</p>
              <p><strong>Created At:</strong> {viewModal.group.CREATED_AT ? new Date(viewModal.group.CREATED_AT).toLocaleString() : "-"}</p>
              <div>
                <strong>Members ({Array.isArray(viewModal.group.MEMBERS) ? viewModal.group.MEMBERS.length : 0}):</strong>
                <ul>
                  {(Array.isArray(viewModal.group.MEMBERS) ? viewModal.group.MEMBERS : []).map((m, i) => (
                    <li key={i}>{typeof m === 'string' ? m : (m.email || JSON.stringify(m))}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <Button text="Close" onClick={closeViewModal} style={styles.cancelBtn} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== STYLES ===================== */
const styles = {
  container: {
    padding: "24px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  errorBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #fecaca",
  },

  closeErrorBtn: {
    background: "transparent",
    border: "none",
    color: "#991b1b",
    cursor: "pointer",
    fontSize: "18px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    gap: "20px",
  },

  headerContent: {
    flex: 1,
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "6px",
  },

  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  createBtn: {
    background: "#10b981",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
  },

  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  headerRow: {
    background: "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
  },

  headerCell: {
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: 700,
    color: "#475569",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  bodyRow: {
    borderBottom: "1px solid #e2e8f0",
    transition: "background-color 0.2s ease",
  },

  bodyCell: {
    padding: "14px 16px",
    color: "#0f172a",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  actionCell: {
    padding: "14px 16px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  viewBtn: {
    background: "#10b981",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  removeBtn: {
    background: "#ef4444",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  loadingState: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },

  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },

  /* ===== MODAL STYLES ===== */
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },

  modalBox: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },

  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
  },

  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    fontSize: "20px",
    padding: 0,
  },

  modalBody: {
    padding: "24px",
  },

  formGroup: {
    marginBottom: "20px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    color: "#0f172a",
    fontSize: "13px",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
    resize: "vertical",
    boxSizing: "border-box",
  },

  errorText: {
    color: "#ef4444",
    fontSize: "12px",
    marginTop: "6px",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "20px 24px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
  },

  cancelBtn: {
    background: "#f1f5f9",
    color: "#0f172a",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    cursor: "pointer",
    fontWeight: 600,
  },

  submitBtn: {
    background: "#4f46e5",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },
};

