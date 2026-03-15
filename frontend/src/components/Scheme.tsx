import React from "react";
import "./FeePaymentGuide.css"; // Your external CSS file

const Scheme = () => {
  return (
    <div className="fee-page2">
      {/* Main Heading */}
     

      {/* Banner */}
      <div className="fee-banner">
        <h1 className="fee-title">AICTE Schemes</h1>
      </div>
      <h2 className="text-4xl lg:text-4xl font-bold text-blue-700 font-serif mb-4 sm:text-3xl md:text-4xl" >
        <br></br> &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;AICTE SCHEME
      </h2>
      {/* Links Section */}
      <div className="space-y-8">
        <div>
          <h5 className="text-base sm:text-lg font-medium text-gray-800 mb-2 ml-[10%]">
            For the Attention of Students: Click below to view scholarship schemes and other facilities by AICTE.
          </h5>
          <a
            href="https://www.aicte-india.org/opportunities/students/overview"
            target="_self"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-black break-words ml-[10%]"
          >
            https://www.aicte-india.org/opportunities/students/overview
          </a>
        </div>

        <div>
          <h5 className="text-base sm:text-lg font-medium text-gray-800 mb-2 ml-[10%]">
            For the Attention of Faculty and Students: Click below to view AICTE collaborations (MoUs) with organizations.
          </h5>
          <a
            href="https://www.aicte-india.org/education/collaborations"
            target="_self"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-black break-words ml-[10%]"
          >
            https://www.aicte-india.org/education/collaborations
          </a>
        </div>
      </div>
    </div>
  );
};

export default Scheme;
