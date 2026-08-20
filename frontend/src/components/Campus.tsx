import React, { useState, useEffect } from "react";
import {
  FaHome, FaTheaterMasks, FaFutbol, FaChalkboardTeacher,
  FaBook, FaPalette, FaGraduationCap, FaUsers, FaStar,
  FaUniversity, FaChevronLeft, FaChevronRight,
  FaPause, FaPlay, FaChartBar, FaArrowRight
} from 'react-icons/fa';
import { MdSchool } from 'react-icons/md';
import './CampusLife.css';

interface CampusItem {
  title: string;
  imgSrc: string;
  description: string;
  icon: React.ReactNode;
  stats: string;
  statsIcon: React.ReactNode;
}

const campusLifeData: CampusItem[] = [
  {
    title: "HOSTEL",
    imgSrc: "https://nec.edu.in/wp-content/uploads/elementor/thumbs/HOSTEL500x600-r1ym3qm9ybig7m7vytr8f20ykw1fvj1znidyje77n4.webp",
    description: "Modern residential facilities with 24/7 amenities and security",
    icon: <FaHome />,
    stats: "1000+ Rooms",
    statsIcon: <FaChartBar />
  },
  {
    title: "CLUBS",
    imgSrc: "https://nec.edu.in/wp-content/uploads/elementor/thumbs/clubs1500x600-r25qgo5q7r82leoihkzn9o14i5t6eo9vihbzegdd9s.webp",
    description: "50+ student clubs fostering creativity and leadership",
    icon: <FaTheaterMasks />,
    stats: "50+ Clubs",
    statsIcon: <FaChartBar />
  },
  {
    title: "SPORTS",
    imgSrc: "https://nec.edu.in/wp-content/uploads/elementor/thumbs/Sports500x600-r25qjhoapv31fal20svcqyewnrwthzgvwfsf8c6uls.webp",
    description: "State-of-the-art facilities for indoor and outdoor sports",
    icon: <FaFutbol />,
    stats: "20+ Sports",
    statsIcon: <FaChartBar />
  },
  {
    title: "SMART CLASSROOM",
    imgSrc: "https://nec.edu.in/wp-content/uploads/elementor/thumbs/10.-Smart-class-room500x600-r25zie6chz43svjthvmisz0f3yd4qsdcmnq99bf33k.webp",
    description: "Advanced technology-enabled interactive learning spaces",
    icon: <FaChalkboardTeacher />,
    stats: "100+ Rooms",
    statsIcon: <FaChartBar />
  },
  {
    title: "LIBRARY",
    imgSrc: "https://nec.edu.in/wp-content/uploads/elementor/thumbs/library1500x600-r1ylosyld32fqnwv6dcmstpashnhknrixl8814cei8.webp",
    description: "Extensive collection with digital resources and study areas",
    icon: <FaBook />,
    stats: "50K+ Books",
    statsIcon: <FaChartBar />
  },
  {
    title: "FINE ARTS",
    imgSrc: "https://nec.edu.in/wp-content/uploads/elementor/thumbs/FineArts2500x600-r25qdxgoa5gyqcnvhwbthuxq4pbmyge24wu00efpf4.webp",
    description: "Creative spaces for artistic expression and cultural activities",
    icon: <FaPalette />,
    stats: "Multiple Studios",
    statsIcon: <FaChartBar />
  },
];

const CampusLife: React.FC = () => {
  const [startIndex, setStartIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const total = campusLifeData.length;
  const itemsToShow = 4;

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % total);
      setFlippedCards(new Set());
    }, 5000);
    return () => clearInterval(interval);
  }, [total, isAutoPlaying]);

  const getVisibleItems = () => {
    const items = [];
    for (let i = 0; i < itemsToShow; i++) {
      items.push({
        data: campusLifeData[(startIndex + i) % total],
        globalIndex: (startIndex + i) % total,
        displayIndex: i
      });
    }
    return items;
  };

  const handleCardFlip = (globalIndex: number) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(globalIndex)) newFlipped.delete(globalIndex);
    else newFlipped.add(globalIndex);
    setFlippedCards(newFlipped);
  };

  const handlePrevious = () => {
    setStartIndex((prev) => (prev - 1 + total) % total);
    setFlippedCards(new Set());
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % total);
    setFlippedCards(new Set());
  };

  return (
    <section className="campus-life-section-new">
      {/* Background Gears */}
      <div className="campus-bg-gear campus-bg-gear-1"></div>
      <div className="campus-bg-gear campus-bg-gear-2"></div>
      <div className="campus-bg-gear campus-bg-gear-3"></div>
      <div className="campus-bg-gear campus-bg-gear-4"></div>
      <div className="campus-bg-gear campus-bg-gear-5"></div>

      {/* Section Header */}
      <div className="campus-section-header">
        <div className="campus-header-badge">
          <span className="badge-icon"><MdSchool /></span>
          <span className="badge-text">Student Life</span>
        </div>

        <h2 className="campus-main-title">
          <span className="title-word title-word-1">CAMPUS</span>
          <span className="title-word title-word-2">LIFE</span>
        </h2>

        <div className="campus-title-underline">
          <div className="underline-animated"></div>
        </div>

        <p className="campus-main-subtitle">
          Experience the vibrant and enriching student life at NEC
        </p>
      </div>

      {/* Cards Container */}
      <div
        className="campus-cards-container"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <button className="campus-nav-arrow campus-nav-prev" onClick={handlePrevious} aria-label="Previous">
          <FaChevronLeft size={20} />
        </button>

        <div className="campus-cards-grid">
          {getVisibleItems().map((item) => (
            <div
              key={item.globalIndex}
              className={`campus-flip-card ${flippedCards.has(item.globalIndex) ? 'is-flipped' : ''}`}
              onClick={() => handleCardFlip(item.globalIndex)}
            >
              <div className="campus-flip-card-inner">
                {/* Front */}
                <div className="campus-flip-card-front">
                  <div className="card-image-wrapper">
                    <img src={item.data.imgSrc} alt={item.data.title} className="campus-card-image" />
                    <div className="card-gradient-overlay"></div>
                  </div>
                  <div className="card-front-content">
                    <h3 className="card-title">{item.data.title}</h3>
                    <div className="card-flip-indicator">
                      <span className="flip-text">Click to explore</span>
                      <FaChevronRight className="flip-icon" size={14} />
                    </div>
                  </div>
                  <div className="card-corner-badge">
                    <span className="corner-badge-icon"><FaGraduationCap /></span>
                  </div>
                </div>

                {/* Back */}
                <div className="campus-flip-card-back">
                  <div className="card-back-pattern"></div>
                  <div className="card-back-content">
                    <div className="back-icon">{item.data.icon}</div>
                    <h3 className="back-title">{item.data.title}</h3>
                    <p className="back-description">{item.data.description}</p>
                    <div className="back-stats">
                      <span className="stats-icon">{item.data.statsIcon}</span>
                      <span className="stats-text">{item.data.stats}</span>
                    </div>
                    <button className="back-explore-btn">
                      Learn More
                      <FaArrowRight className="btn-arrow" size={14} />
                    </button>
                    <div className="back-flip-indicator">
                      <span className="back-flip-text">Tap to flip back</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="campus-nav-arrow campus-nav-next" onClick={handleNext} aria-label="Next">
          <FaChevronRight size={20} />
        </button>
      </div>

      {/* Progress + Autoplay */}
      <div className="campus-progress-container">
        <div className="campus-dots-wrapper">
          {campusLifeData.map((item, index) => (
            <button
              key={index}
              onClick={() => { setStartIndex(index); setFlippedCards(new Set()); }}
              className={`campus-progress-dot ${index >= startIndex && index < startIndex + itemsToShow ? 'is-visible' : ''} ${startIndex === index ? 'is-first' : ''}`}
              aria-label={`Go to ${item.title}`}
            >
              <span className="dot-tooltip">{item.title}</span>
            </button>
          ))}
        </div>

        <button
          className="autoplay-toggle"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          aria-label={isAutoPlaying ? 'Pause' : 'Play'}
        >
          {isAutoPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
        </button>
      </div>

      {/* Info Bar */}
      <div className="campus-info-bar">
        <div className="info-item">
          <span className="info-icon"><FaUniversity /></span>
          <span className="info-text">6 Major Facilities</span>
        </div>
        <div className="info-separator"></div>
        <div className="info-item">
          <span className="info-icon"><FaUsers /></span>
          <span className="info-text">3000+ Students</span>
        </div>
        <div className="info-separator"></div>
        <div className="info-item">
          <span className="info-icon"><FaStar /></span>
          <span className="info-text">Excellence in Campus Life</span>
        </div>
      </div>
    </section>
  );
};

export default CampusLife;