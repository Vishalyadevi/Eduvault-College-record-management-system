import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaUserGraduate, FaFlask, FaBriefcase, FaChalkboardTeacher, FaUsers, FaUserTie } from 'react-icons/fa';
import { MdOutlineSchool, MdMenuBook } from 'react-icons/md';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import './AcademicsSection.css';

const images = [
  {
    src: 'https://nec.edu.in/wp-content/uploads/2025/02/NEC_UG.webp',
    label: 'UG Programs',
    description: 'Undergraduate Excellence',
  },
  {
    src: 'https://nec.edu.in/wp-content/uploads/2025/02/NEC_PG.webp',
    label: 'PG Programs',
    description: 'Postgraduate Mastery',
  },
  {
    src: 'https://nec.edu.in/wp-content/uploads/2025/02/NEC_Research.webp',
    label: 'Research',
    description: 'Innovation & Discovery',
  },
];

const stats = [
  { value: 2200, label: 'Students', suffix: '+', icon: <FaUsers /> },
  { value: 170, label: 'Faculty Members', suffix: '+', icon: <FaChalkboardTeacher /> },
  { value: 10, label: 'Industry Experts', suffix: '+', icon: <FaBriefcase /> },
  { value: 200, label: 'Ph.D Awarded', suffix: '+', icon: <FaUserGraduate /> },
  { value: 260, label: 'Staff', suffix: '+', icon: <FaUserTie /> },
];

const AcademicsSection: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [countStarted, setCountStarted] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const { ref: programsRef, inView: programsInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const goToNext = () => {
    setAutoRotate(false);
    setIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setAutoRotate(false);
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (slideIndex: number) => {
    setAutoRotate(false);
    setIndex(slideIndex);
  };

  useEffect(() => {
    if (programsInView && !countStarted) {
      setCountStarted(true);
    }
  }, [programsInView, countStarted]);

  return (
    <section className="academics-section">
      {/* Background gears */}
      <div className="bg-gear bg-gear-1"></div>
      <div className="bg-gear bg-gear-2"></div>
      <div className="bg-gear bg-gear-3"></div>
      <div className="bg-gear bg-gear-4"></div>
      <div className="bg-gear bg-gear-5"></div>

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="academics-header"
      >
        <h2 className="academics-title">ACADEMICS</h2>
        <div className="title-underline">
          <div className="underline-dot"></div>
        </div>
      </motion.div>

      {/* Main Content - Single Unified Container */}
      <motion.div
        ref={programsRef}
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        viewport={{ once: true }}
        className="academics-container"
      >
        <div className="unified-card">

          {/* Left Side - Programs Info */}
          <div className="programs-content">
            <h3 className="programs-heading">
              <span className="heading-icon"><MdMenuBook /></span>
              Programs Offered
            </h3>

            <p className="programs-description">
              The college offers <strong>7 undergraduate programmes</strong> and{' '}
              <strong>5 postgraduate programmes</strong> covering Engineering and Technology.
              The National Board of Accreditation has accredited{' '}
              <strong>5 programmes</strong> up to June 2023.
            </p>

            {/* Count Cards */}
            <div className="count-cards-wrapper">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={programsInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                transition={{ duration: 0.6, type: 'spring', delay: 0.2 }}
                className="count-card count-card-ug"
              >
                <div className="count-number">
                  {countStarted && <CountUp end={7} duration={2} />}
                </div>
                <div className="count-label">UG Programmes</div>
                <div className="count-icon"><MdOutlineSchool /></div>
              </motion.div>

              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={programsInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 180 }}
                transition={{ duration: 0.6, type: 'spring', delay: 0.4 }}
                className="count-card count-card-pg"
              >
                <div className="count-number">
                  {countStarted && <CountUp end={5} duration={2} delay={0.2} />}
                </div>
                <div className="count-label">PG Programmes</div>
                <div className="count-icon"><FaFlask /></div>
              </motion.div>
            </div>
          </div>

          {/* Divider */}
          <div className="unified-divider" />

          {/* Right Side - Image Carousel */}
          <div className="carousel-wrapper">
            <div className="image-carousel">
              <motion.img
                key={index}
                src={images[index].src}
                alt={images[index].label}
                className="carousel-image"
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              />

              {/* Image Overlay */}
              <div className="image-overlay">
                <div className="overlay-content">
                  <h3 className="overlay-title">{images[index].label}</h3>
                  <p className="overlay-description">{images[index].description}</p>
                  <button className="view-more-btn">
                    <span>View More</span>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M4 10H16M16 10L11 5M16 10L11 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Navigation Buttons */}
              <button onClick={goToPrev} className="carousel-nav-button carousel-prev" aria-label="Previous slide">
                <FaChevronLeft size={16} />
              </button>
              <button onClick={goToNext} className="carousel-nav-button carousel-next" aria-label="Next slide">
                <FaChevronRight size={16} />
              </button>

              {/* Slide Indicators */}
              <div className="carousel-indicators">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`indicator ${idx === index ? 'active' : ''}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Statistics Section - Colorful Bento */}
      <motion.div
        ref={statsRef}
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="statistics-section"
      >
        <div className="statistics-container">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0, rotate: -30, opacity: 0 }}
              animate={statsInView ? { scale: 1, rotate: 0, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.1, type: 'spring' }}
              className="stat-card"
            >
              <span className="stat-icon">{stat.icon}</span>
              <div className="stat-number">
                {statsInView && (
                  <CountUp
                    end={stat.value}
                    duration={2.5}
                    delay={idx * 0.1}
                    suffix={stat.suffix}
                  />
                )}
              </div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default AcademicsSection;