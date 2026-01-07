import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginLayout from "../../components/Layout/LoginLayout";
import BottomLine from "../../components/Style/BottomLine";
import loader from "../../assets/GIF/loader.gif";
import { API_BASE_URL } from "../../config/apiConfig";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [role, setRole] = useState("user");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const toastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPass) {
      toastMsg("All fields are required!");
      return;
    }
    if (password !== confirmPass) {
      toastMsg("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      toastMsg("✅ Registration Successful!");
      setTimeout(() => nav("/"), 1500);
    } catch (err) {
      toastMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginLayout>
      {toast && <div style={styles.toast}>{toast}</div>}
      {loading && (
        <div style={styles.loaderOverlay}>
          <img src={loader} alt="Loading..." style={styles.loaderImg} />
        </div>
      )}

      <h2 style={styles.heading}>Create Account</h2>
      <BottomLine
        style={{ borderBottom: "3px solid #ccc", marginBottom: "19px" }}
      />

      <form onSubmit={handleRegister} style={styles.form}>
        <label style={styles.label}>Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={styles.input}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" style={styles.primaryBtn}>
          Register
        </button>
      </form>

      <p style={styles.signInText} onClick={() => nav("/")}>
        Already have an account? <span style={styles.link}>Sign In</span>
      </p>
    </LoginLayout>
  );
}

const styles = {
  toast: {
    position: "fixed",
    top: 15,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#10b981",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    zIndex: 1000,
  },
  loaderOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  loaderImg: {
    width: 80,
    height: 80,
  },
  heading: {
    fontSize: 20,
    fontWeight: 500,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: "#444",
    marginBottom: 3,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  input: {
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: 5,
    fontSize: 13,
    outline: "none",
  },
  primaryBtn: {
    border: "none",
    borderRadius: 6,
    padding: "8px 10px",
    fontWeight: 500,
    cursor: "pointer",
    background: "#10b981",
    color: "#fff",
    marginTop: 10,
    fontSize: 14,
    transition: "0.2s",
  },
  signInText: {
    textAlign: "center",
    fontSize: 13,
    color: "#333",
    marginTop: 12,
    cursor: "pointer",
  },
  link: {
    color: "#10b981",
    fontWeight: 500,
  },
};
