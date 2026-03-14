import { useState, useRef } from "react";
import "./NewsSection.css";

interface NewsItem {
  id: number;
  category: string;
  title: string;
  date: string;
  image: string;
  color: string;
  accent: string;
}

const newsData: NewsItem[] = [
  {
    id: 1,
    category: "INNOVATION",
    title: "Virtually inaugurated a Rs.4.97 crore initiative to foster startups in the Waste to Wealth sector",
    date: "March 06, 2025",
    image: "https://nec.edu.in/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-06-at-11.19.48-AM.jpeg",
    color: "#1e3a8a",
    accent: "#fb923c",
  },
  {
    id: 2,
    category: "ACHIEVEMENT",
    title: "NEC secures Provisional selection under the prestigious AICTE IDEA Lab Scheme worth ₹1.1 Crore",
    date: "January 21, 2025",
    image: "https://nec.edu.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-01-21-at-10.02.44-AM.webp",
    color: "#b91c1c",
    accent: "#fbbf24",
  },
  {
    id: 3,
    category: "COMPETITION",
    title: "10th State Level Quiz Competition — Congratulations to all Winners!",
    date: "October 25, 2024",
    image: "https://nec.edu.in/wp-content/uploads/2025/02/IMG-20241024-WA0001.webp",
    color: "#065f46",
    accent: "#34d399",
  },
  {
    id: 4,
    category: "AWARD",
    title: "1st Prize in Drawing Competition at Puthaga Thiruvizha '24",
    date: "October 18, 2024",
    image: "https://nec.edu.in/wp-content/uploads/2025/02/DrawingCompititionNews836x836.webp",
    color: "#4c1d95",
    accent: "#a78bfa",
  },
];

/* ── Gear SVG paths (FontAwesome cog) ── */
const GEAR_PATH_1 = "M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z";
const GEAR_PATH_2 = "M495.9 166.6c3.2 8.7.5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6.3-24.5-6.8-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6 4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2 5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8 8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z";

type FlipDirection = "forward" | "backward";

interface PageContentProps {
  news: NewsItem;
  isBack?: boolean;
}

function PageContent({ news, isBack = false }: PageContentProps) {
  return (
    <div className={`nec-page-inner${isBack ? " nec-page-inner--mirrored" : ""}`}>
      {/* Category ribbon */}
      <div className="nec-page-category-ribbon" style={{ background: news.color }}>
        <span className="nec-page-category-text">{news.category}</span>
      </div>

      {/* Image */}
      <div className="nec-page-image-container">
        <img
          src={news.image}
          alt={news.title}
          className="nec-page-image"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            const target = e.currentTarget;
            target.style.display = "none";
            if (target.parentElement) target.parentElement.style.background = news.color;
          }}
        />
        <div className="nec-page-image-overlay" style={{ background: `linear-gradient(to top, ${news.color}cc 0%, transparent 60%)` }} />
      </div>

      {/* Content */}
      <div className="nec-page-content">
        <div className="nec-page-accent-line" style={{ background: `linear-gradient(90deg, ${news.color}, ${news.accent})` }} />
        <h3 className="nec-page-news-title">{news.title}</h3>
        <div className="nec-page-date-badge">
          <span className="nec-page-calendar-icon">📅</span>
          <span className="nec-page-date-text">{news.date}</span>
        </div>
        <button className="nec-page-know-more-btn" style={{ background: `linear-gradient(135deg, ${news.color}, ${news.accent})` }}>
          Know More →
        </button>
      </div>

      {/* Page decoration */}
      <div className="nec-page-decor">
        <div className="nec-page-decor-line" style={{ background: news.accent }} />
      </div>
    </div>
  );
}

export default function NewsBookSection() {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [flipping, setFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<FlipDirection>("forward");
  const [flippingPage, setFlippingPage] = useState<number | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  const totalPages = newsData.length;

  const goToNext = (): void => {
    if (flipping || currentPage >= totalPages - 1) return;
    setFlipDirection("forward");
    setFlippingPage(currentPage);
    setFlipping(true);
    setTimeout(() => { setCurrentPage((p) => p + 1); setFlipping(false); setFlippingPage(null); }, 700);
  };

  const goToPrev = (): void => {
    if (flipping || currentPage <= 0) return;
    setFlipDirection("backward");
    setFlippingPage(currentPage - 1);
    setFlipping(true);
    setTimeout(() => { setCurrentPage((p) => p - 1); setFlipping(false); setFlippingPage(null); }, 700);
  };

  const goToPage = (index: number): void => {
    if (flipping || index === currentPage) return;
    setFlipDirection(index > currentPage ? "forward" : "backward");
    setFlippingPage(index > currentPage ? currentPage : index);
    setFlipping(true);
    setTimeout(() => { setCurrentPage(index); setFlipping(false); setFlippingPage(null); }, 700);
  };

  const current = newsData[currentPage];

  return (
    <div className="nec-book-wrapper">

      {/* ── SVG Engineering Gears (same as Events page) ── */}

      {/* Gear 1 — Blue, Top Right */}
      <svg className="nec-book-gear-svg gear-1" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#0043d0" d={GEAR_PATH_1} />
      </svg>

      {/* Gear 2 — Orange, Bottom Left */}
      <svg className="nec-book-gear-svg gear-2" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#fb923c" d={GEAR_PATH_2} />
      </svg>

      {/* Gear 3 — Navy, Mid Right */}
      <svg className="nec-book-gear-svg gear-3" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#003087" d={GEAR_PATH_1} />
      </svg>

      {/* Gear 4 — Blue small, Top Left */}
      <svg className="nec-book-gear-svg gear-4" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#0043d0" d={GEAR_PATH_2} />
      </svg>

      {/* Header */}
      <div className="nec-book-header">
        <h2 className="nec-book-title">NEWS</h2>
        <div className="nec-book-title-underline" />
      </div>

      {/* Book Scene */}
      <div className="nec-book-scene">
        <div className="nec-book-shadow" />

        <div className="nec-book" ref={bookRef}>
          {/* Spine */}
          <div className="nec-book-spine">
            <div className="nec-book-spine-text">NEC NEWS</div>
            <div className="nec-book-spine-lines">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="nec-book-spine-line" style={{ opacity: 0.3 + i * 0.08 }} />
              ))}
            </div>
          </div>

          {/* Page stack illusion */}
          {([4, 3, 2, 1] as number[]).map((offset) => (
            <div
              key={offset}
              className="nec-book-page-stack"
              style={{
                right: `${-offset * 3}px`,
                top: `${offset * 1.5}px`,
                background: offset % 2 === 0 ? "#e8eef8" : "#f0f4fc",
                zIndex: offset,
              }}
            />
          ))}

          {/* Flipping page animation */}
          {flipping && flippingPage !== null && (
            <div className={`nec-book-flipping-page nec-book-flipping-page--${flipDirection}`}>
              <div className="nec-book-flip-front">
                <PageContent news={newsData[flippingPage]} />
              </div>
              <div className="nec-book-flip-back">
                <PageContent
                  news={
                    flipDirection === "forward"
                      ? newsData[Math.min(flippingPage + 1, totalPages - 1)]
                      : newsData[Math.max(flippingPage - 1, 0)]
                  }
                  isBack
                />
              </div>
            </div>
          )}

          {/* Static current page */}
          {!flipping && (
            <div className="nec-book-static-page">
              <PageContent news={current} />
            </div>
          )}

          {/* Page curl */}
          <div className="nec-book-curl" />
        </div>
      </div>

      {/* Controls */}
      <div className="nec-book-controls">
        <button className="nec-book-nav-btn" onClick={goToPrev} disabled={currentPage === 0 || flipping}>
          ← Prev
        </button>
        <div className="nec-book-dots">
          {newsData.map((_, i) => (
            <button key={i} onClick={() => goToPage(i)} className={`nec-book-dot${i === currentPage ? " nec-book-dot--active" : ""}`} />
          ))}
        </div>
        <button className="nec-book-nav-btn" onClick={goToNext} disabled={currentPage === totalPages - 1 || flipping}>
          Next →
        </button>
      </div>

      {/* Page counter */}
      <div className="nec-book-page-counter">
        Page {currentPage + 1} of {totalPages}
      </div>
    </div>
  );
}