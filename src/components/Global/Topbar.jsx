import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaBell, FaSignOutAlt } from "react-icons/fa";
import apiRequest from "../../utils/apiClient";

const Topbar = ({ title, onToggleSidebar, sidebarOpen, user }) => {
  const navigate = useNavigate();
  const [hoverBurger, setHoverBurger] = useState(false);
  const [hoverBell, setHoverBell] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [profile, setProfile] = useState(user || null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  // ✅ Close popup when clicking outside
  useEffect(() => {
    const closeMenu = (e) => {
      if (!e.target.closest(".user-menu")) setShowMenu(false);
    };
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  // ✅ Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const data = await apiRequest("/api/users/me");
        setProfile({
          fullName: data.name,
          email: data.email,
          role: data.role,
        });
      } catch (error) {
        console.error("Failed to load profile", error);
        setProfileError(error.message || "Unable to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
    // initial notifications load
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      const data = await apiRequest("/api/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications", err.message || err);
    } finally {
      setNotifLoading(false);
    }
  };

  // ✅ Direct redirect on logout icon click
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/"); // redirect to login page
  };

  const styles = {
    container: {
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      position: "sticky",
      top: 0,
      zIndex: 1000,
    },
    leftSection: { display: "flex", alignItems: "center", gap: "14px" },
    burger: {
      width: "42px",
      height: "42px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "10px",
      cursor: "pointer",
      background: hoverBurger ? "rgba(30,58,138,0.06)" : "transparent",
      transition: "all 0.3s ease",
    },
    burgerLine: {
      width: "20px",
      height: "2px",
      background: "#1e3a8a",
      borderRadius: "2px",
      transition: "all 0.3s ease",
    },
    brandText: {
      fontSize: "20px",
      fontWeight: 700,
      background: "linear-gradient(90deg, #1e3a8a, #10b981)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    title: { fontSize: "18px", fontWeight: 600, color: "#1e3a8a" },
    rightSection: {
      display: "flex",
      alignItems: "center",
      gap: "22px",
      color: "#1e3a8a",
      fontSize: "16px",
      position: "relative",
    },
    bell: {
      fontSize: "20px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      color: hoverBell ? "#10b981" : "#1e3a8a",
      transform: hoverBell ? "scale(1.05)" : "scale(1)",
    },
    userBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      padding: "6px 10px",
      borderRadius: "8px",
      transition: "all 0.3s ease",
      background: showMenu ? "rgba(30,58,138,0.07)" : "transparent",
    },
    userName: {
      fontWeight: 500,
      color: "#1e3a8a",
      fontSize: "14px",
    },
    menu: {
      position: "absolute",
      top: "55px",
      right: "0",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      padding: "18px 20px",
      width: "160px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      animation: "fadeIn 0.2s ease",
    },
    notifMenu: {
      position: "absolute",
      top: "55px",
      right: "60px",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      padding: "12px",
      width: "320px",
      maxHeight: "360px",
      overflowY: "auto",
      zIndex: 1200,
    },
    notifItem: {
      padding: "10px",
      borderBottom: "1px solid #f1f5f9",
      cursor: "pointer",
    },
    notifTitle: { fontWeight: 600, fontSize: "14px" },
    notifTime: { fontSize: "12px", color: "#6b7280" },
    menuName: {
      fontWeight: 600,
      color: "#1e3a8a",
      fontSize: "15px",
      marginBottom: "10px",
    },
    logoutIcon: {
      fontSize: "22px",
      color: "#ef4444",
      cursor: "pointer",
      transition: "transform 0.2s ease, color 0.3s ease",
    },
  };

  return (
    <div style={styles.container}>
      {/* LEFT SIDE */}
      <div style={styles.leftSection}>
        <div
          style={styles.burger}
          onClick={onToggleSidebar}
          onMouseEnter={() => setHoverBurger(true)}
          onMouseLeave={() => setHoverBurger(false)}
        >
          <div style={{ position: "relative", height: "14px", width: "20px" }}>
            <div
              style={{
                ...styles.burgerLine,
                position: "absolute",
                top: 0,
                transform: sidebarOpen
                  ? "rotate(0deg)"
                  : "rotate(45deg) translate(3px, 4px)",
              }}
            />
            <div
              style={{
                ...styles.burgerLine,
                position: "absolute",
                top: "6px",
                opacity: sidebarOpen ? 1 : 0,
              }}
            />
            <div
              style={{
                ...styles.burgerLine,
                position: "absolute",
                bottom: 0,
                transform: sidebarOpen
                  ? "rotate(0deg)"
                  : "rotate(-45deg) translate(3px, -4px)",
              }}
            />
          </div>
        </div>

        {!sidebarOpen && <span style={styles.brandText}>TechJar</span>}
        <span style={styles.title}>{title}</span>
      </div>

      {/* RIGHT SIDE */}
      <div style={styles.rightSection}>
        <div style={{ position: 'relative' }}>
          <FaBell
            style={styles.bell}
            onClick={() => {
              const next = !notifOpen;
              setNotifOpen(next);
              if (next) fetchNotifications();
            }}
            onMouseEnter={() => setHoverBell(true)}
            onMouseLeave={() => setHoverBell(false)}
          />
          {notifications.filter((n) => !n.IS_READ).length > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff',
              borderRadius: '50%', padding: '2px 6px', fontSize: '12px', fontWeight: 700
            }}>{notifications.filter((n) => !n.IS_READ).length}</span>
          )}
        </div>

        <div className="user-menu" style={styles.userBtn} onClick={() => setShowMenu(!showMenu)}>
          <FaUserCircle size={24} />
          <span style={styles.userName}>
            {loadingProfile ? "Loading..." : profile?.fullName?.split(" ")[0] || "User"}
          </span>
        </div>

        {/* 🔽 Popup Menu */}
        {showMenu && (
          <div style={styles.menu}>
            <div style={styles.menuName}>{profile?.fullName || "John Doe"}</div>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              {profile?.email || "—"}
            </p>
            <p style={{ margin: "6px 0 12px", fontSize: "12px", color: "#10b981" }}>
              {profile?.role || ""}
            </p>
            {profileError && (
              <p style={{ color: "#ef4444", fontSize: "12px", textAlign: "center" }}>{profileError}</p>
            )}
            <FaSignOutAlt
              style={styles.logoutIcon}
              title="Logout"
              onClick={handleLogout}
              onMouseEnter={(e) => (e.target.style.color = "#dc2626")}
              onMouseLeave={(e) => (e.target.style.color = "#ef4444")}
            />
          </div>
        )}
        {/* Notifications dropdown */}
        {notifOpen && (
          <div style={styles.notifMenu}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong>Notifications</strong>
              <button onClick={async () => { try { await apiRequest('/api/notifications', { method: 'DELETE' }); setNotifications([]); } catch(e){ console.error(e); } }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Clear</button>
            </div>
            {notifLoading ? (
              <div style={{ padding: 12 }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 12, color: '#6b7280' }}>No notifications</div>
            ) : (
              notifications.map((n) => (
                <div key={n.ID} style={{ ...styles.notifItem, background: n.IS_READ ? '#fff' : '#f8fafc' }} onClick={async () => { try { await apiRequest(`/api/notifications/${n.ID}/read`, { method: 'PUT' }); setNotifications(prev => prev.map(p => p.ID === n.ID ? { ...p, IS_READ: true } : p)); } catch(e){ console.error(e); } }}>
                  <div style={styles.notifTitle}>{n.TITLE}</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{n.BODY}</div>
                  <div style={styles.notifTime}>{n.CREATED_AT ? new Date(n.CREATED_AT).toLocaleString() : ''}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
