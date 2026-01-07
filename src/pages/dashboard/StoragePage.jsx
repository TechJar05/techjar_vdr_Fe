import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronRight, FaFolder, FaFile, FaTrash2 } from "react-icons/fa";
import Button from "../../components/Style/Button";
import apiRequest from "../../utils/apiClient";
import formatBytes from "../../utils/formatBytes";

const StoragePage = () => {
  const [storage, setStorage] = useState({ totalQuotaMb: 5000, usedMb: 0, percentUsed: 0 });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({}); // Track which folders are expanded
  const navigate = useNavigate();

  const fetchStorage = async () => {
    try {
      const data = await apiRequest("/api/storage");
      setStorage({
        totalQuotaMb: data.totalQuotaMb || 5000,
        usedMb: data.usedMb || 0,
        percentUsed: data.percentUsed || 0,
      });
    } catch (e) {
      console.error("Failed to fetch storage", e.message || e);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/api/storage/files");
      const list = Array.isArray(data) ? data : data?.data || [];
      setItems(list || []);
    } catch (e) {
      console.error("Failed to fetch storage items", e.message || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
    fetchItems();
  }, []);

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleOpen = async (item) => {
    // If it's a folder, navigate to a read-only view of that folder in storage
    if (item.ITEM_TYPE === "folder" || (!item.ITEM_TYPE && !item.FILE_SIZE_MB)) {
      navigate(`/storage-folder/${item.ITEM_ID}`);
      return;
    }

    // Try to open as a file via /api/files/view/:id (returns signed URL).
    try {
      const res = await apiRequest(`/api/files/view/${item.ITEM_ID}`, { auth: false });
      if (res?.url) {
        window.open(res.url, "_blank");
        return;
      }
    } catch (e) {
      // not a file or not found
    }

    // Navigate to folder page
    navigate(`/project-folder/${item.ITEM_ID}`);
  };

  const handleRemove = async (item) => {
    try {
      const ref = item.STORAGE_REF || item.ITEM_ID || item.ID;
      setRemoving(ref);
      await apiRequest(`/api/storage/${ref}`, { method: "DELETE" });
      await fetchStorage();
      await fetchItems();
    } catch (e) {
      console.error("Failed to remove from storage", e.message || e);
    } finally {
      setRemoving(null);
    }
  };

  // Organize items: top-level folders and files, with children grouped
  // Support both old (PARENT_ITEM_ID) and new (PARENT_REF) linking
  const topLevelItems = items.filter((item) => {
    const parentKey = item.PARENT_REF || item.PARENT_ITEM_ID || "";
    return !parentKey || String(parentKey).trim() === "";
  });
  const itemsByParent = {};
  items.forEach((item) => {
    const parentKey = item.PARENT_REF || item.PARENT_ITEM_ID || "";
    if (parentKey && String(parentKey).trim() !== "") {
      if (!itemsByParent[parentKey]) itemsByParent[parentKey] = [];
      itemsByParent[parentKey].push(item);
    }
  });

  const renderStorageItem = (item, level = 0) => {
    const isFolder = item.ITEM_TYPE === "folder" || (!item.ITEM_TYPE && !item.FILE_SIZE_MB);
    const uiId = item.STORAGE_REF || item.ITEM_ID || item.ID;
    const hasChildren = itemsByParent[uiId] && itemsByParent[uiId].length > 0;
    const isExpanded = expandedFolders[uiId];
    const paddingLeft = level * 20 + 10;

    return (
      <React.Fragment key={uiId}>
        <tr style={{ borderTop: "1px solid #e5e7eb", background: level > 0 ? "#fafbfc" : "white", hover: { background: "#f9fafb" } }}>
          <td style={{ padding: "12px 10px", paddingLeft }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isFolder && hasChildren ? (
                <button
                  onClick={() => toggleFolder(uiId)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    color: "#6b7280",
                  }}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
                </button>
              ) : isFolder && !hasChildren ? (
                <div style={{ width: 14 }}></div>
              ) : null}

              {isFolder ? (
                <FaFolder size={14} color="#f59e0b" />
              ) : (
                <FaFile size={14} color="#3b82f6" />
              )}

              <span style={{ fontWeight: isFolder ? 600 : 500, color: isFolder ? "#1f2937" : "#374151" }}>
                {item.ITEM_NAME}
              </span>
            </div>
          </td>

          <td style={{ padding: "12px 10px", fontSize: 13, color: "#6b7280" }}>
            <span style={{ background: isFolder ? "#fef3c7" : "#dbeafe", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
              {isFolder ? "Folder" : "File"}
            </span>
          </td>

          <td style={{ padding: "12px 10px", fontSize: 13, color: "#374151" }}>
            {(item.FILE_SIZE_MB || 0).toFixed(2)} MB
          </td>

          <td style={{ padding: "12px 10px", fontSize: 13, color: "#6b7280" }}>
            {item.ADDED_AT ? new Date(item.ADDED_AT).toLocaleString() : "—"}
          </td>

          <td style={{ padding: "12px 10px", textAlign: "right", display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              onClick={isFolder ? () => toggleFolder(uiId) : () => handleOpen(item) }
              style={{
                padding: "6px 12px",
                fontSize: 12,
                border: "none",
                borderRadius: 4,
                background: "#3b82f6",
                color: "white",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Open
            </button>
            <button
              onClick={() => handleRemove(item)}
              disabled={removing === (item.STORAGE_REF || item.ITEM_ID || item.ID)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                border: "none",
                borderRadius: 4,
                background: removing === (item.STORAGE_REF || item.ITEM_ID || item.ID) ? "#d1d5db" : "#ef4444",
                color: "white",
                cursor: removing === (item.STORAGE_REF || item.ITEM_ID || item.ID) ? "not-allowed" : "pointer",
                fontWeight: 500,
              }}
            >
              {removing === (item.STORAGE_REF || item.ITEM_ID || item.ID) ? "Removing..." : "Remove"}
            </button>
          </td>
        </tr>

        {/* Render children if folder is expanded */}
        {isFolder && isExpanded && itemsByParent[uiId] && (
          itemsByParent[uiId].map((child) => renderStorageItem(child, level + 1))
        )}
      </React.Fragment>
    );
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", background: "#f3f4f6", padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1f2937", margin: 0, marginBottom: 8 }}>Storage</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Manage your downloaded files and folders</p>
      </div>

      {/* Quota Card */}
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Storage Quota</span>
            <span style={{ fontSize: 14, color: "#6b7280" }}>
              {storage.usedMb.toFixed(0)} MB / {storage.totalQuotaMb} MB
            </span>
          </div>
          <div style={{ height: 12, width: "100%", background: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${storage.percentUsed}%`,
                background: storage.percentUsed > 80 ? "#ef4444" : storage.percentUsed > 50 ? "#f59e0b" : "#10b981",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            {storage.percentUsed.toFixed(1)}% used ({(storage.totalQuotaMb - storage.usedMb).toFixed(0)} MB available)
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading your storage...</div>
        ) : items.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" }}>Name</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" }}>Type</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" }}>Size</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" }}>Added</th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600, color: "#374151" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topLevelItems.map((item) => renderStorageItem(item, 0))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 40, textAlign: "center" }}>
            <FaFolder size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", margin: 0, marginBottom: 8 }}>No items in storage yet</p>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
              Download files or folders to add them here. Once downloaded, they'll be accessible forever.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoragePage;
