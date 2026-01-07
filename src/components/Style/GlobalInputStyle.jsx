import { useEffect } from "react";

const GlobalInputStyle = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      input:hover, input:focus {
        border-color: #10b981 !important;
        box-shadow: 0 0 4px rgba(16,185,129,0.25);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        outline: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default GlobalInputStyle;
