import React from "react";
import "./FeePaymentGuide.css"; // Your external CSS file

const approvalLetters = [
  { id: 1, name: "Mech-ECE-CSE-Approval 19.08.1993-Period 1993-94", url: "https://nec.edu.in/wp-content/uploads/2024/01/1.-Mech-ECE-CSE-Approval-19.08.1993-Period-1993-94.pdf" },
  { id: 2, name: "EIE-ECE-Mech-ECE-CSE-Approval 11.11.1994", url: "https://nec.edu.in/wp-content/uploads/2024/01/1.-Mech-ECE-CSE-Approval-19.08.1993-Period-1993-94.pdf" },
  { id: 3, name: "EIE-EEE-Mech-ECE-CSE-Approval 05.06.1995", url: "https://nec.edu.in/wp-content/uploads/2024/01/3.-EIE-EEE-Mech-ECE-CSE-Approval-05.06.1995-Period-1995-961996-97.pdf" },
  { id: 4, name: "EEE-Approval 03.08.1995-Period 1995-96", url: "https://nec.edu.in/wp-content/uploads/2024/01/4.-EIE-EEE-Approval-03.08.1995-Period-1995-96.pdf" },
  { id: 5, name: "EIE-EEE-Mech-ECE-CSE-Approval 08.04.1996", url: "https://nec.edu.in/wp-content/uploads/2024/01/5.-EIE-EEE-Mech-ECE-CSE-Approval-08.04.1996-Period-1996-98.pdf" },
  { id: 6, name: "EIE-ECE-Mech-ECE-CSE-Approval 22.01.1999", url: "https://nec.edu.in/wp-content/uploads/2024/01/6.-EIE-EEE-Mech-ECE-CSE-Approval-22.01.1999-Period-1998-2000.pdf" },
  { id: 7, name: "M.Tech(Production)-Approval 21.10.1999", url: "https://nec.edu.in/wp-content/uploads/2024/01/7.-M.TechProduction-Approval-21.10.1999-Period-1999-2000.pdf" },
  { id: 8, name: "EEE-EEE-Mech-ECE-CSE-Approval 14.11.2000", url: "https://nec.edu.in/wp-content/uploads/2024/01/8.-EIE-EEE-Mech-ECE-CSE-Approval-14.11.2000-Period-2000-2001.pdf" },
  { id: 9, name: "EIE-EEE-Mech-ECE-CSE-IT-Approval 22.06.2001", url: "https://nec.edu.in/wp-content/uploads/2024/01/9.-EIE-EEE-Mech-ECE-CSE-IT-Approval-22.06.2001-Period-2001-2003.pdf" },
  { id: 10, name: "M.E(CSE)-Approval 08.10.2001", url: "https://nec.edu.in/wp-content/uploads/2024/01/10.-M.EComputer-Science-Engineering-Approval-08.10.2001-Period-2001-2004.pdf" },
  { id: 11, name: "EIE-EEE-Mech-ECE-CSE-IT-Approval 30.04.2003", url: "https://nec.edu.in/wp-content/uploads/2024/01/11.-EIE-EEE-Mech-ECE-CSE-IT-Approval-30.04.2003-Period-2003-2005.pdf" },
  { id: 12, name: "M.E(Communication Systems)-Approval 07.07.2003", url: "https://nec.edu.in/wp-content/uploads/2024/01/12.-M.ECommuication-Systems-Approval-07.07.2003-Period-2003-05.pdf" },
  { id: 13, name: "M.Tech(Production)&M.E(CSE)-Approval 21.08.2003", url: "https://nec.edu.in/wp-content/uploads/2024/01/13.-M.TechProductionM.ECSE-Approval-21.08.2003-Period-2003-05.pdf" },
  { id: 14, name: "M.E(Computer Communication)-Approval 25.06.2004", url: "https://nec.edu.in/wp-content/uploads/2024/01/14.-M.EComputerCommuication-Approval-25.06.2004-Period-2004-06.pdf" },
  { id: 15, name: "M.E(Energy Engineering)-Approval 25.06.2004", url: "https://nec.edu.in/wp-content/uploads/2024/01/15.-M.EEnergy-Engineering-Approval-25.06.2004-Period-2004-06.pdf" },
  { id: 16, name: "All departments-Approval 19.09.2005", url: "https://nec.edu.in/wp-content/uploads/2024/01/16.-All-departments-Approval-19.09.2005-Period-2005-06.pdf" },
  { id: 17, name: "All department UG & PG-Approval 10.08.2006", url: "https://nec.edu.in/wp-content/uploads/2024/01/17.-All-department-UG-PG-Approval-10.08.2006-Period-2006-2007.pdf" },
  { id: 18, name: "All department UG & PG-Approval 02.07.2007", url: "https://nec.edu.in/wp-content/uploads/2024/01/18.-All-department-UG-PG-Approval-02.07.2007-Period-2007-2008.pdf" },
  { id: 19, name: "All department UG & PG-Approval 02.05.2008", url: "https://nec.edu.in/wp-content/uploads/2024/01/19.-All-department-UG-PG-Approval-02.05.2008-Period-2008-2009.pdf" },
  { id: 20, name: "All department UG & PG-Approval 28.05.2009", url: "https://nec.edu.in/wp-content/uploads/2024/01/20.-All-department-UG-PG-Approval-28.05.2009-Period-2009-2010.pdf" },
  { id: 21, name: "All department UG & PG-Approval 23.08.2010", url: "/pdfs/approval21.pdf" },
  { id: 22, name: "All department UG & PG-Approval 01.09.2011", url: "/pdfs/approval22.pdf" },
  { id: 23, name: "All department UG & PG-Approval 10.05.2012", url: "/pdfs/approval23.pdf" },
  { id: 24, name: "All department UG & PG-Approval 07.04.2013", url: "/pdfs/approval24.pdf" },
  { id: 25, name: "EOA Report 2014-2015", url: "/pdfs/eoa_2014_2015.pdf" },
  { id: 26, name: "EOA Report 2015-2016", url: "/pdfs/eoa_2015_2016.pdf" },
  { id: 27, name: "EOA Report 2016-2017", url: "/pdfs/eoa_2016_2017.pdf" },
  { id: 28, name: "EOA Report 2017-2018", url: "/pdfs/eoa_2017_2018.pdf" },
  { id: 29, name: "EOA Report 2018-2019", url: "/pdfs/eoa_2018_2019.pdf" },
  { id: 30, name: "EOA Report 2019-2020", url: "/pdfs/eoa_2019_2020.pdf" },
  { id: 31, name: "EOA Report 2020-2021", url: "/pdfs/eoa_2020_2021.pdf" },
  { id: 32, name: "EOA Report 2021-2022", url: "/pdfs/eoa_2021_2022.pdf" },
  { id: 33, name: "EOA Report 2022-2023", url: "/pdfs/eoa_2022_2023.pdf" },
  { id: 34, name: "EOA Report 2023-2024", url: "/pdfs/eoa_2023_2024.pdf" },
  { id: 35, name: "EOA Report 2024-2025", url: "/pdfs/eoa_2024_2025.pdf" },
  { id: 36, name: "EOA Report 2025-2026", url: "/pdfs/eoa_2025_2026.pdf" },
];

const ApprovalLetters = () => {
  return (
    <div className="fee-page1">
      <div className="fee-banner">
        <h1 className="fee-title">AICTE Approval Letters</h1>
      </div><br></br>
    
     
      <h2 className="text-4xl lg:text-4xl font-bold text-blue-700 font-serif mb-4" >
        <br></br> &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;AICTE SCHEME
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

export default ApprovalLetters;
