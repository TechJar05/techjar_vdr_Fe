import React from "react";

const Spinner = ({ size = 24, color = "white" }) => {
  const styles = {
    spinner: {
      width: size,
      height: size,
      border: `3px solid rgba(255,255,255,0.3)`,
      borderTop: `3px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    "@keyframes spin": {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
  };

  return (
    <div
      style={{
        ...styles.spinner,
        animation: "spin 1s linear infinite",
      }}
    />
  );
};

export default Spinner;
