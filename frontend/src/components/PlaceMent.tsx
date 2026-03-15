import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import "./Placement.css"; // Use the new CSS file

const data = [
  {
    imageUrl:
      "https://nec.edu.in/wp-content/uploads/2023/12/website-infographic6-e1703842523518.png",
  },
  {
    imageUrl:
      "https://nec.edu.in/wp-content/uploads/2023/12/website-infographic2-e1703839759634.png",
  },
  {
    imageUrl:
      "https://nec.edu.in/wp-content/uploads/2023/12/website-infographic4-e1703842577372.png",
  },
  {
    imageUrl:
      "https://nec.edu.in/wp-content/uploads/2023/12/website-infographic5-e1703842248136.png",
  },
  {
    imageUrl:
      "https://nec.edu.in/wp-content/uploads/2023/12/website-infographic3-e1703842648313.png",
  },
  {
    imageUrl:
      "https://nec.edu.in/wp-content/uploads/2023/12/website-infographic1-e1703841544438.png",
  },
];

export default function PlacementHighlights() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [hasAnimated]);

  const visibleItems = Array.from({ length: 4 }, (_, i) => data[(currentIndex + i) % data.length]);

  return (
    <section
      ref={ref}
      className="py-12 px-6 bg-blue-50 overflow-hidden relative"
      id="placement-statistics"
    >
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-1xl lg:text-5xl font-bold text-blue-900 font-serif mb-12 text-center"
      >
        PLACEMENT STATISTICS
      </motion.h2>

      <div className="relative h-[180px] w-full flex justify-center items-center">
        <AnimatePresence initial={false}>
          {hasAnimated && (
            <motion.div
              key={currentIndex}
              className="flex gap-8 absolute"
              initial={{ x: "80%", opacity: 0 }}
              animate={{ x: "0%", opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              {visibleItems.map((item, idx) => (
                <div
                  key={idx}
                  className="placement-card relative overflow-hidden rounded-0xl p-6 flex items-center justify-center transform transition-transform duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
                >
                  {/* Blueprint corner markers (only for Option 5) */}
                  <div className="blueprint-corners corner-tl"></div>
                  <div className="blueprint-corners corner-tr"></div>
                  <div className="blueprint-corners corner-bl"></div>
                  <div className="blueprint-corners corner-br"></div>
                  
                  <img
                    src={item.imageUrl}
                    alt={`placement-${idx}`}
                    className="max-w-[80%] max-h-[100%] object-contain z-10 relative"
                    style={{ userSelect: "none" }}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}