import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import FolderCard from "../../../components/Layout/FolderCard";
import BottomLine from "../../../components/Style/BottomLine";
import Button from "../../../components/Style/Button";
import Spinner from "../../../components/Style/Spinner";
import Toastbar from "../../../components/Style/Toastbar";
import apiRequest from "../../../utils/apiClient";
import formatBytes from "../../../utils/formatBytes";

const normalizeFolder = (folder) => ({
  id: folder.ID || folder.id,
  title: folder.NAME || folder.title || "Untitled",
  createdAt: folder.CREATED_AT || folder.createdAt,
  createdBy: folder.CREATED_BY || folder.createdBy || "Unknown",
  fileCount: folder.FILE_COUNT ?? folder.files ?? 0,
  sizeBytes: Number(folder.TOTAL_SIZE ?? folder.sizeBytes ?? 0),
});

const DashboardPage = () => {
  const [folders, setFolders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: "" });
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [favoriteFolderIds, setFavoriteFolderIds] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const toastMsg = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "info" }), 2500);
  };

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("userRole") || localStorage.getItem("role");
    setUserRole(role);
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/files/folders");
      const items = Array.isArray(data) ? data : data?.data || [];
      const normalized = items.map((folder) => {
        const data = normalizeFolder(folder);
        return {
          ...data,
          size: formatBytes(data.sizeBytes),
        };
      });
      setFolders(normalized);
    } catch (error) {
      console.error("Failed to fetch folders", error);
      toastMsg(error.message || "Unable to fetch folders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const loadFavorites = async () => {
    try {
      setFavoritesLoading(true);
      const data = await apiRequest("/favorites");
      const items = Array.isArray(data) ? data : data?.data || [];
      const folderIds = items
        .filter(
          (fav) => (fav.ITEM_TYPE || fav.itemType || "").toLowerCase() === "folder"
        )
        .map((fav) => fav.ITEM_ID || fav.itemId);
      setFavoriteFolderIds(folderIds);
    } catch (error) {
      console.error("Failed to load favorites", error);
      toastMsg(error.message || "Unable to load favourites", "error");
    } finally {
      setFavoritesLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const renameFolder = async (id, newTitle) => {
    try {
      await apiRequest(`/files/folder/${id}`, {
        method: "PUT",
        body: { name: newTitle },
      });
      setFolders((prev) =>
        prev.map((folder) => (folder.id === id ? { ...folder, title: newTitle } : folder))
      );
      toastMsg("Folder renamed successfully", "success");
    } catch (error) {
      console.error("Rename failed", error);
      toastMsg(error.message || "Unable to rename folder", "error");
    }
  };

  const deleteFolder = async (id) => {
    const target = folders.find((folder) => folder.id === id);
    const label = target?.title || "this folder";
    const confirmed = window.confirm(`Move "${label}" to trash?`);
    if (!confirmed) return;

    try {
      await apiRequest(`/files/folder/${id}`, { method: "DELETE" });
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      toastMsg("Folder moved to trash", "success");
    } catch (error) {
      console.error("deleteFolder failed", error);
      toastMsg(error.message || "Unable to delete folder", "error");
    }
  };

  const filteredFolders = useMemo(
    () =>
      folders.filter((folder) =>
        folder.title?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [folders, searchQuery]
  );

  const handleCreateProject = async () => {
    if (newProject.title) {
      try {
        setModalLoading(true);
        const payload = { name: newProject.title.trim() };
        const created = await apiRequest("/files/folder", {
          method: "POST",
          body: payload,
        });
        const normalized = normalizeFolder(created);
        setFolders((prev) => [
          ...prev,
          {
            ...normalized,
            size: formatBytes(normalized.sizeBytes),
          },
        ]);
        toastMsg("Project created successfully", "success");
        setShowModal(false);
        setNewProject({ title: "" });
        fetchFolders();
      } catch (error) {
        console.error("Create project failed", error);
        toastMsg(error.message || "Unable to create project", "error");
      } finally {
        setModalLoading(false);
      }
      return;
    }
    toastMsg("Please enter a project title.", "error");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
  };

  const favoriteFolderSet = useMemo(
    () => new Set(favoriteFolderIds),
    [favoriteFolderIds]
  );

  const handleToggleFavorite = async (folderId) => {
    const isFavorite = favoriteFolderSet.has(folderId);

    try {
      if (isFavorite) {
        await apiRequest(`/favorites/${folderId}?type=folder`, {
          method: "DELETE",
        });
        toastMsg("Removed from favourites", "success");
      } else {
        await apiRequest("/favorites", {
          method: "POST",
          body: { itemId: folderId, itemType: "folder" },
        });
        toastMsg("Added to favourites", "success");
      }
      loadFavorites();
    } catch (error) {
      console.error("Favorite toggle failed", error);
      toastMsg(error.message || "Unable to update favourite", "error");
    }
  };

  const handleDownloadFolder = async (folderId, folderName) => {
    try {
      // Check access
      const check = await apiRequest(`/access/check?itemId=${folderId}&itemType=folder`);
      if (userRole !== "admin" && !(check.accessTypes || []).includes("DOWNLOAD")) {
        toastMsg("You don't have download access. Please request access.", "error");
        return;
      }

      // Determine folder size in MB (fallback to 1MB)
      const folder = folders.find((f) => f.id === folderId) || {};
      const sizeBytes = folder.sizeBytes || folder.size || 0;
      const sizeMb = Math.max(1, Math.ceil((Number(sizeBytes) || 0) / (1024 * 1024)));

      await apiRequest("/storage/add-folder", {
        method: "POST",
        body: { folderId, folderName, folderSizeMb: sizeMb },
      });
      toastMsg("Folder and all its contents added to your Storage", "success");
    } catch (error) {
      console.error("Download Folder failed", error);
      toastMsg(error.message || "Unable to add folder to storage", "error");
    }
  };

  const handleRequestFolderAccess = async (folderId, folderName, itemTypeOrAction) => {
    // If caller asked for a 'download' action via the 'onRequestAccess' slot, treat as download
    if (itemTypeOrAction === "download") {
      return handleDownloadFolder(folderId, folderName);
    }

    try {
      await apiRequest("/access/request", {
        method: "POST",
        body: {
          itemId: folderId,
          itemName: folderName,
          itemType: itemTypeOrAction,
          accessTypes: ["DOWNLOAD"], // Folders only have DOWNLOAD access, not VIEW
        },
      });
      toastMsg(
        `Access request sent for "${folderName}". Admins will review your request.`,
        "success"
      );
    } catch (error) {
      console.error("Request access failed", error);
      toastMsg(error.message || "Unable to request access", "error");
    }
  };

  const styles = {
    main: {
      background: "#f3f4f6",
      minHeight: "100vh",
      paddingBottom: "40px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 20px",
      marginBottom: "0",
    },
    searchBox: {
      padding: "10px 16px",
      borderRadius: "6px",
      border: "1px solid #ddd",
      outline: "none",
      width: "250px",
      fontSize: "16px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: "25px",
      padding: "25px",
    },
    modal: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#fff",
      padding: "20px",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
      borderRadius: "8px",
      zIndex: 1000,
      maxWidth: "400px",
      width: "80%",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.3)",
      zIndex: 999,
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#333",
      textAlign: "center",
    },
    modalForm: {
      display: "flex",
      flexDirection: "column",
    },
    inputGroup: {
      marginBottom: "15px",
    },
    inputLabel: {
      fontSize: "16px",
      color: "#555",
      marginBottom: "18px",
    },
    inputField: {
      padding: "10px",
      borderRadius: "6px",
      border: "1px solid #ddd",
      outline: "none",
      width: "100%",
      fontSize: "16px",
      boxSizing: "border-box",
    },
  };

  return (
    <div>
      {toast.message && <Toastbar message={toast.message} type={toast.type} />}
      <div style={styles.main}>
        <div style={styles.header}>
          <h2 style={{ fontSize: "20px", fontWeight: "500" }}>PROJECT</h2>
          <div style={{ display: "flex", gap: "15px" }}>
            <input
              type="text"
              placeholder="Search..."
              style={styles.searchBox}
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Button 
              text="Create Project" 
              icon={<FaPlus />} 
              onClick={() => userRole === "admin" ? setShowModal(true) : toastMsg("Only admins can create projects", "error")}
              disabled={userRole !== "admin"}
              title={userRole !== "admin" ? "Only admins can create projects" : ""}
            />
          </div>
        </div>
        <BottomLine/>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "80px" }}>
            <Spinner />
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                id={folder.id}
                title={folder.title}
                files={folder.fileCount}
                size={folder.size}
                isFavorite={favoriteFolderSet.has(folder.id)}
                onToggleFavorite={() => handleToggleFavorite(folder.id)}
                onRename={userRole === "admin" ? renameFolder : null}
                onDelete={userRole === "admin" ? deleteFolder : null}
                onRequestAccess={userRole !== "admin" ? handleRequestFolderAccess : null}
                metadata={folder}
                userRole={userRole}
              />
            ))}
            {!filteredFolders.length && (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6b7280" }}>
                No projects found.
              </p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <>
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}></div>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Create New Project</h3>
            <form style={styles.modalForm}>
              <div style={styles.inputGroup}>
                <label htmlFor="title" style={styles.inputLabel}>Project Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Enter Project Title"
                  value={newProject.title}
                  onChange={handleInputChange}
                  style={styles.inputField}
                  required
                />
              </div>
               <Button text={modalLoading ? "Creating..." : "Create Project"} onClick={handleCreateProject} disabled={modalLoading} />
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
