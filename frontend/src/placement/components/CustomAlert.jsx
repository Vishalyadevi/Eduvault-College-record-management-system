import React, { useEffect, useState } from "react";
import "../styles/CustomAlert.css"; // Import the CSS file

const CustomAlert = ({ message, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);

      // Hide alert after 3 seconds
      const timer = setTimeout(() => {
        setShow(false);
        onClose(); // Callback to clear message
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return message ? (
    <div className="alert-overlay">
      {message}
    </div>
  ) : null;
};

export default CustomAlert;
