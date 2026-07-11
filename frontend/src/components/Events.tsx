import { useState, useRef } from "react";

/* ── DATA ── */
const newsData = [
  {
    id: 1, category: "INNOVATION",
    title: "Virtually inaugurated a Rs.4.97 crore initiative to foster startups in the Waste to Wealth sector",
    date: "March 06, 2025",
    image: "https://nec.edu.in/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-06-at-11.19.48-AM.jpeg",
    color: "#1e3a8a", accent: "#fb923c",
  },
  {
    id: 2, category: "ACHIEVEMENT",
    title: "NEC secures Provisional selection under the prestigious AICTE IDEA Lab Scheme worth ₹1.1 Crore",
    date: "January 21, 2025",
    image: "https://nec.edu.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-01-21-at-10.02.44-AM.webp",
    color: "#b91c1c", accent: "#fbbf24",
  },
  {
    id: 3, category: "COMPETITION",
    title: "10th State Level Quiz Competition — Congratulations to all Winners!",
    date: "October 25, 2024",
    image: "https://nec.edu.in/wp-content/uploads/2025/02/IMG-20241024-WA0001.webp",
    color: "#065f46", accent: "#34d399",
  },
  {
    id: 4, category: "AWARD",
    title: "1st Prize in Drawing Competition at Puthaga Thiruvizha '24",
    date: "October 18, 2024",
    image: "https://nec.edu.in/wp-content/uploads/2025/02/DrawingCompititionNews836x836.webp",
    color: "#4c1d95", accent: "#a78bfa",
  },
];

const eventsData = [
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

/* ── Gear paths ── */
const G1 = "M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z";
const G2 = "M495.9 166.6c3.2 8.7.5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6.3-24.5-6.8-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6 4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2 5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8 8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z";

/* ── Calendar icon ── */
const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

/* ── Book page content ── */
function PageContent({ news, isBack = false }) {
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden", transform: isBack ? "scaleX(-1)" : "none" }}>
      <div style={{ position:"absolute", top:20, left:-8, padding:"5px 18px 5px 14px", background:news.color, zIndex:10, clipPath:"polygon(0 0,100% 0,93% 50%,100% 100%,0 100%)", boxShadow:"2px 2px 8px rgba(0,0,0,.2)" }}>
        <span style={{ color:"#fff", fontSize:10, fontWeight:700, letterSpacing:"0.15em", fontFamily:"'DM Sans',sans-serif" }}>{news.category}</span>
      </div>
      <div style={{ width:"100%", height:240, position:"relative", overflow:"hidden", flexShrink:0 }}>
        <img src={news.image} alt={news.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={e => { e.currentTarget.style.display="none"; if(e.currentTarget.parentElement) e.currentTarget.parentElement.style.background=news.color; }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"50%", background:`linear-gradient(to top,${news.color}cc 0%,transparent 60%)` }}/>
      </div>
      <div style={{ padding:"1.25rem 1.5rem 0.75rem", display:"flex", flexDirection:"column", gap:"0.6rem", flex:1 }}>
        <div style={{ height:3, width:50, borderRadius:2, background:`linear-gradient(90deg,${news.color},${news.accent})` }}/>
        <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"1.05rem", fontWeight:700, color:"#111827", lineHeight:1.5, margin:0, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{news.title}</h3>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:13 }}>📅</span>
          <span style={{ fontSize:"0.78rem", color:"#6b7280", fontWeight:600 }}>{news.date}</span>
        </div>
        <button style={{ marginTop:"auto", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.04em", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase", width:"100%", background:`linear-gradient(135deg,${news.color},${news.accent})`, transition:"opacity .2s,transform .2s" }}
          onMouseEnter={e=>{ e.currentTarget.style.opacity="0.9"; e.currentTarget.style.transform="translateY(-1px)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="translateY(0)"; }}>
          Know More →
        </button>
      </div>
    </div>
  );
}

/* ── NEWS BOOK ── */
function NewsBook() {
  const [currentPage, setCurrentPage] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState("forward");
  const [flippingPage, setFlippingPage] = useState(null);
  const total = newsData.length;

  const goToNext = () => {
    if (flipping || currentPage >= total - 1) return;
    setFlipDirection("forward"); setFlippingPage(currentPage); setFlipping(true);
    setTimeout(() => { setCurrentPage(p => p + 1); setFlipping(false); setFlippingPage(null); }, 700);
  };
  const goToPrev = () => {
    if (flipping || currentPage <= 0) return;
    setFlipDirection("backward"); setFlippingPage(currentPage - 1); setFlipping(true);
    setTimeout(() => { setCurrentPage(p => p - 1); setFlipping(false); setFlippingPage(null); }, 700);
  };
  const goToPage = (i) => {
    if (flipping || i === currentPage) return;
    setFlipDirection(i > currentPage ? "forward" : "backward");
    setFlippingPage(i > currentPage ? currentPage : i); setFlipping(true);
    setTimeout(() => { setCurrentPage(i); setFlipping(false); setFlippingPage(null); }, 700);
  };

  const current = newsData[currentPage];
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      {/* Book scene */}
      <div style={{ perspective:2000, display:"flex", justifyContent:"center", alignItems:"center", marginBottom:"1.5rem", position:"relative" }}>
        <div style={{ position:"absolute", width:440, height:30, background:"radial-gradient(ellipse,rgba(0,67,208,.25) 0%,transparent 70%)", bottom:-8, left:"50%", transform:"translateX(-50%)", filter:"blur(12px)" }}/>
        <div style={{ position:"relative", width:440, height:520, transformStyle:"preserve-3d", animation:"bookFloat 4s ease-in-out infinite" }}>
          {/* Spine */}
          <div style={{ position:"absolute", left:-46, top:0, width:44, height:"100%", background:"linear-gradient(180deg,#1e3a8a,#0043d0 50%,#1e3a8a)", borderRadius:"4px 0 0 4px", boxShadow:"-4px 0 16px rgba(0,0,0,.3)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflow:"hidden", zIndex:20 }}>
            <span style={{ color:"#fff", fontFamily:"'Playfair Display',serif", fontSize:10, fontWeight:700, letterSpacing:"0.2em", writingMode:"vertical-rl", textOrientation:"mixed", transform:"rotate(180deg)", opacity:.9 }}>NEC NEWS</span>
          </div>
          {/* Stack */}
          {[4,3,2,1].map(offset => (
            <div key={offset} style={{ position:"absolute", top:`${offset*1.5}px`, right:`${-offset*3}px`, width:"100%", height:"100%", borderRadius:"0 8px 8px 0", background:offset%2===0?"#e8eef8":"#f0f4fc", zIndex:offset, boxShadow:"2px 2px 4px rgba(0,0,0,.1)" }}/>
          ))}
          {/* Flipping */}
          {flipping && flippingPage !== null && (
            <div style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", transformStyle:"preserve-3d", zIndex:50,
              animation:`${flipDirection==="forward"?"flipFwd":"flipBwd"} .7s cubic-bezier(.645,.045,.355,1) forwards` }}>
              <div style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", background:"#fff", borderRadius:"0 8px 8px 0", overflow:"hidden", backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", boxShadow:"8px 8px 32px rgba(0,67,208,.18)" }}>
                <PageContent news={newsData[flippingPage]}/>
              </div>
              <div style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", background:"#f8faff", borderRadius:"0 8px 8px 0", overflow:"hidden", backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", transform:"rotateY(180deg)", boxShadow:"-8px 8px 32px rgba(0,0,0,.15)" }}>
                <PageContent news={newsData[flipDirection==="forward"?Math.min(flippingPage+1,total-1):Math.max(flippingPage-1,0)]} isBack/>
              </div>
            </div>
          )}
          {/* Static */}
          {!flipping && (
            <div style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", background:"#fff", borderRadius:"0 8px 8px 0", boxShadow:"8px 8px 32px rgba(0,67,208,.18),0 2px 8px rgba(0,0,0,.1)", overflow:"hidden", zIndex:10 }}>
              <PageContent news={current}/>
            </div>
          )}
          {/* Curl */}
          <div style={{ position:"absolute", bottom:0, right:0, width:36, height:36, background:"linear-gradient(135deg,transparent 50%,rgba(0,67,208,.12) 50%)", zIndex:60, borderRadius:"0 0 8px 0", animation:"curlPulse 2s ease-in-out infinite", pointerEvents:"none" }}/>
        </div>
      </div>
      {/* Controls */}
      <div style={{ display:"flex", alignItems:"center", gap:"1.25rem", marginBottom:"0.75rem" }}>
        <button onClick={goToPrev} disabled={currentPage===0||flipping} style={{ background:"linear-gradient(135deg,#1e3a8a,#0043d0)", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontWeight:700, fontSize:"0.8rem", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", boxShadow:"0 4px 12px rgba(0,67,208,.25)", opacity:currentPage===0||flipping?.4:1, transition:"all .2s" }}>← Prev</button>
        <div style={{ display:"flex", gap:8 }}>
          {newsData.map((_,i) => (
            <button key={i} onClick={()=>goToPage(i)} style={{ height:10, width:i===currentPage?28:10, border:"none", cursor:"pointer", padding:0, background:i===currentPage?"#0043d0":"#c7d7f5", borderRadius:i===currentPage?5:50, transition:"all .3s cubic-bezier(.34,1.56,.64,1)", transform:i===currentPage?"scale(1.4)":"scale(1)" }}/>
          ))}
        </div>
        <button onClick={goToNext} disabled={currentPage===total-1||flipping} style={{ background:"linear-gradient(135deg,#1e3a8a,#0043d0)", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontWeight:700, fontSize:"0.8rem", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", boxShadow:"0 4px 12px rgba(0,67,208,.25)", opacity:currentPage===total-1||flipping?.4:1, transition:"all .2s" }}>Next →</button>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.75rem", color:"#6b7280", fontWeight:600, letterSpacing:"0.05em" }}>Page {currentPage+1} of {total}</div>
    </div>
  );
}

/* ── EVENTS SCROLL ── */
function EventsScroll() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ width:"100%", maxWidth:480 }}>
        {/* Top rod */}
        <div style={{ height:28, background:"linear-gradient(180deg,#5c3010,#b06820 20%,#e8a84a 40%,#f5c870 50%,#e8a84a 60%,#b06820 80%,#5c3010)", borderRadius:14, boxShadow:"0 5px 14px rgba(0,0,0,.38),inset 0 1px 3px rgba(255,255,255,.28)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 6px", position:"relative", zIndex:2 }}>
          {[0,1].map(i=><div key={i} style={{ width:32, height:32, borderRadius:"50%", background:"radial-gradient(circle at 38% 35%,#f5c870,#c98030 35%,#7a4010 70%,#4a2008)", boxShadow:"0 2px 8px rgba(0,0,0,.4),inset 0 1px 2px rgba(255,255,255,.22)" }}/>)}
        </div>
        {/* Parchment */}
        <div style={{ background:"linear-gradient(158deg,#f9ead0,#f2dda8 15%,#eeddb0 35%,#f3e4b8 55%,#eddaa5 75%,#f0dcaa)", borderLeft:"18px solid", borderRight:"18px solid", borderImage:"linear-gradient(180deg,#7a5020,#c09050 25%,#e8c880 50%,#c09050 75%,#7a5020) 1", padding:"1.25rem 1.5rem 1.5rem", position:"relative" }}>
          <div style={{ position:"absolute", inset:12, border:"1.5px solid rgba(160,120,60,.18)", borderRadius:1, pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1rem" }}>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,transparent,#a07848,transparent)" }}/>
            <div style={{ width:7, height:7, background:"#a07848", transform:"rotate(45deg)", opacity:.65 }}/>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,transparent,#a07848,transparent)" }}/>
          </div>
          {eventsData.map((ev,i) => (
            <div key={i} onClick={()=>setSelectedEvent(ev)}
              style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.65rem", marginBottom:"0.5rem", borderRadius:8, background:"rgba(255,255,255,.42)", border:"1px solid rgba(160,120,60,.2)", cursor:"pointer", transition:"background .25s,transform .25s,box-shadow .25s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,.68)"; e.currentTarget.style.transform="translateX(4px)"; e.currentTarget.style.boxShadow="3px 4px 16px rgba(0,67,208,.12)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,.42)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
              <div style={{ width:66, height:66, borderRadius:6, overflow:"hidden", flexShrink:0, border:"2px solid rgba(160,120,60,.28)", boxShadow:"0 2px 6px rgba(0,0,0,.15)" }}>
                <img src={ev.imageUrl} alt={ev.title} style={{ width:"100%", height:"100%", objectFit:"cover", filter:"sepia(8%)" }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <h3 style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:"0.93rem", fontWeight:500, color:"#2c1608", margin:"0 0 0.25rem", lineHeight:1.35, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{ev.title}</h3>
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.75rem", color:"#7a5030", marginBottom:"0.4rem", fontFamily:"'EB Garamond',serif", fontStyle:"italic" }}>
                  <CalendarIcon/><span>{ev.eventDate}</span>
                </div>
                <button onClick={e=>{ e.stopPropagation(); setSelectedEvent(ev); }}
                  style={{ background:"linear-gradient(135deg,#0043d0,#1e3a8a)", color:"#fff", border:"none", borderRadius:5, padding:"4px 12px", fontSize:"0.68rem", fontWeight:700, fontFamily:"'Cinzel',serif", letterSpacing:"0.06em", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,67,208,.28)", transition:"all .2s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background="linear-gradient(135deg,#fb923c,#f97316)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background="linear-gradient(135deg,#0043d0,#1e3a8a)"; }}>Details</button>
              </div>
            </div>
          ))}
          <div style={{ textAlign:"center", marginTop:"0.75rem", fontSize:"0.9rem", color:"#a07848", letterSpacing:"1em", opacity:.4 }}>· · ·</div>
        </div>
        {/* Bottom rod */}
        <div style={{ height:28, background:"linear-gradient(180deg,#5c3010,#b06820 20%,#e8a84a 40%,#f5c870 50%,#e8a84a 60%,#b06820 80%,#5c3010)", borderRadius:14, boxShadow:"0 5px 14px rgba(0,0,0,.38),inset 0 1px 3px rgba(255,255,255,.28)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 6px", position:"relative", zIndex:2 }}>
          {[0,1].map(i=><div key={i} style={{ width:32, height:32, borderRadius:"50%", background:"radial-gradient(circle at 38% 35%,#f5c870,#c98030 35%,#7a4010 70%,#4a2008)", boxShadow:"0 2px 8px rgba(0,0,0,.4),inset 0 1px 2px rgba(255,255,255,.22)" }}/>)}
        </div>
      </div>

      {/* Modal */}
      {selectedEvent && (
        <div onClick={e=>{ if(e.target===e.currentTarget) setSelectedEvent(null); }}
          style={{ position:"fixed", inset:0, background:"rgba(10,5,0,.78)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", backdropFilter:"blur(6px)", animation:"modalIn .3s ease" }}>
          <div style={{ width:"100%", maxWidth:460, animation:"modalSlide .4s cubic-bezier(.22,1,.36,1)" }}>
            <div style={{ height:24, background:"linear-gradient(180deg,#5c3010,#b06820 20%,#e8a84a 40%,#f5c870 50%,#e8a84a 60%,#b06820 80%,#5c3010)", borderRadius:12, boxShadow:"0 5px 14px rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 6px", position:"relative", zIndex:2 }}>
              {[0,1].map(i=><div key={i} style={{ width:28, height:28, borderRadius:"50%", background:"radial-gradient(circle at 38% 35%,#f5c870,#c98030 35%,#7a4010 70%,#4a2008)", boxShadow:"0 2px 8px rgba(0,0,0,.4)" }}/>)}
            </div>
            <div style={{ background:"linear-gradient(158deg,#f9ead0,#f2dda8 15%,#eeddb0 40%,#f3e4b8 65%,#eddaa5 85%,#f0dcaa)", borderLeft:"16px solid", borderRight:"16px solid", borderImage:"linear-gradient(180deg,#7a5020,#c09050 25%,#e8c880 50%,#c09050 75%,#7a5020) 1", padding:"1.5rem 1.25rem 1rem", position:"relative", margin:"0 -1px" }}>
              <div style={{ position:"absolute", inset:10, border:"1px solid rgba(160,120,60,.16)", borderRadius:1, pointerEvents:"none" }}/>
              <button onClick={()=>setSelectedEvent(null)} style={{ position:"absolute", top:10, right:12, background:"none", border:"none", fontSize:"1.1rem", color:"#7a5030", cursor:"pointer", padding:"4px 8px", borderRadius:4, lineHeight:1, zIndex:10 }}>✕</button>
              <div style={{ textAlign:"center", fontSize:"0.9rem", color:"#a07848", letterSpacing:"0.5em", opacity:.6, marginBottom:"0.25rem" }}>✦ ✦ ✦</div>
              <h2 style={{ fontFamily:"'Cinzel',Georgia,serif", fontSize:"clamp(.9rem,3vw,1.15rem)", fontWeight:700, color:"#2c1608", textAlign:"center", margin:"0 0 0.5rem", lineHeight:1.3, letterSpacing:"0.03em" }}>{selectedEvent.title}</h2>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", margin:"0.4rem 0 0.75rem" }}>
                <div style={{ flex:1, height:1, background:"linear-gradient(90deg,transparent,#a07848,transparent)" }}/>
                <div style={{ width:6, height:6, background:"#a07848", transform:"rotate(45deg)", opacity:.6 }}/>
                <div style={{ flex:1, height:1, background:"linear-gradient(90deg,transparent,#a07848,transparent)" }}/>
              </div>
              <div style={{ width:"100%", height:160, borderRadius:4, overflow:"hidden", marginBottom:"0.75rem", border:"2px solid rgba(160,120,60,.26)", boxShadow:"0 4px 12px rgba(0,0,0,.15)" }}>
                <img src={selectedEvent.imageUrl} alt={selectedEvent.title} style={{ width:"100%", height:"100%", objectFit:"cover", filter:"sepia(10%) contrast(105%)", display:"block" }}/>
              </div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(160,120,60,.1)", border:"1px solid rgba(160,120,60,.24)", borderRadius:4, padding:"3px 10px", fontFamily:"'EB Garamond',serif", fontSize:"0.85rem", color:"#4a2c1a", marginBottom:"0.7rem", fontStyle:"italic" }}>
                <CalendarIcon/><span>{selectedEvent.eventDate}</span>
              </div>
              <p style={{ fontFamily:"'EB Garamond',serif", fontSize:"0.93rem", color:"#4a2c1a", lineHeight:1.8, fontStyle:"italic", textAlign:"justify", borderLeft:"3px solid rgba(160,120,60,.28)", paddingLeft:"0.6rem", margin:"0 0 0.9rem" }}>{selectedEvent.description}</p>
              <button style={{ width:"100%", background:"linear-gradient(135deg,#1e3a8a,#2563eb)", color:"#fff", border:"none", borderRadius:6, padding:"9px 24px", fontFamily:"'Cinzel',serif", fontSize:"0.78rem", fontWeight:700, letterSpacing:"0.08em", cursor:"pointer", boxShadow:"0 4px 14px rgba(30,58,138,.28)", transition:"all .3s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="linear-gradient(135deg,#f97316,#ea580c)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="linear-gradient(135deg,#1e3a8a,#2563eb)"; }}>Register / Know More</button>
            </div>
            <div style={{ height:24, background:"linear-gradient(180deg,#5c3010,#b06820 20%,#e8a84a 40%,#f5c870 50%,#e8a84a 60%,#b06820 80%,#5c3010)", borderRadius:12, boxShadow:"0 5px 14px rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 6px", zIndex:2 }}>
              {[0,1].map(i=><div key={i} style={{ width:28, height:28, borderRadius:"50%", background:"radial-gradient(circle at 38% 35%,#f5c870,#c98030 35%,#7a4010 70%,#4a2008)", boxShadow:"0 2px 8px rgba(0,0,0,.4)" }}/>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function NewsAndEvents() {
  return (
    <div style={{ minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#d6eaff 0%,#e3f2fd 40%,#f0f7ff 70%,#fff 100%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        @keyframes rotateGear1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rotateGear2 { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes bookFloat { 0%,100%{transform:translateY(0) rotateX(2deg)} 50%{transform:translateY(-6px) rotateX(2deg)} }
        @keyframes curlPulse { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.6;transform:scale(1.1)} }
        @keyframes flipFwd { 0%{transform:perspective(1200px) rotateY(0deg);transform-origin:left center} 100%{transform:perspective(1200px) rotateY(-180deg);transform-origin:left center} }
        @keyframes flipBwd { 0%{transform:perspective(1200px) rotateY(-180deg);transform-origin:left center} 100%{transform:perspective(1200px) rotateY(0deg);transform-origin:left center} }
        @keyframes modalIn { from{opacity:0} to{opacity:1} }
        @keyframes modalSlide { from{opacity:0;transform:scale(.88) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes titleSlide { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }

        .gear-bg { position:absolute; pointer-events:none; user-select:none; z-index:0; }
        .gear-bg.g1 { width:350px;height:350px;top:-80px;right:-80px;opacity:.06;animation:rotateGear1 25s linear infinite; }
        .gear-bg.g2 { width:280px;height:280px;bottom:-60px;left:-60px;opacity:.06;animation:rotateGear2 30s linear infinite; }
        .gear-bg.g3 { width:220px;height:220px;top:40%;right:10%;opacity:.05;animation:rotateGear1 35s linear infinite; }
        .gear-bg.g4 { width:160px;height:160px;top:12%;left:5%;opacity:.04;animation:rotateGear2 20s linear infinite; }

        .section-col { flex:1; min-width:340px; max-width:520px; display:flex; flex-direction:column; align-items:center; }

        .divider-vert { width:2px; background:linear-gradient(180deg,transparent,rgba(0,67,208,.15) 20%,rgba(0,67,208,.25) 50%,rgba(0,67,208,.15) 80%,transparent); flex-shrink:0; align-self:stretch; margin:0 1rem; }

        @media(max-width:900px){
          .two-col { flex-direction:column !important; align-items:center; }
          .divider-vert { width:80%; height:2px; background:linear-gradient(90deg,transparent,rgba(0,67,208,.2) 20%,rgba(0,67,208,.3) 50%,rgba(0,67,208,.2) 80%,transparent); margin:1.5rem 0; align-self:auto; }
          .section-col { max-width:95vw; min-width:0; width:100%; }
        }
        @media(max-width:600px){
          .book-inner { width:300px !important; height:460px !important; }
        }
      `}</style>

      {/* Background gears */}
      <svg className="gear-bg g1" viewBox="0 0 512 512"><path fill="#0043d0" d={G1}/></svg>
      <svg className="gear-bg g2" viewBox="0 0 512 512"><path fill="#fb923c" d={G2}/></svg>
      <svg className="gear-bg g3" viewBox="0 0 512 512"><path fill="#003087" d={G1}/></svg>
      <svg className="gear-bg g4" viewBox="0 0 512 512"><path fill="#0043d0" d={G2}/></svg>

      {/* Page header */}
      <div style={{ position:"relative", zIndex:1, background:"linear-gradient(135deg,#1a237e,#283593 50%,#1a237e)", padding:"1.25rem 1rem", textAlign:"center", boxShadow:"0 4px 20px rgba(0,0,0,.25)" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(255,255,255,.03) 60px,rgba(255,255,255,.03) 61px)", pointerEvents:"none" }}/>
        <h1 style={{ position:"relative", fontFamily:"'Cinzel',Georgia,serif", fontSize:"clamp(1.3rem,4vw,1.9rem)", fontWeight:700, color:"#fff", letterSpacing:"0.15em", margin:0, textShadow:"0 2px 8px rgba(0,0,0,.35)" }}>NEWS &amp; EVENTS</h1>
      </div>

      {/* Two-column layout */}
      <div className="two-col" style={{ display:"flex", justifyContent:"center", alignItems:"flex-start", gap:0, padding:"2.5rem 2rem 4rem", position:"relative", zIndex:1, flexWrap:"wrap" }}>

        {/* NEWS column */}
        <div className="section-col">
          <div style={{ textAlign:"center", marginBottom:"2rem", animation:"titleSlide .8s cubic-bezier(.16,1,.3,1)" }}>
            <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"clamp(2rem,5vw,3rem)", fontWeight:900, color:"#1e3a8a", letterSpacing:"0.1em", margin:0, textShadow:"2px 2px 8px rgba(0,67,208,.1)" }}>NEWS</h2>
            <div style={{ height:4, width:120, margin:"0.75rem auto 0", background:"linear-gradient(90deg,#0043d0,#fb923c)", borderRadius:2 }}/>
          </div>
          <NewsBook/>
        </div>

        {/* Vertical divider */}
        <div className="divider-vert"/>

        {/* EVENTS column */}
        <div className="section-col">
          <div style={{ textAlign:"center", marginBottom:"2rem", animation:"titleSlide .8s cubic-bezier(.16,1,.3,1) .15s both" }}>
            <h2 style={{ fontFamily:"'Cinzel',Georgia,serif", fontSize:"clamp(1.8rem,4vw,2.6rem)", fontWeight:700, color:"#1e3a8a", letterSpacing:"0.12em", margin:0 }}>OUR EVENTS</h2>
            <p style={{ fontFamily:"'Cinzel',serif", fontSize:"0.85rem", fontWeight:600, color:"#4b5563", letterSpacing:"0.06em", margin:"0.3rem 0 0" }}>Our Upcoming Events</p>
            <div style={{ height:4, width:140, margin:"0.65rem auto 0", background:"linear-gradient(90deg,#0043d0,#fb923c)", borderRadius:2 }}/>
          </div>
          <EventsScroll/>
        </div>
      </div>
    </div>
  );
}