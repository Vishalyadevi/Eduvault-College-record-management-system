import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaGraduationCap, FaBullseye } from "react-icons/fa";
import { motion } from "framer-motion";
import './VissionMissionSection.css';

// Types
interface LeadershipData {
  name: string;
  title: string;
}

// Image and name data
const images: string[] = [
  "https://nec.edu.in/wp-content/uploads/2025/02/founder510x480.webp",
  "https://nec.edu.in/wp-content/uploads/2025/02/Correspondent510x480.webp",
  "https://nec.edu.in/wp-content/uploads/2025/02/Director510x480.webp",
  "https://nec.edu.in/wp-content/uploads/2025/02/Principal-510x480-1-768x722.webp",
];

const names: LeadershipData[] = [
  { name: "Thiru. K. Ramasamy", title: "FOUNDER" },
  { name: "Thiru. K.R. Arunachalam", title: "CORRESPONDENT" },
  { name: "Dr. S. Shanmugavel", title: "DIRECTOR" },
  { name: "Dr. K. Kalidasa Murugavel", title: "PRINCIPAL" },
];

const VisionMissionSection: React.FC = () => {
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const prevSlide = (): void => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextSlide = (): void => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number): void => {
    setCurrent(index);
  };

  return (
    <div className="vision-mission-container">
      {/* Academic corner decorations */}
      <div className="academic-corner top-left"></div>
      <div className="academic-corner bottom-right"></div>
      
      {/* Extra gear decoration */}
      <div className="extra-gear"></div>

      {/* Single integrated card */}
      <motion.div
        className="vision-mission-integrated-card"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        viewport={{ once: false, amount: 0.3 }}
      >
        <div className="card-inner-wrapper">
          {/* Left: Vision & Mission */}
          <div className="vision-mission-text-content">
            <div className="vision-mission-card">

              {/* Vision Section */}
              <div>
                <h2 className="section-heading vision-title">
                  <span className="heading-icon"><FaGraduationCap /></span>
                  Vision
                </h2>
                <p className="vision-description">
                  Transforming lives through quality education and research with human values.
                </p>
              </div>

              {/* Mission Section */}
              <div>
                <h2 className="section-heading mission-title">
                  <span className="heading-icon"><FaBullseye /></span>
                  Mission
                </h2>
                <ul className="mission-list">
                  <li className="mission-item">
                    <div className="tick-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.19 9.205-4.548-4.548a1 1 0 1 0-1.414 1.414l5.255 5.255a1 1 0 0 0 1.414 0l9.897-9.908z" />
                      </svg>
                    </div>
                    <span>To maintain excellent infrastructure and highly qualified and dedicated faculty.</span>
                  </li>
                  <li className="mission-item">
                    <div className="tick-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.19 9.205-4.548-4.548a1 1 0 1 0-1.414 1.414l5.255 5.255a1 1 0 0 0 1.414 0l9.897-9.908z" />
                      </svg>
                    </div>
                    <span>To provide a conducive environment with an ambiance of humanity, wisdom, creativity, and team spirit.</span>
                  </li>
                  <li className="mission-item">
                    <div className="tick-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.19 9.205-4.548-4.548a1 1 0 1 0-1.414 1.414l5.255 5.255a1 1 0 0 0 1.414 0l9.897-9.908z" />
                      </svg>
                    </div>
                    <span>To promote the values of ethical behavior and commitment to the society.</span>
                  </li>
                  <li className="mission-item">
                    <div className="tick-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.19 9.205-4.548-4.548a1 1 0 1 0-1.414 1.414l5.255 5.255a1 1 0 0 0 1.414 0l9.897-9.908z" />
                      </svg>
                    </div>
                    <span>To partner with academic, industrial, and government entities to attain collaborative research.</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Right: Leadership Carousel */}
          <div className="leadership-image-container">
            <div className="leadership-carousel">
              <img
                key={current}
                src={images[current]}
                alt="College Leadership"
                className="leadership-image"
              />

              {/* Name Badge */}
              <div className="leadership-badge">
                <div className="leadership-name">{names[current].name}</div>
                <div className="leadership-title">{names[current].title}</div>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={prevSlide}
                className="carousel-nav-btn prev"
                aria-label="Previous leader"
                type="button"
              >
                <FaChevronLeft size={18} />
              </button>
              <button
                onClick={nextSlide}
                className="carousel-nav-btn next"
                aria-label="Next leader"
                type="button"
              >
                <FaChevronRight size={18} />
              </button>

              {/* Progress Indicators */}
              <div className="carousel-indicators">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`indicator-dot ${index === current ? 'active' : ''}`}
                    aria-label={`Go to slide ${index + 1}`}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VisionMissionSection;