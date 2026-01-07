import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const BackButton = () => {
  const navigate = useNavigate();

  const styles = {
    button: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "35px",
      height: "35px",
      borderRadius: "50%",    
      border: "none",
      backgroundColor: "#10b981",
      color: "#fff",
      cursor: "pointer",
      transition: "all 0.1s ease",
    },
    hover: {
      backgroundColor: "#0f766e",
      transform: "scale(1)",
    },
  };

  const [hover, setHover] = React.useState(false);

  return (
    <button
      style={{ ...styles.button, ...(hover ? styles.hover : {}) }}
      onClick={() => navigate(-1)} // Go back
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Go Back"
    >
      <FaArrowLeft />
    </button>
  );
};

export default BackButton;
