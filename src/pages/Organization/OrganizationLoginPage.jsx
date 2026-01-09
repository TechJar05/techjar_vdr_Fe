import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GlobalInputStyle from "../../components/Style/GlobalInputStyle";
import BottomLine from "../../components/Style/BottomLine";
import loader from "../../assets/GIF/loader.gif";
import coverPattern from "../../assets/images/cover-pattern.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faEnvelope,
  faLock,
  faShieldHalved,
  faArrowRight,
  faCommentDots,
  faExclamationTriangle,
  faCalendarXmark,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";

export default function OrganizationLoginPage() {
  const [step, setStep] = useState("login"); // login, otp, plan-required, plan-expired
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const otpRefs = useRef([]);
  const nav = useNavigate();

  const toastMsg = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtp = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const copy = [...otp];
    copy[i] = v;
    setOtp(copy);
    if (v && i < 5) otpRefs.current[i + 1].focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1].focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toastMsg("Email is required!", "error");
      return;
    }
    if (!formData.password) {
      toastMsg("Password is required!", "error");
      return;
    }

    setLoading(true);

    // Simulate API call - will be replaced with actual backend integration
    setTimeout(() => {
      setLoading(false);

      // Simulate checking organization from backend
      // In real implementation, this would come from your API
      const mockOrgData = {
        organizationName: "Demo Organization",
        email: formData.email,
        planStatus: "active", // can be: "active", "not_purchased", "expired"
        planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        plan: {
          planName: "Quarterly",
          duration: "3 Months",
        }
      };

      setOrgData(mockOrgData);
      toastMsg("OTP sent to your email!");
      setStep("otp");
    }, 1500);
  };

  const handleOtpVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toastMsg("Please enter the 6-digit OTP", "error");
      return;
    }

    setLoading(true);

    // Simulate OTP verification and plan check
    setTimeout(() => {
      setLoading(false);

      // Check plan status after successful OTP verification
      // In real implementation, this data comes from your backend

      // Simulating different scenarios - change planStatus to test:
      // "active" - has active plan
      // "not_purchased" - registered but never purchased
      // "expired" - plan has expired

      const planStatus = orgData?.planStatus || "active";

      if (planStatus === "not_purchased") {
        setStep("plan-required");
      } else if (planStatus === "expired") {
        setStep("plan-expired");
      } else {
        // Plan is active - store org session and redirect to user login
        localStorage.setItem("activeOrg", JSON.stringify({
          ...orgData,
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
        }));

        toastMsg("Login successful!");
        setTimeout(() => nav("/"), 1500);
      }
    }, 1500);
  };

  const resendOtp = async () => {
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toastMsg("OTP resent successfully!");
    }, 1000);
  };

  const backToLogin = () => {
    setStep("login");
    setOtp(["", "", "", "", "", ""]);
  };

  const goToPlans = () => {
    // Store org data for plan purchase
    localStorage.setItem("orgSession", JSON.stringify(orgData));
    nav("/org/plans");
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

      {/* Plan Required Screen */}
      {step === "plan-required" && (
        <div style={styles.statusContainer}>
          <div style={styles.statusIconWrapper}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={styles.statusIconWarning} />
          </div>
          <h1 style={styles.statusTitle}>Plan Required</h1>
          <p style={styles.statusMessage}>
            Your organization <strong>{orgData?.organizationName}</strong> has not purchased a plan yet.
            Please purchase a plan to access the VDR platform.
          </p>

          <div style={styles.statusInfo}>
            <div style={styles.statusInfoItem}>
              <FontAwesomeIcon icon={faBuilding} style={styles.statusInfoIcon} />
              <span>{orgData?.organizationName}</span>
            </div>
            <div style={styles.statusInfoItem}>
              <FontAwesomeIcon icon={faEnvelope} style={styles.statusInfoIcon} />
              <span>{orgData?.email}</span>
            </div>
          </div>

          <button style={styles.primaryBtnLarge} onClick={goToPlans}>
            Purchase Plan
            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 10 }} />
          </button>

          <p style={styles.backText} onClick={backToLogin}>
            Back to Login
          </p>
        </div>
      )}

      {/* Plan Expired Screen */}
      {step === "plan-expired" && (
        <div style={styles.statusContainer}>
          <div style={{ ...styles.statusIconWrapper, background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)" }}>
            <FontAwesomeIcon icon={faCalendarXmark} style={styles.statusIconError} />
          </div>
          <h1 style={styles.statusTitle}>Plan Expired</h1>
          <p style={styles.statusMessage}>
            Your organization's plan has expired. Please renew your subscription to continue using VDR.
          </p>

          <div style={styles.statusInfo}>
            <div style={styles.statusInfoItem}>
              <FontAwesomeIcon icon={faBuilding} style={styles.statusInfoIcon} />
              <span>{orgData?.organizationName}</span>
            </div>
            <div style={styles.statusInfoItem}>
              <FontAwesomeIcon icon={faCalendarXmark} style={{ ...styles.statusInfoIcon, color: "#ef4444" }} />
              <span style={{ color: "#ef4444" }}>
                Expired on {new Date(orgData?.planExpiry).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button style={{ ...styles.primaryBtnLarge, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }} onClick={goToPlans}>
            Renew Plan
            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 10 }} />
          </button>

          <p style={styles.backText} onClick={backToLogin}>
            Back to Login
          </p>
        </div>
      )}

      {/* Login and OTP screens */}
      {(step === "login" || step === "otp") && (
        <div style={styles.container}>
          {/* Left Side - Branding */}
          <div style={styles.leftSection}>
            <div style={styles.brandContent}>
              <div style={styles.logoWrapper}>
                <FontAwesomeIcon icon={faBuilding} style={styles.logoIcon} />
                <span style={styles.logoText}>VDR</span>
              </div>
              <h1 style={styles.brandTitle}>Organization Login</h1>
              <p style={styles.brandSubtitle}>
                Sign in to your organization account to access your virtual data room.
              </p>

              <div style={styles.securityBadge}>
                <FontAwesomeIcon icon={faShieldHalved} style={styles.securityIcon} />
                <div>
                  <p style={styles.securityTitle}>Enterprise Security</p>
                  <p style={styles.securityText}>256-bit encryption & 2FA enabled</p>
                </div>
              </div>
            </div>

            <div style={styles.decorCircle1} />
            <div style={styles.decorCircle2} />
          </div>

          {/* Right Side - Form */}
          <div style={styles.rightSection}>
            <div style={styles.formContainer}>
              {/* Login Form */}
              {step === "login" && (
                <>
                  <h2 style={styles.formTitle}>Sign In</h2>
                  <p style={styles.formSubtitle}>Enter your organization credentials</p>
                  <BottomLine style={{ borderBottom: "2px solid #e5e7eb", margin: "0 0 28px 0" }} />

                  <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        <FontAwesomeIcon icon={faEnvelope} style={styles.labelIcon} />
                        Organization Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your organization email"
                        value={formData.email}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        <FontAwesomeIcon icon={faLock} style={styles.labelIcon} />
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <button type="submit" style={styles.primaryBtn}>
                      Continue
                      <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 10 }} />
                    </button>
                  </form>
                </>
              )}

              {/* OTP Verification */}
              {step === "otp" && (
                <>
                  <div style={styles.otpIconWrapper}>
                    <FontAwesomeIcon icon={faCommentDots} style={styles.otpIconLarge} />
                  </div>
                  <h2 style={styles.formTitleCenter}>Verify Your Identity</h2>
                  <p style={styles.otpDescription}>
                    We've sent a 6-digit verification code to<br />
                    <strong>{formData.email}</strong>
                  </p>

                  <div style={styles.otpInputRow}>
                    {otp.map((v, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength="1"
                        value={v}
                        ref={(el) => (otpRefs.current[i] = el)}
                        onChange={(e) => handleOtp(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        style={styles.otpInput}
                      />
                    ))}
                  </div>

                  <button onClick={handleOtpVerify} style={styles.primaryBtn}>
                    Verify & Continue
                  </button>

                  <div style={styles.otpFooter}>
                    <p style={styles.otpFooterText}>
                      Didn't receive the code?{" "}
                      <span style={styles.link} onClick={resendOtp}>Resend</span>
                    </p>
                    <p style={styles.otpFooterText}>
                      <span style={styles.link} onClick={backToLogin}>Back to Sign In</span>
                    </p>
                  </div>
                </>
              )}

              <div style={styles.footer}>
                <p style={styles.footerText}>
                  Don't have an organization?{" "}
                  <span style={styles.link} onClick={() => nav("/org/register")}>
                    Register Now
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
    right: "-5%",
    filter: "blur(60px)",
    zIndex: 0,
  },
  circleTwo: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.1)",
    bottom: "15%",
    left: "5%",
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
  // Status screens (plan required / expired)
  statusContainer: {
    background: "#fff",
    borderRadius: "24px",
    padding: "50px 45px",
    textAlign: "center",
    maxWidth: "480px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    zIndex: 1,
  },
  statusIconWrapper: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #fefce8 0%, #fef08a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    boxShadow: "0 8px 24px rgba(245, 158, 11, 0.2)",
  },
  statusIconWarning: {
    fontSize: "40px",
    color: "#f59e0b",
  },
  statusIconError: {
    fontSize: "40px",
    color: "#ef4444",
  },
  statusTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "12px",
  },
  statusMessage: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: 1.7,
    marginBottom: "24px",
  },
  statusInfo: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "24px",
  },
  statusInfoItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 0",
    fontSize: "14px",
    color: "#374151",
  },
  statusInfoIcon: {
    color: "#6b7280",
    fontSize: "14px",
    width: "20px",
  },
  primaryBtnLarge: {
    padding: "16px 40px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
    width: "100%",
  },
  backText: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#6b7280",
    cursor: "pointer",
  },
  // Main container
  container: {
    display: "flex",
    width: "90%",
    maxWidth: "950px",
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    zIndex: 1,
    minHeight: "520px",
  },
  leftSection: {
    width: "42%",
    background: "linear-gradient(180deg, #1e3a8a 0%, #0f766e 100%)",
    padding: "50px 40px",
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
    gap: "12px",
    marginBottom: "30px",
  },
  logoIcon: {
    fontSize: "28px",
    color: "#10b981",
  },
  logoText: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "2px",
  },
  brandTitle: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "16px",
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.7,
    marginBottom: "40px",
  },
  securityBadge: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
  },
  securityIcon: {
    fontSize: "24px",
    color: "#10b981",
  },
  securityTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "4px",
  },
  securityText: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
  },
  decorCircle1: {
    position: "absolute",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    bottom: "-60px",
    right: "-60px",
  },
  decorCircle2: {
    position: "absolute",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.08)",
    bottom: "-30px",
    right: "-30px",
  },
  rightSection: {
    width: "58%",
    padding: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
  },
  formContainer: {
    width: "100%",
    maxWidth: "380px",
  },
  formTitle: {
    fontSize: "26px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "8px",
  },
  formTitleCenter: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "12px",
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
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
    padding: "14px 16px",
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
  otpIconWrapper: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
  },
  otpIconLarge: {
    fontSize: "28px",
    color: "#10b981",
  },
  otpDescription: {
    textAlign: "center",
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: 1.6,
    marginBottom: "28px",
  },
  otpInputRow: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "28px",
  },
  otpInput: {
    width: "50px",
    height: "54px",
    textAlign: "center",
    fontSize: "20px",
    fontWeight: "600",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s ease",
    background: "#fafafa",
  },
  otpFooter: {
    textAlign: "center",
    marginTop: "24px",
  },
  otpFooterText: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  footer: {
    marginTop: "28px",
    textAlign: "center",
    paddingTop: "20px",
    borderTop: "1px solid #f3f4f6",
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
