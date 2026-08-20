import React from "react";
import "./FeePaymentGuide.css";

const academicCouncilItems = [
  "Academic Council Members",
  "Rules and Functions of Academic Council",
  "Minutes of the Academic Council Meetings",
];

const boardOfStudiesItems = [
  "Members of the Board of Studies",
  "Rules and Functions of the Board of Studies",
  "Minutes of the Board of Studies",
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

const ACADEMICCOUNCIL = () => {
  return (
    <div className="bg-gray-50">
      <div className="fee-banner">
        <h1 className="fee-title">ACADEMIC COUNCIL</h1>
      </div>

      <div className="ml-[10%] mt-10">
        {/* Academic Council Section */}
        <h2 className="text-3xl font-serif font-bold text-blue-900 mb-4">
          Academic Council
        </h2>
        <div className="space-y-4 ml-6">
          {academicCouncilItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <OrangeTickIcon />
              <span className="text-lg">{item}</span>
            </div>
          ))}
        </div>

        {/* Board of Studies Section */}
        <h2 className="text-3xl font-serif font-bold text-blue-900 mt-10 mb-4">
          Board of Studies
        </h2>
        <div className="space-y-4 ml-6">
          {boardOfStudiesItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <OrangeTickIcon />
              <span className="text-lg">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <br></br>
      <br></br>
    </div>
  );
};

export default ACADEMICCOUNCIL;
