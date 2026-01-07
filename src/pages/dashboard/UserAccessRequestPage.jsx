import React, { useEffect, useState } from "react";
import { FaClipboardList, FaTimes } from "react-icons/fa";
import Button from "../../components/Style/Button";
import Toastbar from "../../components/Style/Toastbar";
import apiRequest from "../../utils/apiClient";

const UserAccessRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected, revoke
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/access/requests");
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch access requests", error);
      showToast(error.message || "Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await apiRequest(`/access/requests/${id}`, {
        method: "PUT",
        body: { status: "approved" },
      });
      showToast("Request approved", "success");
      fetchRequests();
    } catch (error) {
      showToast(error.message || "Failed to approve", "error");
    }
  };

  const handleReject = async (id) => {
    try {
      await apiRequest(`/access/requests/${id}`, {
        method: "PUT",
        body: { status: "rejected" },
      });
      showToast("Request rejected", "success");
      fetchRequests();
    } catch (error) {
      showToast(error.message || "Failed to reject", "error");
    }
  };

  const handleRevokeAll = async (requestId) => {
    const confirmed = window.confirm("Revoke all access for this user+item? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await apiRequest(`/access/requests/${requestId}`, {
        method: "DELETE",
      });
      showToast("Access revoked successfully", "success");
      fetchRequests();
    } catch (error) {
      showToast(error.message || "Failed to revoke access", "error");
    }
  };

  const handleRevokeSpecific = async (requestId, accessTypeToRemove) => {
    const confirmed = window.confirm(`Revoke ${accessTypeToRemove} access?`);
    if (!confirmed) return;

    try {
      await apiRequest(`/access/requests/${requestId}`, {
        method: "PUT",
        body: { action: "revoke", accessType: accessTypeToRemove },
      });
      showToast(`${accessTypeToRemove} access revoked`, "success");
      fetchRequests();
    } catch (error) {
      showToast(error.message || "Failed to revoke access", "error");
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    if (filter === "revoke") return req.STATUS === "approved";
    return req.STATUS === filter;
  });

  // For revoke tab, deduplicate by USER_EMAIL + ITEM_ID (keep latest)
  const revokeRequests = () => {
    if (filter !== "revoke") return [];
    const grouped = {};
    filteredRequests.forEach((req) => {
      const key = `${req.USER_EMAIL}|${req.ITEM_ID}`;
      if (!grouped[key] || new Date(req.REQUESTED_AT) > new Date(grouped[key].REQUESTED_AT)) {
        grouped[key] = req;
      }
    });
    return Object.values(grouped);
  };

  const getStatusStyle = (status) => {
    if (status === "approved") return { background: "#d1fae5", color: "#065f46" };
    if (status === "rejected") return { background: "#fee2e2", color: "#991b1b" };
    return { background: "#fef3c7", color: "#92400e" };
  };

  const getStatusBadge = (status) => {
    const styleMap = {
      approved: { bg: "#10b981", text: "Approved" },
      rejected: { bg: "#ef4444", text: "Rejected" },
      pending: { bg: "#f59e0b", text: "Pending" },
    };
    const style = styleMap[status] || styleMap.pending;
    return (
      <span
        style={{
          background: style.bg,
          color: "#fff",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        {style.text}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      {/* Toast */}
      {toast.show && <Toastbar type={toast.type} message={toast.message} />}

      {/* Page Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <FaClipboardList style={{ color: "#4f46e5", marginRight: "10px" }} />
          User Access Request
        </h1>
        <p style={styles.subtitle}>
          Manage and approve access requests from users for files and folders.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        {["all", "pending", "approved", "rejected", "revoke"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              ...styles.filterTab,
              borderBottom: filter === status ? "3px solid #4f46e5" : "3px solid transparent",
              color: filter === status ? "#4f46e5" : "#64748b",
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={styles.loadingState}>Loading requests...</div>
        ) : filter === "revoke" && revokeRequests().length === 0 ? (
          <div style={styles.emptyState}>No approved access to revoke</div>
        ) : filter !== "revoke" && filteredRequests.length === 0 ? (
          <div style={styles.emptyState}>No {filter !== "all" ? filter : ""} requests</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={{ ...styles.headerCell, width: "5%" }}>#</th>
                <th style={{ ...styles.headerCell, width: "20%" }}>User Name</th>
                <th style={{ ...styles.headerCell, width: "15%" }}>Date-Time</th>
                <th style={{ ...styles.headerCell, width: "10%" }}>Type</th>
                <th style={{ ...styles.headerCell, width: "25%" }}>Name</th>
                <th style={{ ...styles.headerCell, width: "15%" }}>Access Type</th>
                <th style={{ ...styles.headerCell, width: "10%" }}>Status</th>
                <th style={{ ...styles.headerCell, width: "20%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(filter === "revoke" ? revokeRequests() : filteredRequests).map((request, idx) => (
                <tr key={request.ID || idx} style={styles.bodyRow}>
                  <td style={styles.bodyCell}>{idx + 1}</td>
                  <td style={styles.bodyCell}>{request.USER_EMAIL || "—"}</td>
                  <td style={styles.bodyCell}>
                    {request.REQUESTED_AT
                      ? new Date(request.REQUESTED_AT).toLocaleString()
                      : "—"}
                  </td>
                  <td style={styles.bodyCell}>
                    <span
                      style={{
                        background:
                          request.ITEM_TYPE === "file" ? "#dbeafe" : "#d1fae5",
                        color:
                          request.ITEM_TYPE === "file" ? "#1e40af" : "#065f46",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {request.ITEM_TYPE === "file" ? "File" : "Folder"}
                    </span>
                  </td>
                  <td style={{ ...styles.bodyCell, fontWeight: 600 }}>
                    {request.ITEM_NAME || "—"}
                  </td>
                  <td style={styles.bodyCell}>
                    {filter === "revoke" ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(request.ACCESS_TYPES || "").split(",").map((t, i) => (
                          <span
                            key={i}
                            style={{
                              background: "#f0f0f0",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      (request.ACCESS_TYPES || "").split(",").map((t, i) => (
                        <span key={i} style={{ marginRight: "6px" }}>
                          {t.trim()}
                        </span>
                      ))
                    )}
                  </td>
                  <td style={styles.bodyCell}>{getStatusBadge(request.STATUS)}</td>
                  <td style={styles.actionCell}>
                    {request.STATUS === "pending" && (
                      <>
                        <Button
                          text="Accept"
                          onClick={() => handleApprove(request.ID)}
                          style={{
                            ...styles.acceptBtn,
                          }}
                        />
                        <Button
                          text="Reject"
                          onClick={() => handleReject(request.ID)}
                          style={{
                            ...styles.rejectBtn,
                          }}
                        />
                      </>
                    )}
                    {filter === "revoke" && request.STATUS === "approved" && (
                      <>
                        <Button
                          text="Revoke All"
                          onClick={() => handleRevokeAll(request.ID)}
                          style={{
                            ...styles.revokeAllBtn,
                          }}
                        />
                        {(request.ACCESS_TYPES || "")
                          .split(",")
                          .map((t) => t.trim())
                          .map((accessType) => (
                            <Button
                              key={accessType}
                              text={`Revoke ${accessType}`}
                              onClick={() => handleRevokeSpecific(request.ID, accessType)}
                              style={{
                                ...styles.revokeSpecificBtn,
                              }}
                            />
                          ))}
                      </>
                    )}
                    {request.STATUS !== "pending" && filter !== "revoke" && (
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  header: {
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    marginBottom: "6px",
  },

  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  filterTabs: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "12px",
  },

  filterTab: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    color: "#64748b",
    transition: "all 0.2s ease",
    padding: "0 4px",
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

  acceptBtn: {
    background: "#10b981",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  rejectBtn: {
    background: "#ef4444",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  revokeAllBtn: {
    background: "#dc2626",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600,
  },

  revokeSpecificBtn: {
    background: "#fca5a5",
    color: "#7f1d1d",
    padding: "4px 8px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 600,
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
};

export default UserAccessRequestPage;

