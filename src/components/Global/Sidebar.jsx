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
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "user");

  // Check for role changes
  useEffect(() => {
    const checkRole = () => {
      const role = localStorage.getItem("role") || "user";
      setUserRole(role);
    };
    checkRole();
    window.addEventListener("storage", checkRole);
    return () => window.removeEventListener("storage", checkRole);
  }, []);

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
      const data = await apiRequest("/storage");
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
      width: "250px",
      background: "linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)",
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
      padding: "0",
      zIndex: 1000,
      boxShadow: "4px 0 20px rgba(0, 0, 0, 0.15)",
    },
    logo: {
      textAlign: "center",
      padding: "24px 20px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    logoImg: {
      width: "110px",
      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
    },
    menu: {
      display: "flex",
      flexDirection: "column",
      padding: "16px 12px",
      gap: "4px",
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      cursor: "pointer",
      borderRadius: "10px",
      fontWeight: "400",
      fontSize: "14px",
      transition: "all 0.2s ease",
      padding: "12px 16px",
      color: "rgba(255, 255, 255, 0.85)",
    },
    activeMenuItem: {
      fontWeight: "600",
      background: "rgba(255, 255, 255, 0.15)",
      color: "#fff",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    },
    footer: {
      padding: "20px",
      margin: "12px",
      marginBottom: "24px",
      fontSize: "13px",
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    progressBar: {
      height: "8px",
      width: "100%",
      background: "rgba(255, 255, 255, 0.2)",
      borderRadius: "4px",
      overflow: "hidden",
      marginTop: "8px",
    },
    progress: {
      height: "100%",
      background: storage.percentUsed > 80
        ? "linear-gradient(90deg, #ef4444, #f87171)"
        : "linear-gradient(90deg, #10b981, #34d399)",
      transition: "width 0.3s ease",
      width: `${storage.percentUsed}%`,
      borderRadius: "4px",
    },
    storageText: {
      margin: "8px 0 0",
      fontSize: "12px",
      color: "rgba(255, 255, 255, 0.7)",
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

          {/* Admin-only menu items */}
          {userRole === "admin" && (
            <>
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
            </>
          )}

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>Storage</span>
          <span style={{ fontSize: "12px", opacity: 0.8 }}>{storage.percentUsed.toFixed(1)}%</span>
        </div>
        <div style={styles.progressBar}>
          <div style={styles.progress}></div>
        </div>
        <p style={styles.storageText}>{storage.usedMb.toFixed(1)} MB of {storage.totalQuotaMb} MB</p>
      </div>
    </div>
  );
};

export default Sidebar;
