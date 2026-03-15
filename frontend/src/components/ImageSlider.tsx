import React, { useState, useEffect } from 'react';

const images = [
  {
    name: 'Thiru. K. Ramasamy',
    title: 'Founder',
    src: 'https://nec.edu.in/wp-content/uploads/2023/04/CHAIRMAN-copy.webp',
  },
  {
    name: 'Thiru K. Arunachalam',
    title: 'Correspondent',
    src: 'https://nec.edu.in/wp-content/uploads/2023/04/2X5A0289-copy.webp',
  },
  {
    name: 'Dr. S. Shanmugavel',
    title: 'Director',
    src: 'https://nec.edu.in/wp-content/uploads/2023/04/2X5A0322-copy.webp',
  },
  {
    name: 'Dr. K. Kalidasa Murugavel',
    title: 'Principal',
    src: 'https://nec.edu.in/wp-content/uploads/2023/04/principal-kali-copy.webp',
  },
];

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <div className="relative aspect-[3/2] overflow-hidden bg-blue-50">

        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="min-w-full">
              <img
                src={image.src}
                alt={image.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="text-center mt-4">
        <h3 className="font-bold text-xl text-[#003087]">{images[currentIndex].name}</h3>
        <p className="font-bold text-[#003087]">{images[currentIndex].title}</p>
      </div>
    </div>
  );
};

export default ImageSlider;
