import React from "react";

const ToastBar = ({ type = "success", message }) => {
  const baseColor =
    type === "success"
      ? { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#065f46" }
      : { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#7f1d1d" };

  const styles = {
    container: {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: `linear-gradient(135deg, ${baseColor.bg}, rgba(255,255,255,0.25))`,
      color: baseColor.text,
      padding: "12px 20px",
      borderRadius: "10px",
      borderLeft: `5px solid ${baseColor.border}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      minWidth: "280px",
      maxWidth: "340px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 500,
      fontSize: "10px",
      zIndex: 1000,
      backdropFilter: "blur(8px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
      animation: "fadeSlideIn 0.4s ease forwards",
    },
    bar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: "4px",
      backgroundColor: baseColor.border,
      borderRadius: "2px",
    },
    message: {
      marginLeft: "8px",
      lineHeight: "1.4",
      textAlign: "center",
    },
    "@keyframes fadeSlideIn": {
      from: { opacity: 0, transform: "translate(-50%, -10px)" },
      to: { opacity: 1, transform: "translate(-50%, 0)" },
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.bar}></div>
      <div style={styles.message}>{message}</div>
    </div>
  );
};

export default ToastBar;
