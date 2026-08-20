import React from "react";

import "./FeePaymentGuide.css";
import { FaFilePdf } from 'react-icons/fa';
const DeanSection = () => {
    const headingStyle = {
        fontFamily: "'Georgia', 'Times', serif",
        fontWeight: 400,
        fontSize: "1.2rem",
        lineHeight: "1.2em",
        color: "black", // Default color
        margin: "0 0 20px 0",
        padding: 0,
        textTransform: "uppercase",
        letterSpacing: "-0.5px",
        transition: "color 0.3s ease"
    };

    const members = [
        { name: "Dr.A.Shenbagavalli", designation: "Dean (Academic)" },
        { name: "Dr.K.Mohaldeen Pitchai", designation: "Professor/ CSE" },
        { name: "Dr.F.Micheal Thomas Rex", designation: "Asso. Professor/Mech." },
        { name: "Dr.K.J.Prasanna Venkatesan", designation: "Asso. Professor/ECE." },
        { name: "Dr.S.Geetha", designation: "Asso. Professor/Sci. & Hum." },
        { name: "Ms.R.Chermasskhli", designation: "Assistant" },
    ];

    const deanImageUrl = "https://nec.edu.in/wp-content/uploads/2024/01/Dr.A.Shenbagavalli-1-e1691057756228.jpg";

    return (
         <div className="fee-page-wrapper">
      {/* Banner */}
      <div className="fee-banner">
        <h1 className="fee-title">ACADEMIC</h1>
      </div>
        <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
               
            {/* Image + Content Section */}
            <section className="flex flex-col md:flex-row gap-8 mb-12">
                {/* Left Side - Image Card */}
                <div className="w-full md:w-1/3 group">
                    <div className="bg-gray-100 shadow-[0_0_15px_3px_rgba(14,43,100,0.4)] p-6 flex flex-col items-center text-center transition-all duration-300 hover:bg-[#0e2b73] scale-105 h-85 w-95">
                        <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-white shadow-md">
                            <img 
                                src={deanImageUrl} 
                                alt="Dean (Academic) Portrait"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.querySelector('.image-placeholder')!.classList.remove('hidden');
                                }}
                            />
                            <div className="image-placeholder hidden h-full flex items-center justify-center">
                                <span className="text-gray-400">Dean's Image</span>
                            </div>
                        </div>
                        <div className="p-6 ">
                            <h3 className="group-hover:text-white" style={headingStyle}>
                                Dr.A.Shenbagavalli
                            </h3>
                            <p className="text-gray-600 text-center mt-2 group-hover:text-white">
                                Dean (Academic)
                            </p>
                            <br></br>
                           <div className="flex gap-4 justify-center items-center">
  <a
    href="https://nec.edu.in/wp-content/uploads/2024/01/02.Dr_.A.SHENBAGAVALLI.-final-08.07.2023doc.pdf"
    target="_blank"
    rel="noopener noreferrer"
    className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition duration-300 flex justify-center items-center"
  >
    <FaFilePdf size={18} />
  </a>
</div>


                        </div>
                    </div>
                </div>
             
                {/* Right Side - Content */}
                <div className="w-full md:w-2/3">
                   <br></br>
                   <br></br>
                    <br></br>
                    <h4 className="mb-5 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold">DEAN (ACADEMIC)</strong>
        </h4>
                    <p className="border-0 m-0 p-0 text-base box-border mb-6 text-black Times text-justify">
          The office of the Dean (Academic) was established in the year 2010 to administer all academic activities of the Institution.
           The Academic Dean is responsible for all academic matters pertaining to U.G. and P.G. programmes offered by the Institute. 
           This office revises the U.G. and P.G. Regulations, curriculum and syllabus of all branches of Engineering, 
           Technology & Science and Humanities as per the guidelines of UGC, AICTE and Anna University, Chennai.
        </p>
                </div>
            </section>

            {/* Table Section */}
            <section className="bg-white">
                <div className="p-4">
                    <div className="table-wrapper">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Name of the members</th>
                                    <th>Designation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{member.name}</td>
                                        <td>{member.designation}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
        </div>
    );
};

export default DeanSection;
