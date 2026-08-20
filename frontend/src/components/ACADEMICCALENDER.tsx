import React from "react";
import "./FeePaymentGuide.css";
const regulations1= [
  { label: "First Year UG Calendar 2024-2025", url: "/pdfs/ug-regulation-2023.pdf" },
  { label: "SECOND YEAR – B.E. / B.Tech. / M.E. / M.Tech. DEGREE PROGRAMME 2024-2025", url: "/pdfs/pg-regulation-2023.pdf" },
  { label: "ODD SEM Third & Final Year Academic calender 2024-2025", url: "/pdfs/ug-regulation-2019.pdf" },
  { label: "First Year M.E M.Tech 2024-25 Academic calender", url: "/pdfs/pg-regulation-2019.pdf" },
];
const OrangeTickIcon = () => (
  <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center mt-1">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-9 h-9 text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.19 9.205-4.548-4.548a1 1 0 1 0-1.414 1.414l5.255 5.255a1 1 0 0 0 1.414 0l9.897-9.908z" />
    </svg>
  </div>
);
const ACADEMICCALENDER = () => {
  return (
    <div className="bg-gray-50 min-h-2 ">
         <div className="fee-banner">
        <h1 className="fee-title">ACADEMIC CALENDER</h1>
      </div><br></br>
      <div className="space-y-4 ml-[10%]">
        {regulations1.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_self"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 font-semibold text-lg hover:text-black  px-3 py-2 rounded transition-all w-fit"
          >
            <OrangeTickIcon />&nbsp;&nbsp;&nbsp;&nbsp;
            {item.label}
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M6 2a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13a1 1 0 0 1-1-1V3.5zM8 13v4H6v-4h2zm1 0h1.5a1.5 1.5 0 0 1 0 3H9v-3zm4.25 0H16a1 1 0 0 1 0 2h-1.25v2H13v-4z" />
              </svg>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ACADEMICCALENDER;
