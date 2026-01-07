import React from "react";
import loginImage from "../../assets/images/27795.jpg";
import coverPattern from "../../assets/images/cover-pattern.png";

const LoginLayout = ({ children }) => {
  return (
    <div style={styles.mainContainer}>
      <div style={styles.circleOne} />
      <div style={styles.circleTwo} />

      <div style={styles.loginContainer}>
        <div style={styles.leftImageSection}>
          <div style={styles.logoText}>VDR</div>
        </div>

        <div style={styles.rightFormSection}>
          <div style={styles.formWrapper}>{children}</div>
        </div>
      </div>
      <footer style={styles.footer}>© 2024 VDR.</footer>
    </div>
  );
};

const styles = {
  mainContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    backgroundImage: `linear-gradient(135deg, rgba(30,58,138,0.95), rgba(15,118,110,0.95)), url(${coverPattern})`,
    backgroundRepeat: "repeat",
    backgroundSize: "cover, contain",
    backgroundBlendMode: "overlay",
    backgroundAttachment: "fixed",
  },
  circleOne: {
    position: "absolute",
    width: "380px",
    height: "380px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
    top: "8%",
    left: "8%",
    filter: "blur(50px)",
    zIndex: 0,
  },
  circleTwo: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.04)",
    bottom: "10%",
    right: "12%",
    filter: "blur(50px)",
    zIndex: 0,
  },
  loginContainer: {
    display: "flex",
    width: "72%",
    maxWidth: "1000px",
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    zIndex: 3,
  },
  leftImageSection: {
    width: "58%",
    backgroundImage: `url(${loginImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
  },
  logoText: {
    position: "absolute",
    top: "20px",
    left: "30px",
    color: "#fff",
    fontWeight: "700",
    fontSize: "20px",
    letterSpacing: "1px",
    textShadow: "0px 2px 6px rgba(0,0,0,0.3)",
  },
  rightFormSection: {
    width: "50%",
    padding: "30px 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    transition: "all 0.4s ease",
  },
  // ✅ Compact consistent height for SignIn / OTP / Reset
  formWrapper: {
    width: "100%",
    // maxWidth: "360px",
    minHeight: "360px", 
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    bottom: "10px",
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
    zIndex: 3,
  },
};

export default LoginLayout;
