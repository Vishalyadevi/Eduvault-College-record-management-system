import React from "react";
import "./FeePaymentGuide.css";
const approvalData = [
  {
    title: "Autonomous Status Order",
    files: [
      { name: "2019-2024", url: "/pdfs/2019-2024.pdf" },
      { name: "2024-2034", url: "/pdfs/2024-2034.pdf" },
    ],
  },
  {
    title: "Anna University",
    files: [{ name: "Anna University", url: "/pdfs/anna-university.pdf" }],
  },
  {
    title: "UGC – 12B",
    files: [{ name: "UGC – 12B", url: "/pdfs/ugc-12b.pdf" }],
  },
  {
    title: "UGC – 2f",
    files: [{ name: "UGC – 2f", url: "/pdfs/ugc-2f.pdf" }],
  },
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

const ApprovalLetters = () => {
  return (
    <div className="bg-gray-50 ">
        <div className="fee-banner">
        <h1 className="fee-title">APPROVAL LETTERS</h1>
      </div><br></br>
      <h2 className="text-3xl font-serif font-bold text-blue-900 mb-6 ml-[10%]">
        Approval letters
      </h2>
      <div className="space-y-6 ml-[15%]">
        {approvalData.map((section, index) => (
          <div key={index}>
            <div className="flex items-center gap-2">
              <OrangeTickIcon />&nbsp;&nbsp;&nbsp;&nbsp;
              <span className="text-lg font-medium">{section.title}</span>
            </div>
            <div className="pl-6 mt-2 space-y-2">
              {section.files.map((file, idx) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_self"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-black hover:border hover:border-black px-2 py-1 rounded transition-all w-fit"
                >
                  {file.name}
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
        ))}
      </div>
    </div>
  );
};

export default ApprovalLetters;
