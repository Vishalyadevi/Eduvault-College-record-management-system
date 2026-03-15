import React, { useState } from "react";

const newsData = [
  {
    title: "Virtually inaugurated a Rs.4.97 crore initiative to foster startups",
    date: "March 06, 2025",
    image: "https://nec.edu.in/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-06-at-11.19.48-AM.jpeg",
  },
  {
    title: "AICTE IDEA Lab Scheme",
    date: "January 21, 2025",
    image: "https://nec.edu.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-01-21-at-10.02.44-AM.webp",
  },
  {
    title: "10th State Level Quiz Competition",
    date: "October 25, 2024",
    image: "https://nec.edu.in/wp-content/uploads/2025/02/IMG-20241024-WA0001.webp",
  },
  {
    title: "1st prize in Drawing Competition at Puthaga Thiruvizha’24",
    date: "October 18, 2024",
    image: "https://nec.edu.in/wp-content/uploads/2025/02/DrawingCompititionNews836x836.webp",
  },
  {
    title: "TOP 2% SCIENTISTS OF THE WORLD (Elsevier & Standford University) – Great Achievement",
    date: "03/10/2024",
    image: "https://nec.edu.in/wp-content/uploads/2024/10/IMG-20241001-WA0001.jpg",
  },
  {
    title: "Signed MoU with Mtutor",
    date: "23/03/2024",
    image: "https://nec.edu.in/wp-content/uploads/2025/03/Mtutor-Mou-Poster-copy-scaled-1.jpg",
  },
  {
    title: "1st prize in Drawing Competition at Puthaga Thiruvizha’24",
    date: "October 18, 2024",
    image: "https://nec.edu.in/wp-content/uploads/2025/03/NIRF-Ranking-Poster-copy-scaled-1.jpg",
  },


];

const NewsSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-gradient-to-r from-white via-sky-200 py-10 px-6 text-center">
      <h2 className="text-4xl font-bold text-blue-900 mb-10">NEWS</h2>

      {/* View More Button aligned right */}

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
        {newsData.map((item, index) => (
          <div
            key={index}
            className="rounded-0xl overflow-hidden flex flex-col items-center group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="overflow-hidden w-full h-85">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <h3
                className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                  hoveredIndex === index ? "text-blue-700" : "text-gray-800"
                }`}
              >
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{item.date}</p>
              <button
                className="bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-900"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                Know more
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsSection;
