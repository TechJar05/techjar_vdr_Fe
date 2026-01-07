import React from "react";

const BottomLine = ({ style }) => {
  const defaultStyle = {
    marginLeft: "15px",
    marginRight: "15px",
   borderBottom: "2px solid #10b981", 
    borderRadius: "5px", 
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", 
    transition: "box-shadow 0.3s ease",
    marginBottom: "20px",
  };

  return <div style={{ ...defaultStyle, ...style }} />;
};

export default BottomLine;
