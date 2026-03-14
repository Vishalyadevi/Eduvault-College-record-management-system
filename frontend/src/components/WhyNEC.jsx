import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  GraduationCap,
  FlaskConical,
  Trophy,
  Handshake,
  Briefcase,
  Star,
  Building2,
  ArrowRight,
} from 'lucide-react';
import './WhyNEC.css';

const WhyNEC = () => {
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const isVideoInView = useInView(videoRef, { threshold: 0.3, once: true });
  const isContentInView = useInView(contentRef, { threshold: 0.3, once: true });

  const features = [
    {
      icon: <GraduationCap size={36} strokeWidth={1.6} />,
      title: 'Established Excellence',
      description: 'Since 1984, accredited by NBA',
    },
    {
      icon: <FlaskConical size={36} strokeWidth={1.6} />,
      title: 'Research Programs',
      description: '7 UG, 5 PG & Ph.D. programs',
    },
    {
      icon: <Trophy size={36} strokeWidth={1.6} />,
      title: 'State-of-the-Art Labs',
      description: 'Excellence in all engineering branches',
    },
    {
      icon: <Handshake size={36} strokeWidth={1.6} />,
      title: 'Industry Collaboration',
      description: 'MoUs with leading organizations',
    },
    {
      icon: <Briefcase size={36} strokeWidth={1.6} />,
      title: 'Career Prospects',
      description: 'Excellent campus placements',
    },
    {
      icon: <Star size={36} strokeWidth={1.6} />,
      title: 'Academic Environment',
      description: 'Robust training & opportunities',
    },
  ];

  return (
    <section className="why-nec-section">
      <div className="why-nec-container">
        {/* Left side - Video */}
        <motion.div
          ref={videoRef}
          className="why-nec-image-wrapper"
          initial={{ opacity: 0, x: -100 }}
          animate={isVideoInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
          transition={{ duration: 0.8 }}
        >
          <div className="why-nec-image-container">
            <video
              className="why-nec-image"
              controls
              controlsList="nodownload"
              preload="auto"
              playsInline
              poster="/fallback.jpg"
            >
              <source
                src="https://nec.edu.in/wp-content/uploads/2025/04/WhatsApp-Video-2023-08-28-at-2.28.24-PM.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
            <div className="why-nec-image-overlay" />

            {/* Floating badge */}
            <div className="why-nec-badge">
              <div className="badge-icon">
                <Building2 size={36} strokeWidth={1.6} color="#003087" />
              </div>
              <div className="badge-content">
                <div className="badge-year">EST. 1984</div>
                <div className="badge-text">NBA Accredited</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Content */}
        <motion.div
          ref={contentRef}
          className="why-nec-content"
          initial={{ opacity: 0, x: 100 }}
          animate={isContentInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
          transition={{ duration: 0.8 }}
        >
          {/* Section header with animated underline */}
          <div className="why-nec-header">
            <h2 className="why-nec-title">
              <span className="title-main">WHY</span>
              <span className="title-highlight">NEC</span>
              <span className="title-question">?</span>
            </h2>
            <div className="title-underline">
              <div className="underline-dot"></div>
            </div>
          </div>

          {/* Main description */}
          <p className="why-nec-description">
            National Engineering College (NEC), established in <strong>1984</strong> and
            accredited by the <strong>NBA</strong>, offers seven undergraduate, five postgraduate,
            and numerous Ph.D. research programs. The college boasts centers of excellence and
            state-of-the-art laboratories for all engineering branches.
          </p>

          {/* Feature grid */}
          <div className="why-nec-features">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Call to action */}
          <div className="why-nec-cta">
            <p className="cta-text">
              NEC collaborates with research organizations and industries through MoUs to drive
              technological advancements, enhance student training, update curricula, and establish
              advanced research centers.
            </p>
            <button className="cta-button">
              <span>Learn More About NEC</span>
              <ArrowRight className="cta-arrow" size={20} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Decorative background elements */}
      <div className="bg-decoration bg-decoration-1"></div>
      <div className="bg-decoration bg-decoration-2"></div>
      <div className="bg-decoration bg-decoration-3"></div>
    </section>
  );
};

export default WhyNEC;