import React, { useEffect, useState } from "react";
import { FaChartBar, FaFile, FaShare, FaTimes } from "react-icons/fa";
import apiRequest from "../../utils/apiClient";

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("files"); // "files" or "file-share"
  const [filesData, setFilesData] = useState([]);
  const [fileShareData, setFileShareData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // For sidebar
  const [itemActivity, setItemActivity] = useState(null);

  const fetchFilesReport = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/reports/files");
      setFilesData(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error("Failed to fetch files report", e.message || e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileShareReport = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/reports/file-share");
      setFileShareData(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error("Failed to fetch file share report", e.message || e);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemActivity = async (fileId) => {
    try {
      const data = await apiRequest(`/reports/file/${fileId}/activity`);
      setItemActivity(data);
    } catch (e) {
      console.error("Failed to fetch activity", e.message || e);
    }
  };

  useEffect(() => {
    if (activeTab === "files") {
      fetchFilesReport();
    } else {
      fetchFileShareReport();
    }
  }, [activeTab]);

  const handleSelectFile = (item) => {
    setSelectedItem(item);
    fetchItemActivity(item.ID || item.id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f3f4f6" }}>
      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <div style={{ padding: "24px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <FaChartBar size={28} color="#4f46e5" />
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Reports</h1>
          </div>
          <p style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", margin: "0 0 12px 0" }}>
            Total Numbers Of Reports: {activeTab === "files" ? filesData.length : fileShareData.length}
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            View detailed reports on file activity and sharing
          </p>
        </div>

        {/* Tabs */}
        <div style={{ padding: "16px 24px", background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "24px" }}>
          <button
            onClick={() => setActiveTab("files")}
            style={{
              padding: "12px 0",
              border: "none",
              background: "none",
              fontSize: "16px",
              fontWeight: activeTab === "files" ? "600" : "500",
              color: activeTab === "files" ? "#4f46e5" : "#6b7280",
              borderBottom: activeTab === "files" ? "2px solid #4f46e5" : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaFile size={16} /> Files
          </button>
          <button
            onClick={() => setActiveTab("file-share")}
            style={{
              padding: "12px 0",
              border: "none",
              background: "none",
              fontSize: "16px",
              fontWeight: activeTab === "file-share" ? "600" : "500",
              color: activeTab === "file-share" ? "#4f46e5" : "#6b7280",
              borderBottom: activeTab === "file-share" ? "2px solid #4f46e5" : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaShare size={16} /> File Share
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
              Loading reports...
            </div>
          ) : activeTab === "files" ? (
            <FilesSection files={filesData} onSelectFile={handleSelectFile} formatDate={formatDate} formatSize={formatSize} />
          ) : (
            <FileShareSection files={fileShareData} onSelectFile={handleSelectFile} formatDate={formatDate} formatSize={formatSize} />
          )}
        </div>
      </div>

      {/* Sidebar */}
      {selectedItem && (
        <DetailSidebar
          item={selectedItem}
          activity={itemActivity}
          activeTab={activeTab}
          onClose={() => setSelectedItem(null)}
          formatDate={formatDate}
          formatSize={formatSize}
        />
      )}
    </div>
  );
};

/**
 * Files Section Component
 */
const FilesSection = ({ files, onSelectFile, formatDate, formatSize }) => {
  return (
    <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
      {files.length ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Name
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Type
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Size
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Created By
              </th>
              <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Views
              </th>
              <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Downloads
              </th>
              <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Shares
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, idx) => (
              <tr
                key={file.ID || idx}
                onClick={() => onSelectFile(file)}
                style={{
                  borderTop: "1px solid #e5e7eb",
                  background: idx % 2 === 0 ? "#fff" : "#f9fafb",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#f9fafb")}
              >
                <td style={{ padding: "12px", fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>
                  {file.FILE_NAME}
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                  {file.FILE_TYPE || "Unknown"}
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                  {formatSize(file.FILE_SIZE)}
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                  {file.CREATED_BY || "—"}
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#374151", fontWeight: "500" }}>
                  {file.VIEWS_COUNT || 0}
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#374151", fontWeight: "500" }}>
                  {file.DOWNLOADS_COUNT || 0}
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#374151", fontWeight: "500" }}>
                  {file.SHARES_COUNT || (file.SHARES && file.SHARES.length) || 0}
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                  {formatDate(file.CREATED_AT)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <FaFile size={48} color="#d1d5db" style={{ marginBottom: "16px" }} />
          <p style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 8px 0" }}>
            No files yet
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            Files will appear here once they are created.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * File Share Section Component
 * Shows files that have been shared (have approved access requests)
 */
const FileShareSection = ({ files, onSelectFile, formatDate, formatSize }) => {
  return (
    <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
      {files.length ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Name
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Type
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Size
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Created By
              </th>
              <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Approved Shares
              </th>
              <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Views
              </th>
              <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Downloads
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Location
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Last Shared
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, idx) => {
              const lastShare = file.LAST_SHARED_AT || (file.SHARES && file.SHARES.length > 0 ? file.SHARES[0].APPROVED_AT : null);
              return (
                <tr
                  key={file.ID || idx}
                  onClick={() => onSelectFile(file)}
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    background: idx % 2 === 0 ? "#fff" : "#f9fafb",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#f9fafb")}
                >
                  <td style={{ padding: "12px", fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>
                    {file.FILE_NAME}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                    {file.FILE_TYPE || "Unknown"}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                    {formatSize(file.FILE_SIZE)}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                    {file.CREATED_BY || "—"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#374151", fontWeight: "500" }}>
                    {file.SHARE_COUNT || 0}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#374151", fontWeight: "500" }}>
                    {file.VIEWS_COUNT || 0}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#374151", fontWeight: "500" }}>
                    {file.DOWNLOADS_COUNT || 0}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                    {file.FOLDER_NAME || "Root"}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                    {formatDate(lastShare)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <FaShare size={48} color="#d1d5db" style={{ marginBottom: "16px" }} />
          <p style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 8px 0" }}>
            No shared files yet
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            Files with approved access requests will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Detail Sidebar Component
 */
const DetailSidebar = ({ item, activity, activeTab, onClose, formatDate, formatSize }) => {
  const [detailsTab, setDetailsTab] = useState("details");

  return (
    <div
      style={{
        width: "420px",
        background: "#fff",
        borderLeft: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-4px 0 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Sidebar Header */}
      <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
          {item.FILE_NAME}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#6b7280",
          }}
        >
          <FaTimes />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 20px" }}>
        <button
          onClick={() => setDetailsTab("details")}
          style={{
            flex: 1,
            padding: "12px 0",
            border: "none",
            background: "none",
            fontSize: "14px",
            fontWeight: detailsTab === "details" ? "600" : "500",
            color: detailsTab === "details" ? "#4f46e5" : "#6b7280",
            borderBottom: detailsTab === "details" ? "2px solid #4f46e5" : "none",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          Details
        </button>
        <button
          onClick={() => setDetailsTab("activity")}
          style={{
            flex: 1,
            padding: "12px 0",
            border: "none",
            background: "none",
            fontSize: "14px",
            fontWeight: detailsTab === "activity" ? "600" : "500",
            color: detailsTab === "activity" ? "#4f46e5" : "#6b7280",
            borderBottom: detailsTab === "activity" ? "2px solid #4f46e5" : "none",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          Activity
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {detailsTab === "details" ? (
          <FileDetails item={item} formatDate={formatDate} formatSize={formatSize} />
        ) : (
          <FileActivity activity={activity} formatDate={formatDate} />
        )}
      </div>
    </div>
  );
};

/**
 * File Details Component
 */
const FileDetails = ({ item, formatDate, formatSize }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <DetailRow label="Type" value={item.FILE_TYPE || "Unknown"} />
      <DetailRow label="Size" value={formatSize(item.FILE_SIZE)} />
      <DetailRow label="Location" value={item.FOLDER_NAME || "Root"} />
      <DetailRow label="Created By" value={item.CREATED_BY || "—"} />
      <DetailRow label="Created At" value={formatDate(item.CREATED_AT)} />
      <DetailRow label="Modified At" value={formatDate(item.MODIFIED_AT)} />
      <DetailRow label="Views" value={item.VIEWS_COUNT || 0} />
      <DetailRow label="Downloads" value={item.DOWNLOADS_COUNT || 0} />
      <DetailRow label="Shares" value={item.SHARES_COUNT || (item.SHARES && item.SHARES.length) || 0} />
    </div>
  );
};

/**
 * File Activity Component
 * Displays share history: approved access requests showing who got access, what type, when approved, and who approved
 */
const FileActivity = ({ activity, formatDate }) => {
  if (!activity || !activity.shareActivity || activity.shareActivity.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>
        <p style={{ fontSize: "14px", fontWeight: "500" }}>No access requests approved for this file.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb", marginBottom: "8px" }}>
        <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
          Total Approved Shares: {activity.shareActivity.length}
        </p>
      </div>
      {activity.shareActivity.map((share, idx) => {
        const accessTypes = (share.ACCESS_TYPES || "").split(",").map((t) => t.trim()).filter(Boolean);
        return (
          <div
            key={idx}
            style={{
              padding: "12px",
              background: "#f9fafb",
              borderRadius: "6px",
              borderLeft: "3px solid #10b981",
            }}
          >
            <p style={{ margin: "0 0 6px 0", fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>
              {share.REQUESTED_BY || "Unknown User"}
            </p>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
              <strong>Access Types:</strong> {accessTypes.length > 0 ? accessTypes.join(", ") : "None"}
            </p>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
              <strong>Approved By:</strong> {share.APPROVED_BY || "System"}
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
              <strong>Approved At:</strong> {formatDate(share.APPROVED_AT)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Detail Row Component (helper)
 */
const DetailRow = ({ label, value }) => (
  <div>
    <p style={{ margin: "0 0 4px 0", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
      {label}
    </p>
    <p style={{ margin: 0, fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>
      {value}
    </p>
  </div>
);

export default ReportsPage;
