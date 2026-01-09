import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlobalInputStyle from "../../components/Style/GlobalInputStyle";
import BottomLine from "../../components/Style/BottomLine";
import loader from "../../assets/GIF/loader.gif";
import coverPattern from "../../assets/images/cover-pattern.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faEnvelope,
  faPhone,
  faGlobe,
  faMapMarkerAlt,
  faArrowRight,
  faCheckCircle,
  faShieldHalved,
  faUsers,
  faFolderOpen,
  faLock
} from "@fortawesome/free-solid-svg-icons";

export default function OrganizationRegisterPage() {
  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
  });
  const [toast, setToast] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const toastMsg = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.organizationName.trim()) {
      toastMsg("Organization name is required!", "error");
      return false;
    }
    if (!formData.email.trim()) {
      toastMsg("Email is required!", "error");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toastMsg("Please enter a valid email!", "error");
      return false;
    }
    if (!formData.phone.trim()) {
      toastMsg("Phone number is required!", "error");
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    // Simulate API call - will be replaced with actual backend integration
    setTimeout(() => {
      setLoading(false);
      // Store organization data temporarily
      localStorage.setItem("pendingOrg", JSON.stringify({
        organizationName: formData.organizationName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
      }));
      toastMsg("Organization registered! Select a plan to continue.");
      setTimeout(() => nav("/org/plans"), 1200);
    }, 1500);
  };

  return (
    <div style={styles.mainContainer}>
      <GlobalInputStyle />
      <div style={styles.circleOne} />
      <div style={styles.circleTwo} />

      {toast.message && (
        <div style={{
          ...styles.toast,
          background: toast.type === "error" ? "#ef4444" : "#10b981"
        }}>
          {toast.message}
        </div>
      )}

      {loading && (
        <div style={styles.loaderOverlay}>
          <img src={loader} alt="Loading..." style={styles.loaderImg} />
        </div>
      )}

      <div style={styles.container}>
        {/* Left Side - Branding */}
        <div style={styles.leftSection}>
          <div style={styles.brandContent}>
            <div style={styles.logoWrapper}>
              <FontAwesomeIcon icon={faBuilding} style={styles.logoIcon} />
              <span style={styles.logoText}>VDR</span>
            </div>
            <h1 style={styles.brandTitle}>Register Your Organization</h1>
            <p style={styles.brandSubtitle}>
              Set up your organization to start using our secure virtual data room platform.
            </p>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <div style={styles.featureIconWrapper}>
                  <FontAwesomeIcon icon={faFolderOpen} style={styles.featureIcon} />
                </div>
                <div>
                  <p style={styles.featureTitle}>Secure Document Storage</p>
                  <p style={styles.featureDesc}>Store and manage all your files securely</p>
                </div>
              </div>
              <div style={styles.featureItem}>
                <div style={styles.featureIconWrapper}>
                  <FontAwesomeIcon icon={faUsers} style={styles.featureIcon} />
                </div>
                <div>
                  <p style={styles.featureTitle}>Team Collaboration</p>
                  <p style={styles.featureDesc}>Add admins and users to your organization</p>
                </div>
              </div>
              <div style={styles.featureItem}>
                <div style={styles.featureIconWrapper}>
                  <FontAwesomeIcon icon={faShieldHalved} style={styles.featureIcon} />
                </div>
                <div>
                  <p style={styles.featureTitle}>Enterprise Security</p>
                  <p style={styles.featureDesc}>256-bit encryption & access controls</p>
                </div>
              </div>
              <div style={styles.featureItem}>
                <div style={styles.featureIconWrapper}>
                  <FontAwesomeIcon icon={faLock} style={styles.featureIcon} />
                </div>
                <div>
                  <p style={styles.featureTitle}>Role-Based Access</p>
                  <p style={styles.featureDesc}>Control who sees what in your data room</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div style={styles.rightSection}>
          <div style={styles.formContainer}>
            <h2 style={styles.formTitle}>Organization Details</h2>
            <p style={styles.formSubtitle}>Enter your company information to get started</p>
            <BottomLine style={{ borderBottom: "2px solid #e5e7eb", margin: "0 0 28px 0" }} />

            <form onSubmit={handleRegister} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <FontAwesomeIcon icon={faBuilding} style={styles.labelIcon} />
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="organizationName"
                  placeholder="Enter your company name"
                  value={formData.organizationName}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <FontAwesomeIcon icon={faEnvelope} style={styles.labelIcon} />
                  Business Email *
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="company@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <FontAwesomeIcon icon={faPhone} style={styles.labelIcon} />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <FontAwesomeIcon icon={faGlobe} style={styles.labelIcon} />
                  Website (Optional)
                </label>
                <input
                  type="url"
                  name="website"
                  placeholder="https://www.yourcompany.com"
                  value={formData.website}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={styles.labelIcon} />
                  Address (Optional)
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="City, Country"
                  value={formData.address}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <button type="submit" style={styles.primaryBtn}>
                Continue to Plans
                <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 10 }} />
              </button>
            </form>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                Already registered?{" "}
                <span style={styles.link} onClick={() => nav("/org/login")}>
                  Sign In
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer style={styles.copyright}>© 2024 VDR. All rights reserved.</footer>
    </div>
  );
}

const styles = {
  mainContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    backgroundImage: `linear-gradient(135deg, rgba(30,58,138,0.97), rgba(15,118,110,0.95)), url(${coverPattern})`,
    backgroundRepeat: "repeat",
    backgroundSize: "cover, contain",
    backgroundBlendMode: "overlay",
    backgroundAttachment: "fixed",
  },
  circleOne: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    top: "-5%",
    left: "-5%",
    filter: "blur(60px)",
    zIndex: 0,
  },
  circleTwo: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.1)",
    bottom: "10%",
    right: "5%",
    filter: "blur(50px)",
    zIndex: 0,
  },
  toast: {
    position: "fixed",
    top: 24,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 10,
    zIndex: 3000,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    fontSize: 14,
    fontWeight: 500,
  },
  loaderOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    backdropFilter: "blur(4px)",
  },
  loaderImg: {
    width: 100,
    height: 100,
    borderRadius: "50%",
  },
  container: {
    display: "flex",
    width: "90%",
    maxWidth: "1050px",
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    zIndex: 1,
    minHeight: "580px",
  },
  leftSection: {
    width: "45%",
    background: "linear-gradient(180deg, #1e3a8a 0%, #0f766e 100%)",
    padding: "45px 35px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  brandContent: {
    position: "relative",
    zIndex: 1,
  },
  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  logoIcon: {
    fontSize: "26px",
    color: "#10b981",
  },
  logoText: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "2px",
  },
  brandTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "12px",
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.6,
    marginBottom: "30px",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },
  featureIconWrapper: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "rgba(16, 185, 129, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureIcon: {
    color: "#10b981",
    fontSize: "16px",
  },
  featureTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "2px",
  },
  featureDesc: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
  },
  rightSection: {
    width: "55%",
    padding: "40px 45px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
  },
  formContainer: {
    width: "100%",
    maxWidth: "400px",
  },
  formTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "8px",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  labelIcon: {
    fontSize: "12px",
    color: "#6b7280",
  },
  input: {
    padding: "12px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    transition: "all 0.2s ease",
    outline: "none",
    background: "#fafafa",
  },
  primaryBtn: {
    border: "none",
    borderRadius: "10px",
    padding: "14px 24px",
    fontWeight: "600",
    cursor: "pointer",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
    marginTop: "8px",
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  link: {
    color: "#10b981",
    fontWeight: "600",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
  copyright: {
    position: "absolute",
    bottom: "16px",
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: "13px",
    zIndex: 1,
  },
};
