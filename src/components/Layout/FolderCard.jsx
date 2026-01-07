import React, { useState } from "react";
import { FaFolder, FaEllipsisV, FaTrash, FaEdit, FaStar, FaRegStar, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import apiRequest from "../../utils/apiClient";

import Button from "../Style/Button";

const FolderCard = ({
  id,
  title,
  files,
  size,
  onRename,
  onDelete,
  onRequestAccess,
  metadata,
  isFavorite,
  onToggleFavorite,
  userRole,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuHover, setMenuHover] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessTypes, setAccessTypes] = useState([]);
  const [checkingAccess, setCheckingAccess] = useState(false);

  const navigate = useNavigate();

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setIsMenuVisible(!isMenuVisible);
  };

  // When menu opens, check if current user has approved access to this folder
  React.useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!isMenuVisible) return;
      setCheckingAccess(true);
      try {
        const res = await apiRequest(`/api/access/check?itemId=${id}&itemType=folder`);
        if (cancelled) return;
        setAccessTypes(res.accessTypes || []);
        setHasAccess(!!res.hasAccess || (res.accessTypes || []).includes("DOWNLOAD"));
      } catch (e) {
        console.warn("Folder access check failed", e.message || e);
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [isMenuVisible, id]);

  const handleRenameClick = (e) => {
    e.stopPropagation();
    setIsMenuVisible(false);
    setShowRenameModal(true);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(id);
    setIsMenuVisible(false);
  };

  const handleFolderClick = () => {
    navigate(`/project-folder/${id}`, {
      state: { folder: metadata || { id, title, files, size } },
    });
  };

  const handleRenameSubmit = () => {
    if (newTitle.trim() && onRename) {
      onRename(id, newTitle.trim());
      setShowRenameModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowRenameModal(false);
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(id);
  };

  const handleRequestAccess = (e) => {
    e.stopPropagation();
    onRequestAccess?.(id, title, "folder");
    setIsMenuVisible(false);
  };

  const styles = {
    card: {
      width: "150px",
      background: "#fff",
      borderRadius: "10px",
      padding: "20px",
      boxShadow: isHovered
        ? "0 6px 14px rgba(0, 0, 0, 0.15)"
        : "0 4px 10px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
    },
    favoriteIcon: {
      position: "absolute",
      top: "10px",
      left: "10px",
      fontSize: "16px",
      color: isFavorite ? "#fbbf24" : "#d1d5db",
      cursor: "pointer",
      zIndex: 10,
      transition: "color 0.2s ease",
    },
    icon: {
      color: "#fbbf24",
      fontSize: "60px",
    },
    title: {
      fontWeight: "600",
      fontSize: "16px",
      color: "#111827",
      marginBottom: "8px",
      textTransform: "uppercase",
    },
    metaContainer: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      fontSize: "12px",
      fontWeight: "500",
      color: "#6b7280",
    },
    menuIcon: {
      position: "absolute",
      top: "10px",
      right: "10px",
      fontSize: "14px",
      color: menuHover ? "#374151" : "#9ca3af",
      backgroundColor: menuHover ? "#e5e7eb" : "#f9fafb",
      borderRadius: "50%",
      padding: "8px",
      transition: "all 0.2s ease",
      cursor: "pointer",
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: menuHover
        ? "0 2px 6px rgba(0,0,0,0.1)"
        : "0 1px 3px rgba(0,0,0,0.05)",
    },
    menu: {
      position: "absolute",
      top: "40px",
      right: "10px",
      backgroundColor: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      padding: "6px 0",
      zIndex: 20,
      minWidth: "140px",
    },
    menuItem: {
      padding: "10px",
      cursor: "pointer",
      fontSize: "13px",
      color: "#374151",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "background-color 0.2s ease",
    },
    menuItemHover: {
      backgroundColor: "#f3f4f6",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modal: {
      background: "#fff",
      borderRadius: "10px",
      padding: "20px 30px",
      width: "320px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      textAlign: "center",
      animation: "fadeIn 0.3s ease",
    },
    modalTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#111827",
    },
    modalInput: {
      padding: "10px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      outline: "none",
      fontSize: "14px",
      transition: "border-color 0.2s ease",
    },
  };

  return (
    <>
      <div
        style={styles.card}
        onClick={handleFolderClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsMenuVisible(false);
        }}
      >
        {onToggleFavorite && (
          <div style={styles.favoriteIcon} onClick={handleFavoriteToggle}>
            {isFavorite ? <FaStar /> : <FaRegStar />}
          </div>
        )}

        <div
          style={styles.menuIcon}
          onMouseEnter={() => setMenuHover(true)}
          onMouseLeave={() => setMenuHover(false)}
          onClick={handleMenuClick}
        >
          <FaEllipsisV />
        </div>

        <FaFolder style={styles.icon} />
        <p style={styles.title}>{title}</p>

        <div style={styles.metaContainer}>
          <p>{files} Files</p>
          <p>{size}</p>
        </div>

        {isMenuVisible && (
          <div style={styles.menu}>
            {userRole === "admin" ? (
              // Admin menu: Rename and Delete
              <>
                {onRename && (
                  <div style={styles.menuItem} onClick={handleRenameClick}>
                    <FaEdit /> Rename
                  </div>
                )}
                {onDelete && (
                  <div style={styles.menuItem} onClick={handleDelete}>
                    <FaTrash /> Delete
                  </div>
                )}
              </>
            ) : (
              // User menu: Download (if approved) or Request Access
              <>
                {hasAccess ? (
                  <div
                    style={styles.menuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuVisible(false);
                      // If parent passed a download handler via `onRequestAccess` (legacy), prefer it;
                      // otherwise parent can be updated to pass `onDownload` in future.
                      typeof onRequestAccess === "function" && onRequestAccess(id, title, "download");
                    }}
                  >
                    <FaFolder /> Download
                  </div>
                ) : (
                  onRequestAccess && (
                    <div style={styles.menuItem} onClick={handleRequestAccess}>
                      <FaLock /> Request Access
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showRenameModal && onRename && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div
            style={{
              ...styles.modal,
              width: "300px",
              padding: "22px 26px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <h3 style={{ ...styles.modalTitle, fontSize: "17px" }}>Rename Project</h3>
          
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                ...styles.modalInput,
              }}
              placeholder="Enter new name..."
              onFocus={(e) => (e.target.style.borderColor = "#10b981")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />

            {/* Buttons */}
            <div style={{display: "flex",justifyContent: "space-between", marginTop: "10px", gap: "8px"}}>
              <Button text="Save" onClick={handleRenameSubmit} style={{flex: 1, background: "#10b981", }} />
              <Button text="Cancel" onClick={handleCloseModal} style={{flex: 1, background: "#f3f4f6", color: "#374151",}}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FolderCard;
