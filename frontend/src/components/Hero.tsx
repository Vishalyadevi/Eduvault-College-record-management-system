import React, { useState, useEffect, useRef } from 'react';
import './image-slider.css';

const ImageSlider: React.FC = () => {
  const images: { src: string; showButtons?: boolean; title?: string; subtitle?: string; description?: string }[] = [
    { 
      src: '/images/11.jpg',
      title: 'Welcome to NEC',
      subtitle: 'National Engineering College',
      description: 'Excellence in Education'
    },
    { 
      src: '/images/12.jpg', 
      showButtons: true,
      title: 'Explore your Talent',
      subtitle: 'Talent is everywhere it only needs an opportunity',
      description: 'Create yours today'
    },
    { 
      src: '/images/13.jpg', 
      showButtons: true,
      title: 'Innovation & Research',
      subtitle: 'Leading the way in technology',
      description: 'Shape the future'
    },
    { 
      src: '/images/4.jpg', 
      showButtons: true,
      title: 'Campus Life',
      subtitle: 'A vibrant community of learners',
      description: 'Join us today'
    },
    { 
      src: '/images/5.jpg', 
      showButtons: true,
      title: 'World-Class Facilities',
      subtitle: 'State-of-the-art infrastructure',
      description: 'Experience excellence'
    },
    { 
      src: '/images/6.jpg', 
      showButtons: true,
      title: 'Career Opportunities',
      subtitle: 'Building successful careers',
      description: 'Your future starts here'
    },
  ];

  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  const handleVideoEnded = () => {
    setShowSlider(true);
    setCurrentIndex(0);
  };

  const startVideo = () => {
    setShowSlider(false);
    setCurrentIndex(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const nextSlide = () => {
    setAnimate(false);
    setTimeout(() => {
      if (!showSlider) {
        setShowSlider(true);
        setCurrentIndex(0);
      } else if (currentIndex === images.length - 1) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
      setAnimate(true);
    }, 10);
  };

  const prevSlide = () => {
    setAnimate(false);
    setTimeout(() => {
      if (!showSlider) return;

      if (currentIndex === 0) {
        setCurrentIndex(images.length - 1);
      } else {
        setCurrentIndex(currentIndex - 1);
      }
      setAnimate(true);
    }, 10);
  };

  useEffect(() => {
    if (showSlider) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, showSlider]);

  const handleDotClick = (index: number) => {
    if (index === 0) {
      startVideo();
    } else {
      setShowSlider(true);
      setCurrentIndex(index - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const getSlidePosition = (index: number) => {
    const diff = index - currentIndex;
    if (diff === 0) return 'active';
    if (diff === 1 || diff === -(images.length - 1)) return 'next';
    if (diff === -1 || diff === images.length - 1) return 'prev';
    if (diff === 2 || diff === -(images.length - 2)) return 'next-next';
    if (diff === -2 || diff === images.length - 2) return 'prev-prev';
    return 'hidden';
  };

  return (
    <div className={`slider ${!showSlider ? 'video-mode' : ''}`}>
      {/* 🔹 Video */}
      {!showSlider && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          className="background-video"
        >
          <source
            src="https://nec.edu.in/wp-content/uploads/2024/11/Nec-Campus-2024-NATIONAL-ENGINEERING-COLLEGE-KOVILPATTI-720p-h264-youtube.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      )}

      {/* 🔹 3D Carousel Images */}
      {showSlider && (
        <div className="slider-3d-track">
          {images.map((image, index) => {
            const position = getSlidePosition(index);
            const isActive = position === 'active';

            return (
              <div
                key={index}
                className={`slide-3d ${position} ${animate ? 'animate-3d' : ''}`}
                onClick={() => !isActive && goToSlide(index)}
              >
                <img
                  src={image.src}
                  alt={image.title || 'slider'}
                  className="slider-image"
                />

                {/* Overlay gradient */}
                <div className="slide-overlay" />

                {/* Hero text - only on active slide */}
                {isActive && image.title && (
                  <div className="hero-text-content">
                    <h1 className="hero-title">{image.title}</h1>
                    <p className="hero-subtitle">{image.subtitle}</p>
                    <p className="hero-description">{image.description}</p>
                  </div>
                )}

                {/* Placement Buttons - only on active slide */}
                {isActive && image.showButtons && (
                  <div className="placement-button-row">
                    <button className="placement-button">Placement Details 2024-25</button>
                    <button className="placement-button">Placement Details 2023-24</button>
                    <button className="placement-button">Placement Details 2022-23</button>
                    <button className="placement-button">Placement Details 2021-22</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 🔹 Arrows */}
      {showSlider && (
        <>
          <button className="left-arrow" onClick={prevSlide}>
            ❰
          </button>
          <button className="right-arrow" onClick={nextSlide}>
            ❱
          </button>
        </>
      )}

      {/* 🔹 Dots */}
      <div className="dots-container">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const isActive =
            (!showSlider && i === 0) || (showSlider && currentIndex === i - 1);
          return (
            <div
              key={i}
              className={`dot ${isActive ? 'active-dot' : ''}`}
              onClick={() => handleDotClick(i)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ImageSlider;