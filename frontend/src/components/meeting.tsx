import React from "react";
import "./FeePaymentGuide.css"; // Your external CSS file

const approvalLetters = [
  { id: 1, name: "First finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/1.-Mech-ECE-CSE-Approval-19.08.1993-Period-1993-94.pdf" },
  { id: 2, name: "Second finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/1.-Mech-ECE-CSE-Approval-19.08.1993-Period-1993-94.pdf" },
  { id: 3, name: "Third finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/3.-EIE-EEE-Mech-ECE-CSE-Approval-05.06.1995-Period-1995-961996-97.pdf" },
  { id: 4, name: "Fourth finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/4.-EIE-EEE-Approval-03.08.1995-Period-1995-96.pdf" },
  { id: 5, name: "Fifth finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/5.-EIE-EEE-Mech-ECE-CSE-Approval-08.04.1996-Period-1996-98.pdf" },
  { id: 6, name: "Sixth finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/6.-EIE-EEE-Mech-ECE-CSE-Approval-22.01.1999-Period-1998-2000.pdf" },
  { id: 7, name: "Seventh finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/7.-M.TechProduction-Approval-21.10.1999-Period-1999-2000.pdf" },
  { id: 8, name: "Eighth finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/8.-EIE-EEE-Mech-ECE-CSE-Approval-14.11.2000-Period-2000-2001.pdf" },
  { id: 9, name: "Nineth finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/9.-EIE-EEE-Mech-ECE-CSE-IT-Approval-22.06.2001-Period-2001-2003.pdf" },
  { id: 10, name: "Tenth finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/10.-M.EComputer-Science-Engineering-Approval-08.10.2001-Period-2001-2004.pdf" },
  { id: 11, name: "Eleventh finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/11.-EIE-EEE-Mech-ECE-CSE-IT-Approval-30.04.2003-Period-2003-2005.pdf" },
  { id: 12, name: "Twelfth finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/12.-M.ECommuication-Systems-Approval-07.07.2003-Period-2003-05.pdf" },
  { id: 13, name: "13th finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/13.-M.TechProductionM.ECSE-Approval-21.08.2003-Period-2003-05.pdf" },
  { id: 14, name: "14th finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/14.-M.EComputerCommuication-Approval-25.06.2004-Period-2004-06.pdf" },
  { id: 15, name: "15th finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/15.-M.EEnergy-Engineering-Approval-25.06.2004-Period-2004-06.pdf" },
  { id: 16, name: "16th finance committee meeting minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/16.-All-departments-Approval-19.09.2005-Period-2005-06.pdf" },
  
];

const Meeting = () => {
  return (
    <div className="fee-page1">
      <div className="fee-banner">
        <h1 className="fee-title">FINANCE COMMITTEE MEETING MINUTES</h1>
      </div><br></br>
    
     
      <h2 className="text-4xl lg:text-4xl font-bold text-blue-700 font-serif mb-4" >
        <br></br> &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;Finance Committee Meeting Minutes
      </h2>
 
      
     <ul className="space-y-2 pl-6 sm:pl-8 text-blue-800 text-base sm:text-lg font-medium list-decimal ml-[10%]">
        {approvalLetters.map((letter) => (
          <li key={letter.id} className="transition-colors duration-200">
            <a 
              href={letter.url} 
              target="_self" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-2 hover:text-black"
            >
              <span>{letter.name}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M6 2a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13a1 1 0 0 1-1-1V3.5zM8 13v4H6v-4h2zm1 0h1.5a1.5 1.5 0 0 1 0 3H9v-3zm4.25 0H16a1 1 0 0 1 0 2h-1.25v2H13v-4z" />
              </svg>
            </a>
          </li>
        ))}
      </ul>

    </div>
  );
};

export default Meeting;
