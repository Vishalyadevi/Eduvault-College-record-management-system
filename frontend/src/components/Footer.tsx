import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="nec-footer">

      {/* Animated background elements */}
      <div className="footer-bg-orb footer-bg-orb-1"></div>
      <div className="footer-bg-orb footer-bg-orb-2"></div>
      <div className="footer-bg-orb footer-bg-orb-3"></div>
      <div className="footer-grid-overlay"></div>

      {/* Animated gear accents */}
      <div className="footer-gear footer-gear-1"></div>
      <div className="footer-gear footer-gear-2"></div>

      {/* Top accent line */}
      <div className="footer-top-accent"></div>

      <div className="footer-inner">

        {/* Brand Column */}
        <div className="footer-brand-col">
          <div className="footer-logo-lockup">
            <div className="footer-logo-emblem">
              <span>NEC</span>
            </div>
          </div>
          <p className="footer-brand-desc">
            National Engineering College — shaping engineers who lead, innovate, and inspire since 1984.
          </p>
          <div className="footer-divider"></div>
          <p className="footer-est">Est. 1984 · Kovilpatti, Tamil Nadu</p>
        </div>

        {/* About Column */}
        <div className="footer-col">
          <h3 className="footer-col-heading">About</h3>
          <ul className="footer-links">
            <li><a href="#" className="footer-link">Facts</a></li>
            <li><a href="#" className="footer-link">History</a></li>
            <li><a href="#" className="footer-link">Careers</a></li>
          </ul>
        </div>

        {/* Research Column */}
        <div className="footer-col">
          <h3 className="footer-col-heading">Research</h3>
          <ul className="footer-links">
            <li><a href="#" className="footer-link">Green Energy</a></li>
            <li><a href="#" className="footer-link">ED Cell</a></li>
            <li><a href="#" className="footer-link">NEC - Business Incubator</a></li>
            <li><a href="#" className="footer-link">KR Innovation Centre</a></li>
            <li><a href="#" className="footer-link">IEDC</a></li>
            <li><a href="#" className="footer-link">Newgen IEDC Portal</a></li>
          </ul>
        </div>

        {/* Academics Column */}
        <div className="footer-col">
          <h3 className="footer-col-heading">Academics</h3>
          <ul className="footer-links">
            <li><a href="#" className="footer-link">Schools</a></li>
            <li><a href="#" className="footer-link">Departments</a></li>
            <li><a href="#" className="footer-link">Programs</a></li>
          </ul>
        </div>

        {/* Connect Column */}
        <div className="footer-col">
          <h3 className="footer-col-heading">Connect</h3>
          <div className="footer-social-grid">
            <a href="#" className="footer-social-btn" aria-label="Facebook">
              <Facebook size={18} />
            </a>
            <a href="#" className="footer-social-btn" aria-label="Twitter">
              <Twitter size={18} />
            </a>
            <a href="#" className="footer-social-btn" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="#" className="footer-social-btn" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
          </div>
          <div className="footer-contact-block">
            <p className="footer-contact-line">admissions@nec.edu.in</p>
            <p className="footer-contact-line">+91 4632 272 001</p>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-rule"></div>
        <div className="footer-bottom-inner">
          <p className="footer-copyright">© 2024 National Engineering College. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#" className="footer-bottom-link">Privacy Policy</a>
            <span className="footer-bottom-dot">·</span>
            <a href="#" className="footer-bottom-link">Terms of Use</a>
            <span className="footer-bottom-dot">·</span>
            <a href="#" className="footer-bottom-link">Sitemap</a>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;