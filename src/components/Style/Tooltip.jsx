import React, { useState } from "react";

const Tooltip = ({ text, children, position = "top" }) => {
  const [visible, setVisible] = useState(false);

  const getPositionStyle = () => {
    switch (position) {
      case "bottom":
        return { top: "120%", left: "50%", transform: "translateX(-50%)" };
      case "left":
        return { top: "50%", right: "120%", transform: "translateY(-50%)" };
      case "right":
        return { top: "50%", left: "120%", transform: "translateY(-50%)" };
      default:
        return { bottom: "120%", left: "50%", transform: "translateX(-50%)" };
    }
  };

  return (
    <div
      style={styles.wrapper}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div style={{ ...styles.tooltip, ...getPositionStyle() }}>
          {text}
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    position: "relative",
    display: "inline-block",
    cursor: "pointer",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#111827",
    color: "#fff",
    fontSize: "12px",
    padding: "6px 10px",
    borderRadius: "6px",
    whiteSpace: "nowrap",
    boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
    zIndex: 5,
    opacity: 1,
  },
};

export default Tooltip;
