import React, { useState } from "react";
import { CheckSquare } from "lucide-react"; // Icon library
import "./FeePaymentGuide.css"; 
const TableComponent = () => {
  const allMembers = [
    // Page 1
    {
      sno: 1,
      name: "Tmt. Chennammal Ramasamy",
      position: "Chairman",
      background: "Industrialist",
    },
    {
      sno: 2,
      name: "Thiru. K.R. Krishnamoorthy",
      position: "Member (Management)",
      background: "Industrialist",
    },
    {
      sno: 3,
      name: "Thiru. K.R. Arunachalam",
      position: "Member (Management)",
      background: "Industrialist",
    },
    {
      sno: 4,
      name: "Thiru. C. Sankaranarayanan",
      position: "Member (Management)",
      background: "Industrialist",
    },
    {
      sno: 5,
      name: "Selvi. A.Shanmathi",
      position: "Member (Management)",
      background: "Industrialist",
    },
    {
      sno: 6,
      name: "Selvan A.Niteesh Ram",
      position: "Member (Management)",
      background: "Industrialist",
    },
    {
      sno: 7,
      name: "Thiru.L.S.Manivannan, Managing Director, L.S.Mills, Theni",
      position: "External Member (Nominated by the Management)",
      background: "Industrialist",
    },
    {
      sno: 8,
      name: "Dr. M.Vijayaraj, Professor & Head, Dept. of ECE, Govt College of Engineering, Tirunelveli – 627 007.",
      position: "University Nominee",
      background: "Academician",
    },
    {
      sno: 9,
      name: "Dr.P. SUBHA KARUVELAM, Professor (CAS), Dept. of EEE, Govt College of Engineering, Tirunelveli – 627 007",
      position: "State Government Nominee",
      background: "Academician",
    },
    {
      sno: 10,
      name: "Dr.M.A.Neelakandan, Senior Dean (Institution & Faculty Affairs), NEC",
      position: "Member (Faculty Nominated by the Principal)",
      background: "Professor",
    },
    // Page 2
    {
      sno: 11,
      name: "Dr.A.Shenbagavalli, Dean (Academic), NEC",
      position: "Member (Faculty Nominated by the Principal)",
      background: "Professor",
    },
    {
      sno: 12,
      name: "Mr.P Jeevanandam",
      position: "Member, Administrative staff",
      background: "Admin. Manager, NEC",
    },
    {
      sno: 13,
      name: "Dr.S Shanmugavel",
      position: "Member",
      background: "Director",
    },
    {
      sno: 14,
      name: "Dr.K.Kalidasa Murugavel",
      position: "Member Secretary",
      background: "Principal",
    },
  ];
const meetingMinutes = [
  { name: "33rd Governing Board Minutes", url: "https://nec.edu.in/wp-content/uploads/2024/01/33rd-Governing-Board-Minutes.pdf" },
  { name: "34th Governing Board Minutes", url: "/pdfs/34th.pdf" },
  { name: "35th Governing Board Minutes", url: "/pdfs/35th.pdf" },
  { name: "36th Governing Board Minutes", url: "/pdfs/36th.pdf" },
  { name: "37th Governing Board Minutes", url: "/pdfs/37th.pdf" },
  { name: "38th Governing Board Minutes", url: "/pdfs/38th.pdf" },
  { name: "39th Governing Board Minutes", url: "/pdfs/39th.pdf" },
];
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(allMembers.length / itemsPerPage);
  const currentData = allMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="fee-page3">
      {/* Scrollable table wrapper */}
      <div className="fee-banner">
        <h1 className="fee-title">GOVERNING COUNCIL</h1>
      </div><br></br>
      <div className="p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-4 border border-gray-300">S.No</th>
              <th className="py-2 px-4 border border-gray-300">Name</th>
              <th className="py-2 px-4 border border-gray-300">Position</th>
              <th className="py-2 px-4 border border-gray-300">Background</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((member, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="py-2 px-4 border border-gray-300 text-center">
                  {member.sno}
                </td>
                <td className="py-2 px-4 border border-gray-300">
                  {member.name}
                </td>
                <td className="py-2 px-4 border border-gray-300">
                  {member.position}
                </td>
                <td className="py-2 px-4 border border-gray-300">
                  {member.background}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className={`px-3 py-1 border rounded ${
            currentPage === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          &lt;
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === i + 1
                ? "bg-blue-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className={`px-3 py-1 border rounded ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          &gt;
        </button>
      </div>
      {/* Minutes of the Meetings Section */}
<div className="mt-12 px-4">
  <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Minutes of the meetings</strong>
                  </h4><br></br>
  <ul className="space-y-3">
    {meetingMinutes.map((item, index) => (
      <li key={index} className="flex items-center space-x-2">
        <CheckSquare className="text-white w-5 h-5 bg-orange-500 rounded-sm p-0.5" />


        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-black text-lg ml-[10%]"
        >
          {item.name}
        </a>
      </li>
    ))}
  </ul>
</div>
    </div>
    </div>
  );
};

export default TableComponent;
