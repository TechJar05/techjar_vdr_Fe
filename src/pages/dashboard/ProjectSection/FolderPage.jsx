import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FaFolder, FaUpload, FaRegStar, FaEllipsisV, FaDownload, FaEye, FaTrash, FaStar, FaLock, FaTimes, FaUsers, FaLink } from "react-icons/fa";

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
  const [userRole] = useState(localStorage.getItem("role") || "user");
  const [userAccess, setUserAccess] = useState({}); // { [itemId]: ['VIEW', 'DOWNLOAD', ...] }

  // File viewer modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState(null); // { id, name, url, type }

  // Access info modal state
  const [accessInfoOpen, setAccessInfoOpen] = useState(false);
  const [accessInfoFile, setAccessInfoFile] = useState(null);
  const [accessInfoList, setAccessInfoList] = useState([]);
  const [accessInfoLoading, setAccessInfoLoading] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Check user access for folder and files
  const checkAccessForItems = async (currentFiles) => {
    try {
      // Check folder access
      const folderCheck = await apiRequest(`/access/check?itemId=${id}&itemType=folder`);
      setUserAccess(prev => ({ ...prev, [id]: folderCheck.accessTypes || [] }));

      // Check each file's access
      const filesToCheck = currentFiles || files;
      if (filesToCheck && filesToCheck.length > 0) {
        for (const file of filesToCheck) {
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
    }
  };

  useEffect(() => {
    if (files && files.length > 0) {
      checkAccessForItems(files);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, id]);

  // Poll access every 10 seconds to detect approved requests
  useEffect(() => {
    const interval = setInterval(() => {
      checkAccessForItems(files);
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, id]);

  // Also re-check access when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      checkAccessForItems(files);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const file = files.find((f) => f.id === fileId);
      const data = await apiRequest(`/files/view/${fileId}`, { auth: false });
      if (data?.url) {
        setViewerFile({
          id: fileId,
          name: file?.name || "File",
          url: data.url,
          type: file?.type || "",
        });
        setViewerOpen(true);
      } else {
        toastMsg("Preview unavailable", "error");
      }
    } catch (error) {
      console.error("View failed", error);
      toastMsg(error.message || "Unable to open file", "error");
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerFile(null);
  };

  // Copy file URL to clipboard (instead of downloading)
  const handleCopyUrl = () => {
    if (viewerFile?.url) {
      navigator.clipboard.writeText(viewerFile.url);
      toastMsg("File URL copied to clipboard", "success");
    }
  };

  // Get list of users who have access to a file
  const handleShowAccessInfo = async (fileId, fileName) => {
    try {
      setAccessInfoLoading(true);
      setAccessInfoFile({ id: fileId, name: fileName });
      const data = await apiRequest(`/access/item-users?itemId=${fileId}&itemType=file`);
      setAccessInfoList(data || []);
      setAccessInfoOpen(true);
    } catch (error) {
      console.error("Failed to fetch access info", error);
      toastMsg(error.message || "Unable to fetch access info", "error");
    } finally {
      setAccessInfoLoading(false);
    }
  };

  const closeAccessInfo = () => {
    setAccessInfoOpen(false);
    setAccessInfoFile(null);
    setAccessInfoList([]);
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
                <th style={styles.tableHeader}>Access</th>
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
                  <td style={styles.tableCell}>
                    <div
                      style={styles.accessBadge}
                      onClick={() => handleShowAccessInfo(file.id, file.name)}
                      title="View who has access"
                    >
                      <FaUsers size={12} />
                      <span>View</span>
                    </div>
                  </td>
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

      {/* File Viewer Modal */}
      {viewerOpen && viewerFile && (
        <div style={styles.modalOverlay} onClick={closeViewer}>
          <div style={styles.viewerModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.viewerHeader}>
              <h3 style={styles.viewerTitle}>{viewerFile.name}</h3>
              <div style={styles.viewerActions}>
                <button
                  style={styles.viewerBtn}
                  onClick={handleCopyUrl}
                  title="Copy file URL"
                >
                  <FaLink /> Copy URL
                </button>
                <button
                  style={styles.viewerCloseBtn}
                  onClick={closeViewer}
                  title="Close viewer"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div style={styles.viewerContent}>
              {viewerFile.type?.includes("image") ? (
                <img
                  src={viewerFile.url}
                  alt={viewerFile.name}
                  style={styles.viewerImage}
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : viewerFile.type?.includes("pdf") || viewerFile.name?.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={`${viewerFile.url}#toolbar=0&navpanes=0&scrollbar=1`}
                  style={styles.viewerIframe}
                  title={viewerFile.name}
                />
              ) : viewerFile.type?.includes("video") ? (
                <video
                  src={viewerFile.url}
                  controls
                  controlsList="nodownload"
                  style={styles.viewerVideo}
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : viewerFile.type?.includes("audio") ? (
                <audio
                  src={viewerFile.url}
                  controls
                  controlsList="nodownload"
                  style={styles.viewerAudio}
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : viewerFile.type?.includes("text") ||
                  viewerFile.name?.match(/\.(txt|json|xml|csv|md|js|ts|html|css|py|java|c|cpp|h)$/i) ? (
                <iframe
                  src={viewerFile.url}
                  style={styles.viewerIframe}
                  title={viewerFile.name}
                />
              ) : (
                <div style={styles.viewerUnsupported}>
                  <p>Preview not available for this file type.</p>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "10px" }}>
                    File type: {viewerFile.type || "Unknown"}
                  </p>
                  <button
                    style={{ ...styles.viewerBtn, marginTop: "20px" }}
                    onClick={handleCopyUrl}
                  >
                    <FaLink /> Copy File URL
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Access Info Modal */}
      {accessInfoOpen && accessInfoFile && (
        <div style={styles.modalOverlay} onClick={closeAccessInfo}>
          <div style={styles.accessModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.accessModalHeader}>
              <h3 style={styles.accessModalTitle}>
                <FaUsers style={{ marginRight: "8px" }} />
                Access for: {accessInfoFile.name}
              </h3>
              <button
                style={styles.viewerCloseBtn}
                onClick={closeAccessInfo}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
            <div style={styles.accessModalContent}>
              {accessInfoLoading ? (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <Spinner />
                </div>
              ) : accessInfoList.length > 0 ? (
                <div style={styles.accessList}>
                  {accessInfoList.map((user, idx) => (
                    <div key={idx} style={styles.accessItem}>
                      <div style={styles.accessAvatar}>
                        {(user.USER_EMAIL || user.userEmail || "U")[0].toUpperCase()}
                      </div>
                      <div style={styles.accessInfo}>
                        <p style={styles.accessEmail}>
                          {user.USER_EMAIL || user.userEmail}
                        </p>
                        <p style={styles.accessTypes}>
                          {(user.ACCESS_TYPES || user.accessTypes || "").split(",").map((t, i) => (
                            <span key={i} style={styles.accessTypeBadge}>
                              {t.trim()}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
                  No users have been granted access to this file yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    minHeight: "100vh",
    paddingBottom: "40px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  folderTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  folderMeta: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
  folderStats: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    fontSize: "13px",
    color: "#475569",
    marginTop: "8px",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  folderGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    padding: "24px",
  },
  folderCard: {
    position: "relative",
    width: "180px",
    height: "160px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid #e2e8f0",
  },
  folderCardHeader: {
    position: "absolute",
    top: "14px",
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
    transition: "color 0.2s ease",
  },
  menuIcon: {
    color: "#94a3b8",
    fontSize: "15px",
    cursor: "pointer",
  },
  folderLabel: {
    marginTop: "14px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  filesContainer: {
    background: "#fff",
    margin: "0 24px 24px",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    padding: "24px",
    border: "1px solid #e2e8f0",
  },
  filesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
  },
  filesSummary: {
    fontSize: "13px",
    color: "#64748b",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "12px",
    paddingRight: "12px",
  },
  tableCell: {
    padding: "16px 12px 16px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#334155",
  },
  favoriteCell: {
    padding: "16px 0",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "center",
  },
  favoriteIcon: {
    color: "#fbbf24",
    cursor: "pointer",
    fontSize: "16px",
    transition: "transform 0.2s ease",
  },
  tableActionCell: {
    textAlign: "right",
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    borderBottom: "1px solid #f1f5f9",
    padding: "16px 0",
  },
  // Access badge styles
  accessBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    background: "#eff6ff",
    color: "#1e40af",
    borderRadius: "16px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid #bfdbfe",
  },
  // Modal overlay styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    backdropFilter: "blur(4px)",
  },
  // File viewer modal styles
  viewerModal: {
    background: "#fff",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "1100px",
    height: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    overflow: "hidden",
  },
  viewerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  viewerTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "60%",
  },
  viewerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  viewerBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    background: "#eff6ff",
    color: "#1e40af",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  viewerCloseBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "#f3f4f6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#6b7280",
    fontSize: "16px",
    transition: "all 0.2s ease",
  },
  viewerContent: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1f2937",
    padding: "20px",
  },
  viewerImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: "8px",
    userSelect: "none",
    pointerEvents: "none",
  },
  viewerIframe: {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "8px",
    background: "#fff",
  },
  viewerVideo: {
    maxWidth: "100%",
    maxHeight: "100%",
    borderRadius: "8px",
  },
  viewerAudio: {
    width: "80%",
    maxWidth: "500px",
  },
  viewerUnsupported: {
    textAlign: "center",
    color: "#fff",
    padding: "40px",
  },
  // Access info modal styles
  accessModal: {
    background: "#fff",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    overflow: "hidden",
  },
  accessModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  accessModalTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 600,
    color: "#111827",
    display: "flex",
    alignItems: "center",
  },
  accessModalContent: {
    flex: 1,
    overflow: "auto",
    padding: "16px 20px",
  },
  accessList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  accessItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },
  accessAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: "16px",
  },
  accessInfo: {
    flex: 1,
  },
  accessEmail: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 500,
    color: "#111827",
  },
  accessTypes: {
    margin: "4px 0 0",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  accessTypeBadge: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 500,
  },
};

export default FolderPage;
