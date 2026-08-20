import React from "react";
import { FaGraduationCap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ApplyNowRotatedBox = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/admission")}
      className="fixed right-[20px] top-[40%] z-[9999] transform -rotate-90 origin-right
        bg-gradient-to-r from-sky-400 to-sky-700 text-white w-fit text-lg font-semibold py-2 px-6 
        flex items-center gap-2 shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_15px_rgba(0,0,0,0.3)]
        transition-all duration-300 hover:scale-105"
      style={{ borderRadius: "10px 10px 0px 0px" }}
    >
      <span>Apply Now</span>
      <FaGraduationCap className="text-white text-[24px]" />
    </button>
  );
};

export default ApplyNowRotatedBox;
