import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoginLayout from "../../components/Layout/LoginLayout";
import GlobalInputStyle from "../../components/Style/GlobalInputStyle";
import BottomLine from "../../components/Style/BottomLine";
import loader from "../../assets/GIF/loader.gif";
import { API_BASE_URL } from "../../config/apiConfig";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const [step, setStep] = useState("login");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "",""]);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);
  const nav = useNavigate();

  const toastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  // Step 1: Login request to trigger OTP
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return toastMsg("Enter your email!");
    if (!password) return toastMsg("Enter your password!");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        toastMsg("OTP sent to your email!");
        setStep("otp");
      } else {
        toastMsg(data.message || "Error sending OTP");
      }
    } catch (err) {
      console.error("Login error:", err);
      toastMsg("Server not responding!");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP handler
  const handleOtp = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const copy = [...otp];
    copy[i] = v;
    setOtp(copy);
    if (v && i < 5) otpRefs.current[i + 1].focus();
  };

  // Step 3: Verify OTP and login
  const handleOtpVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) return toastMsg("Enter 6-digit OTP");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await res.json();

      if (res.ok) {
        toastMsg("Login Successful!");
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        setTimeout(() => nav("/project"), 1500);
      } else {
        toastMsg(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      toastMsg("Server error during verification!");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
    await handleLogin({ preventDefault: () => {} });
  };

  const back = () => {
    setStep("login");
    setOtp(["", "", "", "", "", ""]);
  };

  // Forgot password - Request OTP
  const handleForgotPassword = async (e) => {
    e?.preventDefault();
    if (!email) return toastMsg("Enter your email!");

    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        toastMsg("Password reset OTP sent to your email!");
        setEmail(normalizedEmail); // Update state with normalized email
        setStep("forgot-otp");
      } else {
        toastMsg(data.message || "Error sending password reset OTP");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      toastMsg("Server not responding!");
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - Verify OTP and reset password
  const handleResetPassword = async () => {
    const otpValue = otp.join("").trim();
    if (otpValue.length !== 6) return toastMsg("Enter 6-digit OTP");
    if (!newPassword) return toastMsg("Enter new password!");
    if (newPassword.length < 6) return toastMsg("Password must be at least 6 characters!");
    if (newPassword !== confirmPassword) return toastMsg("Passwords do not match!");

    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: normalizedEmail, 
          otp: otpValue, 
          newPassword, 
          confirmPassword 
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toastMsg("Password reset successfully!");
        setTimeout(() => {
          setStep("login");
          setOtp(["", "", "", "", "", ""]);
          setNewPassword("");
          setConfirmPassword("");
        }, 1500);
      } else {
        toastMsg(data.message || "Error resetting password");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      toastMsg("Server error during password reset!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginLayout>
      <GlobalInputStyle />

      {toast && <div style={styles.toast}>{toast}</div>}
      {loading && (
        <div style={styles.loaderOverlay}>
          <img src={loader} alt="Loading..." style={styles.loaderImg} />
        </div>
      )}

      {/* LOGIN SCREEN */}
      {step === "login" && (
        <>
          <h2 style={styles.heading}>Sign In Here!</h2>
          <BottomLine style={{ borderBottom: "2px solid #9ca3af", margin: "0 0 25px 0" }} />
          <form onSubmit={handleLogin} style={styles.form}>
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn}>
              Send OTP
            </button>
          </form>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={styles.forgotText} onClick={() => nav("/register")}>
              New Register
            </p>
            <p style={styles.forgotText} onClick={() => setStep("forgot-email")}>
              Forgot password?
            </p>
          </div>
        </>
      )}

      {/* OTP SCREEN */}
      {step === "otp" && (
        <>
          <div style={styles.iconWrapper}>
            <FontAwesomeIcon icon={faCommentDots} style={styles.otpIcon} />
          </div>
          <h3 style={styles.centerText}>Verify Your Account</h3>
          <p style={styles.otpInfo}>
            Please enter the 6-digit code sent to <b>{email}</b>
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
                style={styles.otpInput}
              />
            ))}
          </div>
          <div style={styles.centerBox}>
            <button onClick={handleOtpVerify} style={styles.primaryBtn}>
              Confirm
            </button>
          </div>
          <div style={styles.centerBox}>
            <p style={styles.otpText}>
              Didn't receive a code?{" "}
              <span style={styles.link} onClick={resend}>
                Resend
              </span>
            </p>
            <p style={styles.otpText}>
              Back to Sign In?{" "}
              <span style={styles.link} onClick={back}>
                Click Here
              </span>
            </p>
          </div>
        </>
      )}

      {/* FORGOT PASSWORD - EMAIL SCREEN */}
      {step === "forgot-email" && (
        <>
          <h2 style={styles.heading}>Reset Password</h2>
          <BottomLine style={{ borderBottom: "2px solid #9ca3af", margin: "0 0 25px 0" }} />
          <form onSubmit={handleForgotPassword} style={styles.form}>
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn}>
              Send Reset OTP
            </button>
          </form>
          <div style={styles.centerBox}>
            <p style={styles.otpText}>
              Remember your password?{" "}
              <span style={styles.link} onClick={() => setStep("login")}>
                Back to Login
              </span>
            </p>
          </div>
        </>
      )}

      {/* FORGOT PASSWORD - OTP & NEW PASSWORD SCREEN */}
      {step === "forgot-otp" && (
        <>
          <div style={styles.iconWrapper}>
            <FontAwesomeIcon icon={faCommentDots} style={styles.otpIcon} />
          </div>
          <h3 style={styles.centerText}>Reset Your Password</h3>
          <p style={styles.otpInfo}>
            Please enter the 6-digit code sent to <b>{email}</b>
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
                style={styles.otpInput}
              />
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} style={styles.form}>
            <label>New Password</label>
            <input
              type="password"
              required
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
            />
            <label>Confirm Password</label>
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn}>
              Reset Password
            </button>
          </form>
          <div style={styles.centerBox}>
            <p style={styles.otpText}>
              Didn't receive a code?{" "}
              <span style={styles.link} onClick={handleForgotPassword}>
                Resend
              </span>
            </p>
            <p style={styles.otpText}>
              Back to Sign In?{" "}
              <span style={styles.link} onClick={() => { setStep("login"); setOtp(["", "", "", "", "", ""]); setNewPassword(""); setConfirmPassword(""); }}>
                Click Here
              </span>
            </p>
          </div>
        </>
      )}
    </LoginLayout>
  );
}

const styles = {
  toast: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#10b981",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 8,
    zIndex: 1000,
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  loaderOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.25)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    backdropFilter: "blur(3px)",
  },
  loaderImg: {
    width: 120,
    height: 120,
    borderRadius: "50%",
  },
  heading: {
    fontSize: 24,
    fontWeight: 500,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  input: {
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
  },
  primaryBtn: {
    border: "none",
    borderRadius: 8,
    padding: 10,
    fontWeight: 500,
    cursor: "pointer",
    background: "#10b981",
    color: "#fff",
    marginTop: 10,
  },
  forgotText: {
    textAlign: "right",
    fontSize: 13,
    color: "#2563eb",
    cursor: "pointer",
    marginTop: 10,
  },
  iconWrapper: {
    background: "#f0f9f9",
    borderRadius: "50%",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  },
  otpIcon: {
    fontSize: 22,
    color: "#10b981",
  },
  centerText: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "500",
    color: "#111827",
  },
  otpInfo: {
    textAlign: "center",
    color: "#555",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  otpInputRow: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginBottom: 25,
  },
  otpInput: {
    width: 52,
    height: 52,
    textAlign: "center",
    fontSize: 20,
    border: "1.5px solid #d1d5db",
    borderRadius: 10,
    outline: "none",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  },
  centerBox: {
    textAlign: "center",
    marginTop: 10,
  },
  otpText: {
    fontSize: "13px",
    color: "#444",
    marginBottom: 6,
  },
  link: {
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 500,
  },
  backLink: {
    color: "#2563eb",
    textAlign: "center",
    cursor: "pointer",
    marginTop: 10,
  },
};
