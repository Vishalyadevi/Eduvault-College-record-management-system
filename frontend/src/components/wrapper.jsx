import React from 'react';

const SectionWrapper = ({ title, children }) => {
  return (
    <section className="bg-white w-full p-4 sm:p-6 md:p-8 rounded-lg mb-6">
      {title && (
        <h4 className="mb-4 text-xl sm:text-2xl font-bold font-serif text-[darkblue]">
          {title}
        </h4>
      )}
      <div className="text-[15px] text-black font-sans leading-[1.8] text-justify whitespace-pre-wrap">
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;