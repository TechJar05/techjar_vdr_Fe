import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FaFolder, FaUpload, FaRegStar, FaEllipsisV, FaDownload, FaEye, FaTrash,FaStar, FaLock } from "react-icons/fa";

import Button from "../../../components/Style/Button";
import BottomLine from "../../../components/Style/BottomLine";
import BackButton from "../../../components/Style/BackButton";
import Tooltip from "../../../components/Style/Tooltip";
import Spinner from "../../../components/Style/Spinner";
import Toastbar from "../../../components/Style/Toastbar";
import apiRequest from "../../../utils/apiClient";
import formatBytes from "../../../utils/formatBytes";

const normalizeFolder = (folder) => ({
  id: folder.ID || folder.id,
  title: folder.NAME || folder.title || "Untitled",
  createdAt: folder.CREATED_AT || folder.createdAt,
  createdBy: folder.CREATED_BY || folder.createdBy || "Unknown",
  fileCount: folder.FILE_COUNT ?? folder.fileCount ?? 0,
  sizeBytes: Number(folder.TOTAL_SIZE ?? folder.sizeBytes ?? 0),
});

const normalizeFile = (file) => ({
  id: file.ID || file.id,
  name: file.FILE_NAME || file.fileName || "Untitled",
  tag: file.TAG || file.tag || "—",
  sizeBytes: Number(file.FILE_SIZE ?? file.fileSize ?? 0),
  type: file.FILE_TYPE || file.fileType || "—",
  url: file.FILE_URL || file.fileUrl,
  uploadedBy: file.UPLOADED_BY || file.uploadedBy || "Unknown",
  uploadedAt: file.UPLOADED_AT || file.uploadedAt,
  modifiedBy: file.MODIFIED_BY || file.modifiedBy || file.UPLOADED_BY || "Unknown",
  modifiedAt: file.MODIFIED_AT || file.modifiedAt || file.UPLOADED_AT || file.uploadedAt,
  version: file.VERSION || file.version || "1.0",
});

const FolderPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [folderDetails, setFolderDetails] = useState(location.state?.folder || null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [favorites, setFavorites] = useState([]);
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "user");
  const [userAccess, setUserAccess] = useState({}); // { [itemId]: ['VIEW', 'DOWNLOAD', ...] }
  const [checkingAccess, setCheckingAccess] = useState(false);

  const toastMsg = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "info" }), 2500);
  };

  const normalizeFavoriteItem = (favorite) => ({
    itemId: favorite.ITEM_ID || favorite.itemId,
    itemType: (favorite.ITEM_TYPE || favorite.itemType || "").toLowerCase(),
  });

  const loadFavorites = async () => {
    try {
      const data = await apiRequest("/favorites");
      const items = Array.isArray(data) ? data : data?.data || [];
      setFavorites(items.map(normalizeFavoriteItem));
    } catch (error) {
      console.error("Failed to load favorites", error);
      toastMsg(error.message || "Unable to load favourites", "error");
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [id]);

  // Check user access for folder and files
  const checkAccessForItems = async () => {
    try {
      setCheckingAccess(true);
      
      // Check folder access
      const folderCheck = await apiRequest(`/access/check?itemId=${id}&itemType=folder`);
      setUserAccess(prev => ({ ...prev, [id]: folderCheck.accessTypes || [] }));
      
      // Check each file's access
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const fileCheck = await apiRequest(`/access/check?itemId=${file.id}&itemType=file`);
            setUserAccess(prev => ({ ...prev, [file.id]: fileCheck.accessTypes || [] }));
          } catch (e) {
            console.warn(`Could not check access for file ${file.id}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error("Failed to check access", e.message);
    } finally {
      setCheckingAccess(false);
    }
  };

  useEffect(() => {
    if (files && files.length > 0) {
      checkAccessForItems();
    }
  }, [files, id]);

  // Poll access every 10 seconds to detect approved requests
  useEffect(() => {
    const interval = setInterval(() => {
      checkAccessForItems();
    }, 10000);
    return () => clearInterval(interval);
  }, [files, id]);

  // Also re-check access when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      checkAccessForItems();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [files, id]);

  const favoriteMap = useMemo(() => {
    const map = new Set();
    favorites.forEach((fav) => {
      if (fav.itemId && fav.itemType) {
        map.add(`${fav.itemType}:${fav.itemId}`);
      }
    });
    return map;
  }, [favorites]);

  const isFavoriteItem = (itemId, type) => favoriteMap.has(`${type}:${itemId}`);

  const handleFavoriteToggle = async (itemId, itemType) => {
    const type = itemType.toLowerCase();
    try {
      if (isFavoriteItem(itemId, type)) {
        await apiRequest(`/favorites/${itemId}?type=${type}`, { method: "DELETE" });
        toastMsg("Removed from favourites", "success");
      } else {
        await apiRequest("/favorites", {
          method: "POST",
          body: { itemId, itemType: type },
        });
        toastMsg("Added to favourites", "success");
      }
      loadFavorites();
    } catch (error) {
      console.error("Favorite toggle failed", error);
      toastMsg(error.message || "Unable to update favourite", "error");
    }
  };

  const fetchFolderMeta = async (force = false) => {
    if (folderDetails && !force) return;
    try {
      const data = await apiRequest("/files/folders");
      const list = Array.isArray(data) ? data : data?.data || [];
      const found = list.find((item) => (item.ID || item.id) === id);
      if (found) {
        setFolderDetails(normalizeFolder(found));
      }
    } catch (error) {
      console.error("Failed to fetch folder metadata", error);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/files/folder/${id}`);
      const list = Array.isArray(data) ? data : data?.data || [];
      const normalized = list.map(normalizeFile);
      const folderSize = normalized.reduce((sum, file) => sum + (file.sizeBytes || 0), 0);
      setFiles(normalized);
      setFolderDetails((prev) =>
        prev
          ? { ...prev, fileCount: normalized.length, sizeBytes: folderSize }
          : {
              id,
              title: id,
              fileCount: normalized.length,
              sizeBytes: folderSize,
            }
      );
    } catch (error) {
      console.error("Failed to fetch files", error);
      toastMsg(error.message || "Unable to load files", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolderMeta();
  }, [id]);

  useEffect(() => {
    fetchFiles();
  }, [id]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check user access for upload
    if (userRole !== "admin" && !userAccess[id]?.includes("UPLOAD")) {
      toastMsg("You don't have upload access. Please request access.", "error");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      await apiRequest(`/files/upload/${id}`, {
        method: "POST",
        body: formData,
      });
      toastMsg("File uploaded successfully", "success");
      await fetchFiles();
      await fetchFolderMeta(true);
    } catch (error) {
      console.error("Upload failed", error);
      toastMsg(error.message || "Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleView = async (fileId) => {
    try {
      const data = await apiRequest(`/files/view/${fileId}`, { auth: false });
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

  const handleDownloadFolder = async () => {
    try {
      // Check user access to folder
      if (userRole !== "admin" && !userAccess[id]?.includes("DOWNLOAD")) {
        toastMsg("You don't have download access to this folder. Please request access.", "error");
        return;
      }

      // Determine folder size in MB (fallback to 1MB)
      const sizeMb = Math.max(1, Math.ceil((Number(folderDetails?.sizeBytes || 0) || 0) / (1024 * 1024)));

      // Add folder with all contents to virtual storage (lifetime access)
      try {
        await apiRequest("/storage/add-folder", {
          method: "POST",
          body: { folderId: id, folderName: folderDetails?.title || "Folder", folderSizeMb: sizeMb },
        });
        toastMsg("Folder and all its contents added to your Storage", "success");
      } catch (storageError) {
        console.error("Storage add failed", storageError.message || storageError);
        toastMsg(storageError.message || "Unable to add folder to storage", "error");
      }
    } catch (error) {
      console.error("Download folder failed", error);
      toastMsg(error.message || "Unable to download folder", "error");
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      // Check user access
      if (userRole !== "admin" && !userAccess[fileId]?.includes("DOWNLOAD")) {
        toastMsg("You don't have download access. Please request access.", "error");
        return;
      }

      // Find file metadata (size) to compute MB
      const file = files.find((f) => f.id === fileId) || {};
      const sizeMb = Math.max(1, Math.ceil((Number(file.sizeBytes || file.fileSize || 0) || 0) / (1024 * 1024)));

      // Always add to virtual storage (lifetime access). Do NOT trigger actual download.
      try {
        await apiRequest("/storage/add", {
          method: "POST",
          body: { itemId: fileId, itemName: fileName, fileSizeMb: sizeMb, itemType: "file" },
        });
        toastMsg("File added to your Storage", "success");
        // Refresh storage info if sidebar or storage page present
        // Optionally navigate to Storage page: navigate('/storage')
      } catch (storageError) {
        // Propagate quota error message
        console.error("Storage add failed", storageError.message || storageError);
        toastMsg(storageError.message || "Unable to add file to storage", "error");
      }
    } catch (error) {
      console.error("Download failed", error);
      toastMsg(error.message || "Unable to download file", "error");
    }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    const confirmed = window.confirm(`Move "${fileName}" to trash?`);
    if (!confirmed) return;

    try {
      await apiRequest(`/files/file/${fileId}`, {
        method: "DELETE",
      });
      toastMsg("File moved to trash", "success");
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
      await fetchFolderMeta(true);
    } catch (error) {
      console.error("Delete file failed", error);
      toastMsg(error.message || "Unable to delete file", "error");
    }
  };

  const handleRequestAccess = async (itemId, itemName, itemType, accessType) => {
    try {
      await apiRequest("/access/request", {
        method: "POST",
        body: {
          itemId,
          itemName,
          itemType,
          accessTypes: [accessType], // Single access type
        },
      });
      toastMsg(`${accessType} access requested for ${itemName}. Admins will review your request.`, "success");
    } catch (error) {
      console.error("Request access failed", error);
      toastMsg(error.message || "Unable to request access", "error");
    }
  };

  const handleRequestCreateFolder = async () => {
    try {
      await apiRequest("/access/request", {
        method: "POST",
        body: {
          itemId: id,
          itemName: `Create Folder in ${folderDetails?.title || "Folder"}`,
          itemType: "folder",
          accessTypes: ["CREATE_FOLDER"],
        },
      });
      toastMsg("Access request sent for Create Folder. Admins will review your request.", "success");
    } catch (error) {
      console.error("Request access failed", error);
      toastMsg(error.message || "Unable to request access", "error");
    }
  };

  const handleRequestUpload = async () => {
    try {
      await apiRequest("/access/request", {
        method: "POST",
        body: {
          itemId: id,
          itemName: `Upload File to ${folderDetails?.title || "Folder"}`,
          itemType: "folder",
          accessTypes: ["UPLOAD"],
        },
      });
      toastMsg("Access request sent for Upload File. Admins will review your request.", "success");
    } catch (error) {
      console.error("Request access failed", error);
      toastMsg(error.message || "Unable to request access", "error");
    }
  };

  const handleRequestDownloadFolder = async () => {
    try {
      await apiRequest("/access/request", {
        method: "POST",
        body: {
          itemId: id,
          itemName: folderDetails?.title || "Folder",
          itemType: "folder",
          accessTypes: ["DOWNLOAD"],
        },
      });
      toastMsg("Access request sent to download folder. Admins will review your request.", "success");
    } catch (error) {
      console.error("Request access failed", error);
      toastMsg(error.message || "Unable to request access", "error");
    }
  };

  return (
    <div style={styles.container}>
      {toast.message && <Toastbar message={toast.message} type={toast.type} />}
      <div style={styles.header}>
        <div style={styles.leftSection}>
          <BackButton />
          <div>
            <h2 style={styles.folderTitle}>{folderDetails?.title || "Loading..."}</h2>
            <p style={styles.folderMeta}>
              {folderDetails?.createdBy ? `Created by ${folderDetails.createdBy}` : "—"}
              {folderDetails?.createdAt &&
                ` · ${new Date(folderDetails.createdAt).toLocaleString()}`}
            </p>
            <div style={styles.folderStats}>
              <span>{folderDetails?.fileCount ?? 0} Files</span>
              <span>•</span>
              <span>{formatBytes(folderDetails?.sizeBytes ?? 0)} used</span>
            </div>
          </div>
        </div>

        <div style={styles.rightSection}>
          {userRole === "admin" || userAccess[id]?.includes("CREATE_FOLDER") ? (
            <Button
              text="Create Folder"
              onClick={() => toastMsg("Folder creation coming soon")}
              title="Create a new folder"
            />
          ) : (
            <Button
              text="Request Create Folder"
              icon={<FaLock />}
              onClick={handleRequestCreateFolder}
              title="Request permission to create folders"
            />
          )}
          {userRole === "admin" || userAccess[id]?.includes("UPLOAD") ? (
            <Button
              text={uploading ? "Uploading..." : "Upload File"}
              icon={<FaUpload />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload a file"
            />
          ) : (
            <Button
              text="Request Upload File"
              icon={<FaLock />}
              onClick={handleRequestUpload}
              title="Request permission to upload files"
            />
          )}
        </div>
      </div>

      <BottomLine />

      <div style={styles.folderGrid}>
        <div style={styles.folderCard}>
            <div style={styles.folderCardHeader}>
            <Tooltip
              text={
                isFavoriteItem(id, "folder") ? "Remove from Favourite" : "Add to Favourite"
              }
            >
              {isFavoriteItem(id, "folder") ? (
                <FaStar
                    style={{
                      ...styles.starIcon,
                      color: "#fbbf24",
                    }}
                  onClick={() => handleFavoriteToggle(id, "folder")}
                  />
                ) : (
                  <FaRegStar
                    style={{
                      ...styles.starIcon,
                      color: "#9ca3af",
                    }}
                  onClick={() => handleFavoriteToggle(id, "folder")}
                  />
                )}
              </Tooltip>
              <FaEllipsisV style={styles.menuIcon} />
            </div>
          <FaFolder size={70} color="#fbbf24" style={{ marginTop: "30px" }} />
          <p style={styles.folderLabel}>{folderDetails?.title || "—"}</p>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      <div style={styles.filesContainer}>
        <div style={styles.filesHeader}>
          <h3 style={{ margin: 0 }}>Files</h3>
          <p style={styles.filesSummary}>
            Showing {files.length} item{files.length === 1 ? "" : "s"} ·{" "}
            {formatBytes(folderDetails?.sizeBytes ?? 0)} used
          </p>
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
            <Spinner />
          </div>
        ) : files.length ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>#</th>
                <th style={styles.tableHeader}>Fav</th>
                <th style={styles.tableHeader}>Name</th>
                <th style={styles.tableHeader}>Tag</th>
                <th style={styles.tableHeader}>Size</th>
                <th style={styles.tableHeader}>Type</th>
                <th style={styles.tableHeader}>Modified Date</th>
                <th style={styles.tableHeader}>Modified By</th>
                <th style={styles.tableHeader}>Version</th>
                <th style={{ ...styles.tableHeader, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr key={file.id}>
                  <td style={styles.tableCell}>{index + 1}</td>
                  <td style={styles.favoriteCell}>
                    {isFavoriteItem(file.id, "file") ? (
                      <FaStar
                        style={styles.favoriteIcon}
                        onClick={() => handleFavoriteToggle(file.id, "file")}
                      />
                    ) : (
                      <FaRegStar
                        style={{ ...styles.favoriteIcon, color: "#d1d5db" }}
                        onClick={() => handleFavoriteToggle(file.id, "file")}
                      />
                    )}
                  </td>
                  <td style={{ ...styles.tableCell, fontWeight: 600 }}>{file.name}</td>
                  <td style={styles.tableCell}>{file.tag}</td>
                  <td style={styles.tableCell}>{formatBytes(file.sizeBytes)}</td>
                  <td style={styles.tableCell}>{file.type}</td>
                  <td style={styles.tableCell}>
                    {file.modifiedAt ? new Date(file.modifiedAt).toLocaleString() : "—"}
                  </td>
                  <td style={styles.tableCell}>{file.modifiedBy}</td>
                  <td style={styles.tableCell}>{file.version}</td>
                  <td style={styles.tableActionCell}>
                    {userRole === "admin" ? (
                      <>
                        <Button
                          text="View"
                          icon={<FaEye />}
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                          onClick={() => handleView(file.id)}
                        />
                        <Button
                          text="Download"
                          icon={<FaDownload />}
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                          onClick={() => handleDownload(file.id, file.name)}
                        />
                        <Button
                          text="Delete"
                          icon={<FaTrash />}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            background: "#fee2e2",
                            color: "#b91c1c",
                          }}
                          onClick={() => handleDeleteFile(file.id, file.name)}
                        />
                      </>
                    ) : (
                      <>
                        {/* View Button or Request View */}
                        {userAccess[file.id]?.includes("VIEW") ? (
                          <Button
                            text="View"
                            icon={<FaEye />}
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                            onClick={() => handleView(file.id)}
                          />
                        ) : (
                          <Button
                            text="Request View"
                            icon={<FaLock />}
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                            onClick={() =>
                              handleRequestAccess(file.id, file.name, "file", "VIEW")
                            }
                          />
                        )}

                        {/* Download Button or Request Download */}
                        {userAccess[file.id]?.includes("DOWNLOAD") ? (
                          <Button
                            text="Download"
                            icon={<FaDownload />}
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                            onClick={() => handleDownload(file.id, file.name)}
                          />
                        ) : (
                          <Button
                            text="Request Download"
                            icon={<FaLock />}
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                            onClick={() =>
                              handleRequestAccess(file.id, file.name, "file", "DOWNLOAD")
                            }
                          />
                        )}

                        {/* Delete (admin only) */}
                        {userRole === "admin" && (
                          <Button
                            text="Delete"
                            icon={<FaTrash />}
                            style={{
                              padding: "4px 10px",
                              fontSize: "12px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                            }}
                            onClick={() => handleDeleteFile(file.id, file.name)}
                          />
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: "center", padding: "20px 0", color: "#6b7280" }}>
            No files uploaded yet.
          </p>
    )}
    </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    background: "#f3f4f6",
    minHeight: "100vh",
    paddingBottom: "40px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 20px",
    // background: "#fff",
    // borderBottom: "1px solid #e5e7eb",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  folderTitle: {
    fontSize: "17px",
    fontWeight: "500",
    alignItems: "center",
    color: "#111827",
  },
  folderMeta: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "4px",
  },
  folderStats: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    fontSize: "13px",
    color: "#4b5563",
    marginTop: "6px",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  folderGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    padding: "20px",
  },
  folderCard: {
    position: "relative",
    width: "180px",
    height: "160px",
    backgroundColor: "#f9fafb",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  folderCardHeader: {
    position: "absolute",
    top: "16px",
    left: "14px",
    right: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  starIcon: {
    color: "#9ca3af", 
    fontSize: "18px",
    cursor: "pointer",
  },
  menuIcon: {
    color: "#6b7280",
    fontSize: "15px",
    cursor: "pointer",
  },
  folderLabel: {
    marginTop: "14px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#111827",
    textAlign: "center",
  },
  filesContainer: {
    background: "#fff",
    margin: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    padding: "20px",
  },
  filesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  filesSummary: {
    fontSize: "13px",
    color: "#6b7280",
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
  tableCell: {
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#111827",
  },
  favoriteCell: {
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "center",
  },
  favoriteIcon: {
    color: "#fbbf24",
    cursor: "pointer",
    fontSize: "16px",
  },
  tableActionCell: {
    textAlign: "right",
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    borderBottom: "1px solid #f1f5f9",
    padding: "12px 0",
  },
};

export default FolderPage;
