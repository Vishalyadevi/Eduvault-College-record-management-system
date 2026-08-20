import React from "react";
import "./FeePaymentGuide.css";
const AdmissionProcess = () => {
  return (
      
      
    <section className="bg-white ">
      <div className="fee-banner">
        <h1 className="fee-title">ADMISSION</h1>
        </div>

      {/* Admission Process Image */}
      <div className="flex justify-center mb-10 px-4 sm:px-10 py-10">
        <img
          src="https://nec.edu.in/wp-content/uploads/2025/05/Admission-Process-1-1536x1536.png" // Replace with your actual image path
          alt="Admission Process"
          className="w-full max-w-4xl h-auto "
        />
      </div>

      {/* Documents Section */}
      <div className="space-y-6 px-4 sm:px-40 ">
         <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;Documents Produced At The Time Of Admission</strong>
  </h4>
        <ul className="list-decimal list-inside text-sm sm:text-base space-y-1 pl-4 text-gray-600">
          {[
            "Provisional allotment order - TNEA 202x (color printed)",
            "10th Marksheet",
            "12th mark sheet",
            "Transfer certificate and conduct certificate obtained from the institution last studied.",
            "Community certificate for BC/MBC/SC/ST/SCA candidates (permanent card or digitally signed e-certificate)",
            "Income certificate for possible scholarship (for BC/MBC/ST and SCA covered Christians)",
            "Nativity certificate (if applicable)",
            "Bank account passbook xerox"
          ].map((doc, idx) => (
            <li key={idx}>{doc}</li>
          ))}
        </ul>

        <p className="text-sm sm:text-base space-y-1 pl-4  text-black Times">
          All the certificates mentioned above, along with two photocopies each, are to be submitted (except serial number 7).
        </p>
        
      </div>
<br/>
      {/* First Graduate Section */}
      <div className="space-y-6 px-4 sm:px-40">
      
        <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both ">
    <strong className="font-bold">&nbsp;Additional Documents To Be Submitted For First Graduate Students</strong>
  </h4>
        <ol className="list-decimal list-inside pl-4 text-sm sm:text-base space-y-1 mt-2 text-gray-600">
          <li>
            First Graduate Certificate (Maximum Seven members entry should be present in U card and Joint declaration).
          </li>
          <li>
            Candidates who don’t have a graduate in their immediate blood relation should obtain a Bonafide Certificate from the
            college (where the Brother/Sister is studying) and have not availed of the First Graduate fee concession.
          </li>
        </ol>
      </div>
 <br/>
      {/* How to Reach */}
      <div className="space-y-6 px-4 sm:px-40">
        
        <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both ">
    <strong className="font-bold">&nbsp;How to reach NEC</strong>
  </h4>
  <br/>
        <a
          href="https://www.google.com/maps/place/National+Engineering+College/@9.148351,77.8321571,860m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3b06ae08c6794e85:0xea30f98dcb16c4f5!8m2!3d9.148351!4d77.8321571!16zL20vMDNfeGJn?entry=ttu&g_ep=EgoyMDI1MDYxNy4wIKXMDSoASAFQAw%3D%3D"
          className="text-blue-600  hover:text-black"
          target="_self"
          rel="noopener noreferrer"
        >
          https://maps.app.goo.gl/7LnAys9oEhDsvH88A
        </a>
      </div>
<br/>
      {/* Campus Map */}
      <div className="space-y-6 px-4 sm:px-40">
        
         <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both ">
    <strong className="font-bold">&nbsp;Campus Map</strong>
  </h4>
  <br/>
        <img
          src="https://nec.edu.in/wp-content/uploads/2024/01/NEC-Campus-Map-e1704276796159.png" // Replace with your image path
          alt="Campus Map"
          className=" w-full max-w-5xl mx-auto"
        />
      </div>
      <br/>
    </section>
   
  );
};

export default AdmissionProcess;
