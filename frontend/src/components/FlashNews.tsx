import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import './FlashNews.css';

interface NewsItem {
  title: string;
  link: string;
}

const FlashNewsBar: React.FC = () => {
  const newsItems: NewsItem[] = [
    {
      title: 'DST iTBI, NEC supported by NIDHI',
      link: 'https://nidhi.dst.gov.in/',
    },
    {
      title: 'DST-iTBI Tender (15-02-2025)',
      link: 'https://nec.edu.in/wp-content/uploads/2025/02/Tender-Document-K-R-Innovation-Centre-fourth-Call-14-2-2025.pdf',
    },
    {
      title: '41 Annual Day',
      link: 'https://nec.edu.in',
    },
  ];

  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleToggle = (): void => setPaused(!paused);
  
  const handleScroll = (direction: 'left' | 'right'): void => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += direction === 'left' ? -200 : 200;
    }
  };

  return (
    <div className="flash-news-wrapper">
      <div className="flash-news-container">
        {/* Flash News Label */}
        <div className="flash-news-label">
          <span className="flash-text">Flash News</span>
        </div>

        {/* News Content Area */}
        <div className="news-content-area">
          <div
            ref={scrollRef}
            className={`news-scroll-container ${paused ? 'paused' : 'scrolling'}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {newsItems.map((item, index) => (
              <div key={index} className="news-item-wrapper">
                {/* Rolling Nut Icon with "NEW" text */}
                <div className="nut-icon-container">
                  <svg
                    className="nut-icon"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Outer Hexagon (Gold) */}
                    <polygon
                      points="50,10 85,30 85,70 50,90 15,70 15,30"
                      fill="#fbbf24"
                      stroke="#f59e0b"
                      strokeWidth="3"
                    />
                    {/* Inner Circle (White) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="22"
                      fill="#ffffff"
                      stroke="#f59e0b"
                      strokeWidth="3"
                    />
                    {/* NEW Text (Red) - Increased font size */}
                    <text
                      x="50"
                      y="56"
                      textAnchor="middle"
                      fontFamily="Arial, sans-serif"
                      fontSize="22"
                      fontWeight="bold"
                      fill="#dc2626"
                    >
                      NEW
                    </text>
                  </svg>
                </div>

                {/* News Text */}
                <a
                  href={item.link}
                  className="news-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.title}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="news-controls">
          <button
            onClick={() => handleScroll('left')}
            className="control-btn"
            title="Previous"
            aria-label="Previous news"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleToggle}
            className="control-btn"
            title={paused ? 'Play' : 'Pause'}
            aria-label={paused ? 'Play' : 'Pause'}
          >
            {paused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="control-btn"
            title="Next"
            aria-label="Next news"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashNewsBar;