import React from "react";
import "./FeePaymentGuide.css";

const years = [
  { label: "2011-2012", file: "/pdfs/2011-2012.pdf" },
  { label: "2012-2013", file: "/pdfs/2012-2013.pdf" },
  { label: "2013-2014", file: "/pdfs/2013-2014.pdf" },
  { label: "2014-2015", file: "/pdfs/2014-2015.pdf" },
  { label: "2015-2016", file: "/pdfs/2015-2016.pdf" },
  { label: "2016-2017", file: "/pdfs/2016-2017.pdf" },
  { label: "2017-2018", file: "/pdfs/2017-2018.pdf" },
  { label: "2018-2019", file: "/pdfs/2018-2019.pdf" },
  { label: "2019-2020", file: "/pdfs/2019-2020.pdf" },
  { label: "2020-2021", file: "/pdfs/2020-2021.pdf" },
  { label: "2021-2022", file: "/pdfs/2021-2022.pdf" },
  { label: "2022-2023", file: "/pdfs/2022-2023.pdf" },
  { label: "2023-2024", file: "/pdfs/2023-2024.pdf" }
];

const AuditedStatements = () => {
  return (
    <div className="fee-page5">
      <div className="fee-banner">
        <h1 className="fee-title">AUDITED STATEMENTS</h1>
      </div><br></br>
    <div className="bg-blue-50 pl-6 sm:pl-8 flex flex-col items-center p-4">
      <h1 className=" text-4xl lg:text-4xl font-bold text-blue-700 font-serif mb-7">
        Audited Statements
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 text-lg font-medium text-center">
        {years.map((item) => (
          <a
            key={item.label}
            href={item.file}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 px-4 py-2 border border-transparent hover:border-black hover:text-black transition-all duration-200 rounded"
          >
            {item.label}
          </a>
        ))}
      </div>
      </div>
    </div>
  );
};

export default AuditedStatements;
