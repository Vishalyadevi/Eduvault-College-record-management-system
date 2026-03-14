import React from 'react';
import Marquee from './Marquee';
import './NewsSection.css';

const NewsSection = () => {
  const news = [
    {
      title: 'New Research Breakthrough',
      date: 'March 15, 2024',
      category: 'Research',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Student Achievement Awards',
      date: 'March 14, 2024',
      category: 'Campus Life',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'International Conference 2024',
      date: 'March 13, 2024',
      category: 'Events',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="nec-news-wrapper">
      {/* Animated Background Elements */}
      <div className="nec-news-animated-bg-1"></div>
      <div className="nec-news-animated-shape-1"></div>
      <div className="nec-news-animated-shape-2"></div>
      <div className="nec-news-animated-shape-3"></div>
      <div className="nec-news-particle nec-news-particle-1"></div>
      <div className="nec-news-particle nec-news-particle-2"></div>
      <div className="nec-news-particle nec-news-particle-3"></div>
      <div className="nec-news-particle nec-news-particle-4"></div>
      <div className="nec-news-particle nec-news-particle-5"></div>
      <div className="nec-news-animated-line nec-news-animated-line-1"></div>
      <div className="nec-news-animated-line nec-news-animated-line-2"></div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="nec-news-header">
          <h2 className="nec-news-title">Latest News</h2>
        </div>

        {/* News Grid */}
        <div className="nec-news-grid">
          {news.map((item, index) => (
            <div key={index} className="nec-news-card">
              {/* Image Section */}
              <div className="nec-news-image-wrapper">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="nec-news-image"
                />
              </div>

              {/* Content Section */}
              <div className="nec-news-content">
                <div className="nec-news-category">{item.category}</div>
                <h3 className="nec-news-title-text">{item.title}</h3>
                <p className="nec-news-date">{item.date}</p>
                
                {/* Know More Button */}
                <button className="nec-know-more-btn">
                  <span>Know more</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <Marquee />
      </div>
    </div>
  );
};

export default NewsSection;