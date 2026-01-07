import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";  
import { FaFolder, FaStar, FaUser, FaUsers, FaClipboardList, FaTrash, FaChartBar, FaCog } from "react-icons/fa";
import logo from "../../assets/images/TechJar_Logo-3.webp";
import apiRequest from "../../utils/apiClient";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [storage, setStorage] = useState({ totalQuotaMb: 5000, usedMb: 0, percentUsed: 0 });
  const [storageLoading, setStorageLoading] = useState(false);

  // Function to handle navigation to different routes
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Updated isActive function for exact match on route and child routes
  const isActive = (path) => {
    return location.pathname.startsWith(path); // For child routes as well
  };

  // Fetch storage info
  const fetchStorage = async () => {
    try {
      setStorageLoading(true);
      const data = await apiRequest("/api/storage");
      setStorage({
        totalQuotaMb: data.totalQuotaMb || 5000,
        usedMb: data.usedMb || 0,
        percentUsed: data.percentUsed || 0,
      });
    } catch (error) {
      console.error("Failed to fetch storage", error);
      // Use defaults if API fails
    } finally {
      setStorageLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
    // Refresh storage every 30 seconds
    const interval = setInterval(fetchStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  const styles = {
    sidebar: {
      width: "230px",
      backgroundColor: "#1e3a8a",
      color: "#fff",
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.3s ease-in-out",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "5px 0",
      zIndex: 1000,
    },
    logo: {
      textAlign: "center",
      marginBottom: "2rem",
      marginTop: "10px",
    },
    logoImg: {
      width: "100px",
    },
    menu: {
      display: "flex",
      flexDirection: "column",
      marginLeft: "18px",
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      opacity: 0.9,
      borderRadius: "4px",
      fontWeight: "300",
      transition: "background-color 0.3s ease, color 0.3s ease",
      padding: "10px",
    },
    activeMenuItem: {
      fontWeight: "500",
      transform: "scale(1.1)",
    },
    footer: {
      paddingLeft: "25px",
      marginBottom: "4rem",
      fontSize: "12px",
      opacity: "0.8",
    },
    progressBar: {
      height: "6px",
      width: "90%",
      background: "#3749b4",
      borderRadius: "4px",
      overflow: "hidden",
      marginTop: "5px",
    },
    progress: {
      height: "100%",
      background: storage.percentUsed > 80 ? "#ef4444" : "#10b981",
      transition: "width 0.3s ease",
      width: `${storage.percentUsed}%`,
    },
  };

  return (
    <div style={styles.sidebar}>
      <div>
        <div style={styles.logo}>
          <img src={logo} alt="TechJar Logo" style={styles.logoImg} />
        </div>

        <div style={styles.menu}>
          {/* Project */}
          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/project") && styles.activeMenuItem),
            }}
            onClick={() => handleNavigation("/project")}
          >
            <FaFolder /> Project
          </div>

          {/* Favourite */}
          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/favourite") && styles.activeMenuItem),
            }}
            onClick={() => handleNavigation("/favourite")}
          >
            <FaStar /> Favourite
          </div>

          {/* User */}
          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/users") && styles.activeMenuItem),
            }}
            onClick={() => handleNavigation("/users")}
          >
            <FaUser /> User
          </div>

          {/* User Group */}
          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/userGroup") && styles.activeMenuItem),
            }}
            onClick={() => handleNavigation("/userGroup")}
          >
            <FaUsers /> User Group
          </div>

          {/* User Access Request */}
          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/userAccess") && styles.activeMenuItem),
            }}
            onClick={() => handleNavigation("/userAccess")}
          >
            <FaClipboardList /> User Access Request
          </div>

          {/* User Logs */}
          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/logs") && styles.activeMenuItem),
            }}
            onClick={() => handleNavigation("/logs")}
          >
            <FaClipboardList /> User Logs
          </div>

          {/* Trash */}
          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/trash") && styles.activeMenuItem),
            }}
            onClick={() => handleNavigation("/trash")}
          >
            <FaTrash /> Trash
          </div>

          {/* Reports */}
          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/reports") && styles.activeMenuItem),
            }}
            onClick={() => handleNavigation("/reports")}
          >
            <FaChartBar /> Reports
          </div>

          {/* Settings */}
          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/setting") && styles.activeMenuItem),
            }}
            onClick={() => handleNavigation("/setting")}
          >
            <FaCog /> Settings
          </div>
        </div>
      </div>


      <div style={styles.footer} onClick={() => handleNavigation("/storage")}>
        <p>Storage ({storage.percentUsed.toFixed(1)}% full)</p>
        <div style={styles.progressBar}>
          <div style={styles.progress}></div>
        </div>
        <p>{storage.usedMb.toFixed(1)} MB of {storage.totalQuotaMb} MB used</p>
      </div>
    </div>
  );
};

export default Sidebar;
