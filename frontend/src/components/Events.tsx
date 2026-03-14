import React, { useState } from "react";

interface EventItem {
  date: string;
  month: string;
  title: string;
  eventDate: string;
  imageUrl: string;
  description: string;
}

const events: EventItem[] = [
  {
    date: "12", month: "Apr",
    title: "41st Annual Day Celebrations",
    eventDate: "12/04/2025",
    imageUrl: "https://nec.edu.in/wp-content/uploads/2025/04/41stAnnualDayCelebrations-1024x1024.jpg",
    description: "Join us for the grand 41st Annual Day Celebrations at National Engineering College, honouring academic excellence, cultural talent, and the remarkable achievements of our students and faculty.",
  },
  {
    date: "07", month: "Apr",
    title: "41st Annual Sports Day",
    eventDate: "07/04/2025",
    imageUrl: "https://nec.edu.in/wp-content/uploads/2025/04/IMG-20250407-WA0000-1024x1024.jpg",
    description: "Witness the spirit of sportsmanship at the 41st Annual Sports Day. Students compete across a wide range of athletic events showcasing physical prowess and teamwork.",
  },
  {
    date: "25", month: "Mar",
    title: "Career Guidance Conclave",
    eventDate: "25/03/2025",
    imageUrl: "https://nec.edu.in/wp-content/uploads/2025/03/IMG-20250314-WA0119-1024x1024.jpg",
    description: "An enlightening conclave bringing together industry leaders, alumni, and career experts to guide students on navigating the professional world.",
  },
  {
    date: "24", month: "Mar",
    title: "Two-days Faculty Development Program (FDP)",
    eventDate: "24/03/2025",
    imageUrl: "https://nec.edu.in/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-19-at-7.53.14-PM-1024x1024.jpeg",
    description: "A two-day immersive Faculty Development Program designed to equip educators with the latest pedagogical tools and innovative teaching strategies.",
  },
];

const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

/* ── Gear SVG path (FontAwesome cog) ── */
const GEAR_PATH = "M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z";
const GEAR_PATH2 = "M495.9 166.6c3.2 8.7.5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6.3-24.5-6.8-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6 4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2 5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8 8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z";

const Events: React.FC = () => {
  // ✅ Changed initial state from "rolled" to "open" — eliminates blank space
  const [scrollState, setScrollState] = useState<"rolled"|"unrolling"|"open"|"rolling">("open");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const handleScrollClick = () => {
    if (scrollState === "rolled") {
      setScrollState("unrolling");
      setTimeout(() => setScrollState("open"), 1200);
    } else if (scrollState === "open") {
      setScrollState("rolling");
      setTimeout(() => setScrollState("rolled"), 900);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "Georgia,serif",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #d6eaff 0%, #e3f2fd 40%, #f0f7ff 70%, #ffffff 100%)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        /* ═══ GEAR ANIMATIONS ═══ */
        @keyframes rotateGear1   { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
        @keyframes rotateGear2   { from{transform:rotate(0deg)}   to{transform:rotate(-360deg)} }
        @keyframes rotateGear3   { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }

        .evt-gear-1 {
          position:absolute; top:-80px; right:-80px;
          width:350px; height:350px; opacity:0.06; z-index:0; pointer-events:none;
          animation: rotateGear1 25s linear infinite;
        }
        .evt-gear-2 {
          position:absolute; bottom:-60px; left:-60px;
          width:280px; height:280px; opacity:0.06; z-index:0; pointer-events:none;
          animation: rotateGear2 30s linear infinite;
        }
        .evt-gear-3 {
          position:absolute; top:40%; right:10%;
          width:220px; height:220px; opacity:0.05; z-index:0; pointer-events:none;
          animation: rotateGear3 35s linear infinite;
        }
        .evt-gear-4 {
          position:absolute; top:12%; left:5%;
          width:160px; height:160px; opacity:0.04; z-index:0; pointer-events:none;
          animation: rotateGear2 20s linear infinite;
        }

        /* ═══ SCROLL STATES ═══ */
        .scroll-wrapper.state-rolled .scroll-parchment   { max-height:0px; overflow:hidden; opacity:0; }
        .scroll-wrapper.state-rolled .scroll-body-content { opacity:0; }
        .scroll-wrapper.state-rolled .rod-bottom          { opacity:0; pointer-events:none; }
        .scroll-wrapper.state-rolled .rolled-preview      { display:flex; }
        .scroll-wrapper.state-rolled .open-hint           { display:block; }

        .scroll-wrapper.state-unrolling .scroll-parchment   { animation:unrollParchment 1.0s cubic-bezier(0.22,1,0.36,1) forwards; }
        .scroll-wrapper.state-unrolling .rod-bottom          { animation:rodAppear 1.0s cubic-bezier(0.22,1,0.36,1) forwards; }
        .scroll-wrapper.state-unrolling .scroll-body-content { animation:contentReveal 0.5s ease 0.8s both; }
        .scroll-wrapper.state-unrolling .rolled-preview      { display:none; }
        .scroll-wrapper.state-unrolling .open-hint           { display:none; }

        .scroll-wrapper.state-open .scroll-parchment    { max-height:2000px; overflow:visible; opacity:1; }
        .scroll-wrapper.state-open .scroll-body-content { opacity:1; }
        .scroll-wrapper.state-open .rod-bottom          { opacity:1; pointer-events:auto; }
        .scroll-wrapper.state-open .rolled-preview      { display:none; }
        .scroll-wrapper.state-open .open-hint           { display:none; }

        .scroll-wrapper.state-rolling .scroll-parchment     { animation:rollParchment 0.8s cubic-bezier(0.64,0,0.78,0) forwards; }
        .scroll-wrapper.state-rolling .rod-bottom            { animation:rodDisappear 0.8s ease forwards; }
        .scroll-wrapper.state-rolling .scroll-body-content   { animation:contentHide 0.3s ease forwards; }
        .scroll-wrapper.state-rolling .rolled-preview        { display:none; }

        @keyframes unrollParchment {
          0%   { max-height:0px; opacity:0; transform:scaleY(0.02) rotateX(60deg); }
          30%  { opacity:1; transform:scaleY(0.3) rotateX(20deg); }
          70%  { transform:scaleY(1.03) rotateX(-3deg); }
          100% { max-height:2000px; opacity:1; transform:scaleY(1) rotateX(0deg); }
        }
        @keyframes rollParchment {
          0%   { max-height:2000px; opacity:1; transform:scaleY(1); }
          100% { max-height:0px; opacity:0; transform:scaleY(0.02) rotateX(60deg); }
        }
        @keyframes rodAppear    { from{opacity:0} to{opacity:1} }
        @keyframes rodDisappear { from{opacity:1} to{opacity:0} }
        @keyframes contentReveal { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes contentHide   { from{opacity:1} to{opacity:0} }

        /* ═══ RODS ═══ */
        .rod-top, .rod-bottom {
          height:32px;
          background:linear-gradient(180deg,#5c3010 0%,#b06820 20%,#e8a84a 40%,#f5c870 50%,#e8a84a 60%,#b06820 80%,#5c3010 100%);
          border-radius:16px; position:relative; z-index:10;
          box-shadow:0 6px 18px rgba(0,0,0,0.38),0 2px 6px rgba(0,0,0,0.25),inset 0 1px 3px rgba(255,255,255,0.28);
        }
        .rod-top { cursor:pointer; transition:filter 0.2s; }
        .rod-top:hover { filter:brightness(1.1); }

        .rod-knob {
          position:absolute; top:50%; transform:translateY(-50%);
          width:38px; height:38px; border-radius:50%;
          background:radial-gradient(circle at 38% 35%,#f5c870 0%,#c98030 35%,#7a4010 70%,#4a2008 100%);
          box-shadow:0 3px 10px rgba(0,0,0,0.45),inset 0 1px 3px rgba(255,255,255,0.22);
        }
        .rod-knob::after { content:''; position:absolute; top:20%;left:20%; width:25%;height:25%; border-radius:50%; background:rgba(255,255,255,0.32); }
        .rod-knob.left  { left:-14px; }
        .rod-knob.right { right:-14px; }
        .rod-top::after {
          content:''; position:absolute; bottom:-14px; left:10%; right:10%;
          height:14px; background:radial-gradient(ellipse,rgba(0,0,0,0.3) 0%,transparent 70%);
          filter:blur(4px);
        }

        /* ═══ PARCHMENT ═══ */
        .scroll-parchment { position:relative; transform-origin:top center; overflow:hidden; }
        .parchment-paper {
          background:
            repeating-linear-gradient(0deg,transparent,transparent 32px,rgba(160,120,60,0.06) 32px,rgba(160,120,60,0.06) 33px),
            radial-gradient(ellipse 200px 140px at 90% 15%,rgba(170,110,40,0.12) 0%,transparent 70%),
            radial-gradient(ellipse 180px 160px at 8% 80%,rgba(150,100,30,0.09) 0%,transparent 70%),
            linear-gradient(158deg,#f9ead0 0%,#f2dda8 15%,#eeddb0 35%,#f3e4b8 55%,#eddaa5 75%,#f0dcaa 100%);
          border-left:22px solid; border-right:22px solid;
          border-image:linear-gradient(180deg,#7a5020,#c09050 25%,#e8c880 50%,#c09050 75%,#7a5020) 1;
          padding:1.5rem 1.75rem 2rem; position:relative;
        }
        .parchment-paper::before { content:''; position:absolute; top:0;left:0;right:0; height:40px; background:linear-gradient(180deg,rgba(120,80,30,0.16) 0%,transparent 100%); pointer-events:none; }
        .parchment-paper::after  { content:''; position:absolute; inset:16px; border:1.5px solid rgba(160,120,60,0.18); border-radius:1px; pointer-events:none; }

        .rolled-preview {
          display:none; align-items:center; justify-content:center; padding:0.6rem 0;
          background:linear-gradient(158deg,#f5dfa0 0%,#e8c870 50%,#d4a840 100%);
          border-left:22px solid; border-right:22px solid;
          border-image:linear-gradient(180deg,#7a5020,#c09050 25%,#e8c880 50%,#c09050 75%,#7a5020) 1;
          position:relative;
        }
        .rolled-preview::before,.rolled-preview::after { content:''; position:absolute; left:16px;right:16px; height:3px; border-radius:2px; background:rgba(120,80,30,0.18); }
        .rolled-preview::before { top:8px; }
        .rolled-preview::after  { bottom:8px; }

        .open-hint {
          display:none; position:absolute; bottom:-46px; left:50%; transform:translateX(-50%);
          font-family:'EB Garamond',serif; font-size:0.85rem; font-style:italic;
          color:#1e3a8a; white-space:nowrap; pointer-events:none;
          animation:hintPulse 2s ease-in-out infinite;
        }
        @keyframes hintPulse {
          0%,100%{opacity:0.7;transform:translateX(-50%) translateY(0)}
          50%    {opacity:1;transform:translateX(-50%) translateY(-3px)}
        }

        /* ═══ SCROLL CONTENT ═══ */
        .scroll-heading { text-align:center; padding:0.25rem 0 1rem; }
        .scroll-heading h2 {
          font-family:'Cinzel',Georgia,serif; font-size:clamp(1.2rem,4vw,1.8rem);
          font-weight:700; color:#2c1608; margin:0 0 0.3rem;
          letter-spacing:0.06em; text-shadow:1px 1px 0 rgba(255,255,255,0.5);
        }
        .scroll-sub { font-family:'EB Garamond',serif; font-size:0.95rem; color:#6b4226; font-style:italic; opacity:0.8; }
        .scroll-divider { display:flex; align-items:center; gap:0.5rem; margin:0.5rem 0 1.25rem; }
        .scroll-divider-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,#a07848,transparent); }
        .scroll-divider-gem  { width:7px; height:7px; background:#a07848; transform:rotate(45deg); flex-shrink:0; opacity:0.65; }

        /* ═══ EVENT ROWS ═══ */
        .scroll-event-row {
          display:flex; align-items:center; gap:0.85rem; padding:0.75rem;
          margin-bottom:0.6rem; border-radius:8px;
          background:rgba(255,255,255,0.42);
          border:1px solid rgba(160,120,60,0.2);
          cursor:pointer; transition:background 0.25s,transform 0.25s,box-shadow 0.25s;
        }
        .scroll-event-row:hover { background:rgba(255,255,255,0.68); transform:translateX(4px); box-shadow:3px 4px 16px rgba(0,67,208,0.12); }
        .scroll-event-row:last-child { margin-bottom:0; }

        .scroll-event-thumb { width:72px; height:72px; border-radius:6px; overflow:hidden; flex-shrink:0; border:2px solid rgba(160,120,60,0.28); box-shadow:0 2px 6px rgba(0,0,0,0.15); }
        .scroll-event-thumb img { width:100%; height:100%; object-fit:cover; filter:sepia(8%); transition:transform 0.4s; }
        .scroll-event-row:hover .scroll-event-thumb img { transform:scale(1.08); }

        .scroll-event-info { flex:1; min-width:0; }
        .scroll-event-title { font-family:'EB Garamond',Georgia,serif; font-size:0.98rem; font-weight:500; color:#2c1608; margin:0 0 0.3rem; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .scroll-event-date  { display:flex; align-items:center; gap:5px; font-size:0.78rem; color:#7a5030; margin-bottom:0.5rem; font-family:'EB Garamond',serif; font-style:italic; }
        .scroll-details-btn {
          background:linear-gradient(135deg,#0043d0,#1e3a8a); color:#fff; border:none;
          border-radius:5px; padding:5px 14px; font-size:0.72rem; font-weight:700;
          font-family:'Cinzel',serif; letter-spacing:0.06em; cursor:pointer;
          transition:all 0.2s; box-shadow:0 2px 8px rgba(0,67,208,0.28);
        }
        .scroll-details-btn:hover { background:linear-gradient(135deg,#fb923c,#f97316); transform:translateY(-1px); box-shadow:0 4px 12px rgba(249,115,22,0.35); }

        .scroll-bottom-flourish { text-align:center; margin-top:1rem; font-size:0.9rem; color:#a07848; letter-spacing:1em; opacity:0.4; }

        /* ═══ MODAL ═══ */
        .modal-overlay { position:fixed; inset:0; background:rgba(10,5,0,0.78); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(6px); animation:modalIn 0.3s ease; }
        @keyframes modalIn { from{opacity:0} to{opacity:1} }
        .modal-parchment { width:100%; max-width:480px; animation:modalSlide 0.4s cubic-bezier(0.22,1,0.36,1); }
        @keyframes modalSlide { from{opacity:0;transform:scale(0.88) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .modal-rod {
          height:26px;
          background:linear-gradient(180deg,#5c3010 0%,#b06820 20%,#e8a84a 40%,#f5c870 50%,#e8a84a 60%,#b06820 80%,#5c3010 100%);
          border-radius:13px; box-shadow:0 5px 14px rgba(0,0,0,0.45),inset 0 1px 3px rgba(255,255,255,0.22);
          display:flex; align-items:center; justify-content:space-between; padding:0 8px; position:relative; z-index:2;
        }
        .modal-rod-knob { width:30px; height:30px; border-radius:50%; background:radial-gradient(circle at 38% 35%,#f5c870 0%,#c98030 35%,#7a4010 70%,#4a2008 100%); box-shadow:0 2px 8px rgba(0,0,0,0.4),inset 0 1px 2px rgba(255,255,255,0.22); }
        .modal-body {
          background:
            repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(160,120,60,0.06) 30px,rgba(160,120,60,0.06) 31px),
            linear-gradient(158deg,#f9ead0 0%,#f2dda8 15%,#eeddb0 40%,#f3e4b8 65%,#eddaa5 85%,#f0dcaa 100%);
          border-left:18px solid; border-right:18px solid;
          border-image:linear-gradient(180deg,#7a5020,#c09050 25%,#e8c880 50%,#c09050 75%,#7a5020) 1;
          padding:1.75rem 1.5rem 1.25rem; position:relative; margin:0 -1px;
        }
        .modal-body::before { content:''; position:absolute; top:0;left:0;right:0; height:35px; background:linear-gradient(180deg,rgba(120,80,30,0.14) 0%,transparent 100%); pointer-events:none; }
        .modal-body::after  { content:''; position:absolute; inset:12px; border:1px solid rgba(160,120,60,0.16); border-radius:1px; pointer-events:none; }
        .modal-close { position:absolute; top:10px;right:14px; background:none; border:none; font-size:1.2rem; color:#7a5030; cursor:pointer; padding:4px 8px; border-radius:4px; transition:all 0.2s; line-height:1; font-family:serif; z-index:10; }
        .modal-close:hover { color:#8b1a1a; background:rgba(160,120,60,0.18); }
        .modal-ornament { text-align:center; font-size:1rem; color:#a07848; letter-spacing:0.5em; opacity:0.6; margin-bottom:0.3rem; }
        .modal-title { font-family:'Cinzel',Georgia,serif; font-size:clamp(0.95rem,3vw,1.25rem); font-weight:700; color:#2c1608; text-align:center; margin:0 0 0.15rem; line-height:1.3; letter-spacing:0.03em; text-shadow:1px 1px 0 rgba(255,255,255,0.5); }
        .modal-divider { display:flex; align-items:center; gap:0.5rem; margin:0.6rem 0 0.9rem; }
        .modal-divider-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,#a07848,transparent); }
        .modal-divider-gem  { width:6px; height:6px; background:#a07848; transform:rotate(45deg); flex-shrink:0; opacity:0.6; }
        .modal-img { width:100%; height:170px; border-radius:4px; overflow:hidden; margin-bottom:0.9rem; border:2px solid rgba(160,120,60,0.26); box-shadow:0 4px 12px rgba(0,0,0,0.15); }
        .modal-img img { width:100%; height:100%; object-fit:cover; filter:sepia(10%) contrast(105%); display:block; }
        .modal-date-badge { display:inline-flex; align-items:center; gap:5px; background:rgba(160,120,60,0.1); border:1px solid rgba(160,120,60,0.24); border-radius:4px; padding:3px 10px; font-family:'EB Garamond',serif; font-size:0.88rem; color:#4a2c1a; margin-bottom:0.8rem; font-style:italic; }
        .modal-desc { font-family:'EB Garamond',serif; font-size:0.98rem; color:#4a2c1a; line-height:1.85; font-style:italic; text-align:justify; border-left:3px solid rgba(160,120,60,0.28); padding-left:0.7rem; margin:0 0 1rem; }
        .modal-register-btn { width:100%; background:linear-gradient(135deg,#1e3a8a,#2563eb); color:#fff; border:none; border-radius:6px; padding:10px 24px; font-family:'Cinzel',serif; font-size:0.82rem; font-weight:700; letter-spacing:0.08em; cursor:pointer; transition:all 0.3s; box-shadow:0 4px 14px rgba(30,58,138,0.28); }
        .modal-register-btn:hover { background:linear-gradient(135deg,#f97316,#ea580c); box-shadow:0 6px 20px rgba(249,115,22,0.38); transform:translateY(-1px); }
        .modal-seal { display:flex; justify-content:flex-end; margin-top:0.8rem; }
        .modal-seal-disc { width:46px; height:46px; border-radius:50%; background:radial-gradient(circle at 38% 38%,#c9373a 0%,#8b1a1a 55%,#5a0a0a 100%); border:2px solid rgba(201,168,38,0.42); box-shadow:0 4px 12px rgba(0,0,0,0.28); display:flex; align-items:center; justify-content:center; font-size:1.2rem; position:relative; }
        .modal-seal-disc::after { content:''; position:absolute; inset:3px; border-radius:50%; border:1px solid rgba(201,168,38,0.32); }
        .modal-flourish { text-align:center; margin-top:0.7rem; font-size:0.85rem; color:#a07848; letter-spacing:0.8em; opacity:0.4; }

        /* ═══ RESPONSIVE ═══ */
        @media(max-width:480px){
          .evt-gear-1,.evt-gear-2,.evt-gear-3,.evt-gear-4 { display:none; }
        }
      `}</style>

      {/* Gear 1 — Blue, Top Right */}
      <svg className="evt-gear-1" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#0043d0" d={GEAR_PATH}/>
      </svg>
      {/* Gear 2 — Orange, Bottom Left */}
      <svg className="evt-gear-2" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#fb923c" d={GEAR_PATH2}/>
      </svg>
      {/* Gear 3 — Navy, Mid Right */}
      <svg className="evt-gear-3" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#003087" d={GEAR_PATH}/>
      </svg>
      {/* Gear 4 — Blue, Top Left (small) */}
      <svg className="evt-gear-4" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#0043d0" d={GEAR_PATH2}/>
      </svg>

      {/* ════ Page Header ════ */}
      <div style={{ position:"relative", zIndex:1, width:"100%", background:"linear-gradient(135deg,#1a237e 0%,#283593 50%,#1a237e 100%)", padding:"1.5rem 1rem", textAlign:"center", boxShadow:"0 4px 20px rgba(0,0,0,0.25)" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(255,255,255,0.03) 60px,rgba(255,255,255,0.03) 61px)", pointerEvents:"none" }}/>
        <h2 style={{ position:"relative", fontFamily:"'Cinzel',Georgia,serif", fontSize:"clamp(1.4rem,4vw,2rem)", fontWeight:700, color:"#fff", letterSpacing:"0.15em", margin:0, textShadow:"0 2px 8px rgba(0,0,0,0.35)" }}>Our Events</h2>
      </div>

      {/* ════ Sub-title ════ */}
      <div style={{ position:"relative", zIndex:1, textAlign:"center", padding:"2rem 1rem 0.5rem" }}>
        <p style={{ fontFamily:"'Cinzel',serif", fontSize:"1.1rem", fontWeight:700, color:"#1e3a8a", letterSpacing:"0.06em", margin:"0 0 0.75rem", display:"inline-block" }}>
          Our Upcoming Events
        </p>
        <div style={{ height:"4px", width:"160px", margin:"0 auto", background:"linear-gradient(90deg,#0043d0,#fb923c)", borderRadius:"2px" }}/>
      </div>

      {/* ════ Scroll Scene ════ */}
      <div style={{ perspective:"1200px", display:"flex", alignItems:"center", justifyContent:"center", padding:"2.5rem 1rem 5rem", position:"relative", zIndex:1 }}>
        <div className={`scroll-wrapper state-${scrollState}`} style={{ position:"relative", width:"520px", maxWidth:"95vw", transformStyle:"preserve-3d" }}>

          {/* TOP ROD — click to toggle roll/unroll */}
          <div className="rod-top" onClick={handleScrollClick} title={scrollState === "open" ? "Click to roll up" : "Click to unroll"}>
            <div className="rod-knob left"/><div className="rod-knob right"/>
          </div>

          {/* ROLLED PREVIEW */}
          <div className="rolled-preview">
            <span style={{ fontFamily:"'EB Garamond',serif", fontStyle:"italic", color:"#7a5030", fontSize:"0.9rem", opacity:0.75 }}>— click the rod to unroll —</span>
          </div>

          {/* PARCHMENT */}
          <div className="scroll-parchment">
            <div className="parchment-paper">
              <div className="scroll-body-content">
                <div className="scroll-divider" style={{marginTop:"0.5rem"}}>
                  <div className="scroll-divider-line"/><div className="scroll-divider-gem"/><div className="scroll-divider-line"/>
                </div>
                {events.map((ev, i) => (
                  <div key={i} className="scroll-event-row" onClick={() => setSelectedEvent(ev)}>
                    <div className="scroll-event-thumb"><img src={ev.imageUrl} alt={ev.title}/></div>
                    <div className="scroll-event-info">
                      <h3 className="scroll-event-title">{ev.title}</h3>
                      <div className="scroll-event-date"><CalendarIcon/> <span>{ev.eventDate}</span></div>
                      <button className="scroll-details-btn" onClick={e => { e.stopPropagation(); setSelectedEvent(ev); }}>Details</button>
                    </div>
                  </div>
                ))}
                <div className="scroll-bottom-flourish">· · ·</div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROD */}
          <div className="rod-bottom">
            <div className="rod-knob left"/><div className="rod-knob right"/>
          </div>

          {/* Hint */}
          <div className="open-hint">↑ click the rod to unroll the scroll ↑</div>

          {/* Ground shadow */}
          <div style={{ position:"absolute", bottom:"-22px", left:"10%", right:"10%", height:"22px", background:"radial-gradient(ellipse,rgba(0,67,208,0.2) 0%,transparent 70%)", filter:"blur(8px)", pointerEvents:"none" }}/>
        </div>
      </div>

      {/* ════ Event Detail Modal ════ */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setSelectedEvent(null); }}>
          <div className="modal-parchment">
            <div className="modal-rod"><div className="modal-rod-knob"/><div className="modal-rod-knob"/></div>
            <div className="modal-body">
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
              <div className="modal-ornament">✦ ✦ ✦</div>
              <h2 className="modal-title">{selectedEvent.title}</h2>
              <div className="modal-divider"><div className="modal-divider-line"/><div className="modal-divider-gem"/><div className="modal-divider-line"/></div>
              <div className="modal-img"><img src={selectedEvent.imageUrl} alt={selectedEvent.title}/></div>
              <div className="modal-date-badge"><CalendarIcon/> <span>{selectedEvent.eventDate}</span></div>
              <p className="modal-desc">{selectedEvent.description}</p>
              <button className="modal-register-btn">Register / Know More</button>
              <div className="modal-seal"><div className="modal-seal-disc">🏛</div></div>
              <div className="modal-flourish">· · ·</div>
            </div>
            <div className="modal-rod"><div className="modal-rod-knob"/><div className="modal-rod-knob"/></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;