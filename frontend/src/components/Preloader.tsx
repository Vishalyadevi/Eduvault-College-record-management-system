import React, { useEffect, useState } from 'react';

const Preloader: React.FC = () => {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-blue-900 to-blue-600 transition-opacity duration-2000 ${
        fadeIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <img
        src="https://nec.edu.in/wp-content/uploads/2024/01/NEC-LOGO1-unscreen.gif"
        alt="Loading..."
        className="w-[400px] h-auto animate-zoom"
      />
    </div>
  );
};

export default Preloader;
