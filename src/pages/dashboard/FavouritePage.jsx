import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar, FaDownload, FaEye, FaFolderOpen } from "react-icons/fa";

import FolderCard from "../../components/Layout/FolderCard";
import Spinner from "../../components/Style/Spinner";
import Toastbar from "../../components/Style/Toastbar";
import apiRequest from "../../utils/apiClient";
import formatBytes from "../../utils/formatBytes";

const normalizeFavorite = (favorite) => ({
  id: favorite.ID || favorite.id,
  itemId: favorite.ITEM_ID || favorite.itemId,
  itemType: (favorite.ITEM_TYPE || favorite.itemType || "").toLowerCase(),
  createdAt: favorite.CREATED_AT || favorite.createdAt,
  name: favorite.NAME || favorite.name || "Untitled",
  fileCount: favorite.FILE_COUNT ?? favorite.fileCount ?? 0,
  sizeBytes: Number(favorite.SIZE_BYTES ?? favorite.sizeBytes ?? 0),
  fileType: favorite.FILE_TYPE || favorite.fileType || "—",
  parentFolderId: favorite.PARENT_FOLDER_ID || favorite.parentFolderId || null,
  fileUrl: favorite.FILE_URL || favorite.fileUrl || "",
});

const FavouritePage = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const toastMsg = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "info" }), 2500);
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/api/favorites");
      const items = Array.isArray(data) ? data : data?.data || [];
      setFavorites(items.map(normalizeFavorite));
    } catch (error) {
      console.error("Failed to load favourites", error);
      toastMsg(error.message || "Unable to load favourites", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const folderFavorites = useMemo(
    () => favorites.filter((fav) => fav.itemType === "folder"),
    [favorites]
  );
  const fileFavorites = useMemo(
    () => favorites.filter((fav) => fav.itemType === "file"),
    [favorites]
  );

  const handleToggleFavorite = async (itemId, itemType) => {
    try {
      setActionLoading(true);
      await apiRequest(`/api/favorites/${itemId}?type=${itemType}`, { method: "DELETE" });
      toastMsg("Removed from favourites", "success");
      fetchFavorites();
    } catch (error) {
      console.error("Failed to update favourite", error);
      toastMsg(error.message || "Unable to update favourite", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleView = async (fileId) => {
    try {
      const data = await apiRequest(`/api/files/view/${fileId}`, { auth: false });
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        toastMsg("Preview unavailable", "error");
      }
    } catch (error) {
      console.error("View failed", error);
      toastMsg(error.message || "Unable to open file", "error");
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await apiRequest(`/api/files/download/${fileId}`, {
        auth: true,
        skipJson: true,
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = response.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      link.download = match?.[1] || fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      toastMsg(error.message || "Unable to download file", "error");
    }
  };

  const styles = {
    container: {
      padding: "20px",
      background: "#f3f4f6",
      minHeight: "100vh",
    },
    section: {
      background: "#fff",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "24px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: "20px",
    },
    empty: {
      textAlign: "center",
      color: "#6b7280",
      padding: "10px 0",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    tableHeader: {
      textAlign: "left",
      fontSize: "13px",
      color: "#6b7280",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "10px",
    },
    tableHeaderFirst: {
      textAlign: "Center",
      fontSize: "13px",
      color: "#6b7280",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "10px",
    },
    tableHeaderLast: {
      textAlign: "right",
      paddingRight: "40px",
      fontSize: "13px",
      color: "#6b7280",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "10px",
    },
    tableCell: {
      padding: "12px 0",
      borderBottom: "1px solid #f1f5f9",
      fontSize: "14px",
      color: "#111827",
    },
    favoriteIcon: {
      color: "#fbbf24",
      cursor: "pointer",
      fontSize: "16px",
    },
    filesActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
    },
    actionLink: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      color: "#2563eb",
      cursor: "pointer",
      fontSize: "13px",
      paddingRight: "40px"
    },
  };

  return (
    <div style={styles.container}>
      {toast.message && <Toastbar message={toast.message} type={toast.type} />}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={{ margin: 0 }}>Favourite Projects</h3>
          {actionLoading && <span style={{ fontSize: "12px", color: "#6b7280" }}>Updating…</span>}
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
            <Spinner />
          </div>
        ) : folderFavorites.length ? (
          <div style={styles.grid}>
            {folderFavorites.map((folder) => (
              <FolderCard
                key={`${folder.itemId}-fav`}
                id={folder.itemId}
                title={folder.name}
                files={folder.fileCount}
                size={formatBytes(folder.sizeBytes)}
                isFavorite
                onToggleFavorite={() => handleToggleFavorite(folder.itemId, "folder")}
                metadata={{ id: folder.itemId, title: folder.name }}
              />
            ))}
          </div>
        ) : (
          <p style={styles.empty}>No favourite projects yet.</p>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={{ margin: 0 }}>Favourite Files</h3>
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
            <Spinner />
          </div>
        ) : fileFavorites.length ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeaderFirst}>Fav</th>
                <th style={styles.tableHeader}>File Name</th>
                <th style={styles.tableHeader}>Size</th>
                <th style={styles.tableHeader}>Type</th>
                <th style={styles.tableHeaderLast}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fileFavorites.map((file) => (
                <tr key={`${file.itemId}-fav`}>
                  <td style={{ ...styles.tableCell, textAlign: "center" }}>
                    <FaStar
                      style={styles.favoriteIcon}
                      onClick={() => handleToggleFavorite(file.itemId, "file")}
                    />
                  </td>
                  <td style={styles.tableCell}>{file.name}</td>
                  <td style={styles.tableCell}>{formatBytes(file.sizeBytes)}</td>
                  <td style={styles.tableCell}>{file.fileType}</td>
                  <td style={{ ...styles.tableCell, textAlign: "right" }}>
                    <div style={styles.filesActions}>
                      <span
                        style={styles.actionLink}
                        onClick={() => navigate(`/project-folder/${file.parentFolderId}`)}
                      >
                        <FaFolderOpen /> Open
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={styles.empty}>No favourite files yet.</p>
        )}
      </div>
  </div>
);
};

export default FavouritePage;
