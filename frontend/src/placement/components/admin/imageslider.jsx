import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/ImageSlider.css"// Create this CSS file for styling
import Image1 from "../../assets/NEC-Front.jpg";
import Image2 from "../../assets/Website Banner.jpg";
import Image3 from "../../assets/firstyear.jpg";
import Image4 from "../../assets/website Banner2.jpeg";
import Image5 from "../../assets/website Banner3.jpg";

const images = [
  Image1,
  Image3,
  Image2,
  Image4,
  Image5
];

const ImageSlider = () => {
  const [index, setIndex] = useState(0);

  // Automatically change the image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="slider-container">
      <AnimatePresence>
        <motion.img
          key={index}
          src={images[index]}
          alt="Placement Batch"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="slider-image"
        />
      </AnimatePresence>
    </div>
  );
};

export default ImageSlider;
