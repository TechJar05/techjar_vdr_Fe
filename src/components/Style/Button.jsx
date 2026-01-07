import React, { useState } from "react";

const Button = ({ text, icon, onClick, style, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyles = {
    background: disabled ? "#d1d5db" : isHovered ? "#0ea374" : "#10b981",
    color: disabled ? "#6b7280" : "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    textAlign: "center",
    width: "auto",
    height: "auto",
    boxShadow: disabled ? "none" : isHovered ? "0 2px 3px rgba(0,0,0,0.2)" : "none",
    ...style,
  };

  return (
    <button
      style={buttonStyles}
      onClick={onClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      {text}
    </button>
  );
};

export default Button;
