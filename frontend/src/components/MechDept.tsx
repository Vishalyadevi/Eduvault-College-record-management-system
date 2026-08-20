import React, { useState } from "react";
import classNames from "classnames";
import "./FeePaymentGuide.css";
import { FaFilePdf, FaLink } from 'react-icons/fa';
import './ScrollableTable.css'; // Import custom scrollbar CSS
const data2 = [
    {
      id: 1,
      code: "19CS51C",
      name: "Java Programming",
      instructors: [
        "Mr.D.Vijayakumar",
        "MrS.Rajeshkumar",
        "Mr.J.Karthikeyan",
      ],
    },
    {
      id: 2,
      code: "19CS52C",
      name: "Theory of Computation",
      instructors: [
        "Dr.K.Mohaideen Pichai",
        "Dr.S.Dheenathayalan",
        "Ms.D.Thamarai Selvi",
      ],
    },
    {
      id: 3,
      code: "19CS53C",
      name: "Professional Ethics and Human Values",
      instructors: ["Dr.R.Rajakumari", "Ms.M.Kanthimathi"],
    },
    {
      id: 4,
      code: "19CS55C",
      name: "Cryptography and Network Security",
      instructors: [
        "Dr. M.Syed Rabiya",
        "Ms. P.Priyadharshini",
        "Ms. K.B.Mirra",
      ],
    },
    {
      id: 5,
      code: "19CS56C",
      name: "Java Programming Laboratory",
      instructors: ["MrS.Rajeshkumar", "Mr.J.Karthikeyan"],
    },
    {
      id: 6,
      code: "19CS58C",
      name: "Cryptography and Network Security Laboratory",
      instructors: [
        "Dr. M.Syed Rabiya",
        "Ms. P.Priyadharshini",
        "Ms. K.B.Mirra",
      ],
    },
    {
      id: 7,
      code: "19CS30E",
      name: "Advanced Java Programming",
      instructors: ["S.Kalaiselvi"],
    },
    {
      id: 8,
      code: "19CS29E",
      name: "Internet of Things",
      instructors: ["Dr.J.Naskath"],
    },
    {
      id: 9,
      code: "19CS27E",
      name: "Robotic Process Automation in Cloud",
      instructors: ["Mr.A.Shenbagaraman"],
    },
    {
      id: 10,
      code: "19CS39E",
      name: "SQL Programming",
      instructors: ["Mr.K.Rajkumar", "Mr.J.Karthikeyan"],
    },
    {
      id: 11,
      code: "19CS29L",
      name: "Full Stack Development",
      instructors: ["Mr.S.Rajeshkumar", "Ms.D.Thamarai Selvi"],
    },
    {
      id: 12,
      code: "19CS05L",
      name: "R Programming",
      instructors: ["Mr.J.Karthikeyan"],
    },
    {
      id: 13,
      code: "19CS08L",
      name: "Randomness in Cryptography",
      instructors: ["Mr.K.Rajkumar", "Dr.M.Syed Rabia"],
    },
    {
      id: 14,
      code: "19CS18L",
      name: "Scaling Networks",
      instructors: ["Mr.A.Shenbagaraman"],
    },
  ];
 const data1 = [
    {
      id: 1,
      code: "19CS41C",
      name: "Statistics and Numerical methods",
      instructors: [
        "Ms. M. Annapoopathi",
        "Ms. S. Karpaga Selvi",
        "Dr. P. Senthil Murugan",
      ],
    },
    {
      id: 2,
      code: "19CS42C",
      name: "Design and Analysis of Algorithms",
      instructors: [
        "Dr. K. Mohaideen Pitchai",
        "Ms. K. Ramalakshmi",
        "Ms. D. Abisha",
      ],
    },
    {
      id: 3,
      code: "19CS43C",
      name: "Operating Systems",
      instructors: [
        "Dr. J. Naskath",
        "Mr. A. Shenbagaraman",
        "Ms. B. Shunmugapriya",
      ],
    },
    {
      id: 4,
      code: "19CS44C",
      name: "Database Management Systems",
      instructors: [
        "Dr. S. Kalaiselvi",
        "Dr. G. Sivakamasundari",
        "Mr. K. Rajkumar",
      ],
    },
    {
      id: 5,
      code: "19CS45C",
      name: "Computer Networks",
      instructors: [
        "Dr. S. Kalaiselvi",
        "Dr. G. Sivakamasundari",
        "Mr. K. Rajkumar",
      ],
    },
    {
      id: 6,
      code: "19CS46C",
      name: "Finance and Accounting",
      instructors: [
        "Dr. T. Sakthi",
        "Mr. N. Muthu Saravanan",
        "Mr. C. Veera Ajay",
      ],
    },
    {
      id: 7,
      code: "19CS47C",
      name: "Operating Systems Laboratory",
      instructors: [
        "Dr. J. Naskath",
        "Mr. A. Shenbagaraman",
        "Ms. B. Shunmugapriya",
      ],
    },
    {
      id: 8,
      code: "19CS48C",
      name: "Database Management Systems Laboratory",
      instructors: [
        "Dr. S. Kalaiselvi",
        "Dr. G. Sivakamasundari",
        "Mr. K. Rajkumar",
      ],
    },
    {
      id: 9,
      code: "19CS49C",
      name: "Networks Laboratory",
      instructors: [
        "Dr. S. Kalaiselvi",
        "Dr. G. Sivakamasundari",
        "Mr. K. Rajkumar",
      ],
    },
  ];
  const data = [
    {
      code: '19CS33C',
      name: 'Data Structures',
      instructors: [
        'Dr.G.Sivagangavalli',
        'Mr.V.Veeran Anuraja',
        'Ms.R.Deepikabharathi',
      ],
    },
    {
      code: '19CS32C',
      name: 'Computer Organization and Architecture',
      instructors: [
        'Dr.V.PriyaKumar',
        'Mr.A.Sivakumarasamy',
        'Ms.A.Liney',
      ],
    },
    {
      code: '19CS34C',
      name: 'Object Oriented Programming',
      instructors: [
        'Ms.R.Kanimozhi',
        'Mr.S.Muthukumar',
        'Ms.N.Raveena Evangilin',
      ],
    },
    {
      code: '19CS35C',
      name: 'Digital Principles and System Design',
      instructors: [
        'Dr.M.Syed Riaz',
        'Mr.C.Mahalingam',
        'Dr.G.Rajesh Kumar',
      ],
    },
    {
      code: '19CS36C',
      name: 'Software Engineering Methodologies',
      instructors: [
        'Dr.J.Natesan',
        'Mr.R.Suriyaprakash',
        'Ms.R.Akshaya',
      ],
    },
    {
      code: '19CS37C',
      name: 'Data Structures Laboratory',
      instructors: [
        'Dr.G.Sivagangavalli',
        'Mr.V.Veeran Anuraja',
      ],
    },
    {
      code: '19CS38C',
      name: 'Object Oriented Programming Laboratory',
      instructors: [
        'Ms.R.Kanimozhi',
        'Mr.S.Muthukumar',
        'Ms.N.Raveena Evangilin',
      ],
    },
    {
      code: '19CS39C',
      name: 'Statistical Foundations of Data Science',
      instructors: ['Dr.S.Sankarasubramani'],
    },
    {
      code: '19CS31L',
      name: 'Introduction to Networks',
      instructors: ['Ms.B.Shanmugaraj'],
    },
  ];

const facultyData1 = [
  {
    name: 'Dr. K. Muthukrishnan',
    designation: 'Professor',
    imageUrl: '/images/muthukrishnan.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. K. Manisekar',
    designation: 'Professor',
    imageUrl: '/images/manisekar.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. T. Venkatkumar',
    designation: 'Professor',
    imageUrl: '/images/venkatkumar.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. R. Harikrishnan',
    designation: 'Associate Professor',
    imageUrl: '/images/harikrishnan.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. M. Kathirvel',
    designation: 'Associate Professor',
    imageUrl: '/images/kathirvel.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. P. Parameswaran',
    designation: 'Associate Professor',
    imageUrl: '/images/parameswaran.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. I. Sanker',
    designation: 'Associate Professor',
    imageUrl: '/images/sanker.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. D. Vignesh Kumar',
    designation: 'Associate Professor',
    imageUrl: '/images/vigneshkumar.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. P. Michael Thomas Rex',
    designation: 'Assistant Professor',
    imageUrl: '/images/thomasrex.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. A. Arivudainambi',
    designation: 'Assistant Professor',
    imageUrl: '/images/arivudainambi.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. T. Taufik Mohamed',
    designation: 'Assistant Professor',
    imageUrl: '/images/taufik.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. C. Prem Alex',
    designation: 'Assistant Professor',
    imageUrl: '/images/premalex.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Mr. S. Prince Anison',
    designation: 'Assistant Professor',
    imageUrl: '/images/prince.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Ms. N. Rajeswari',
    designation: 'Assistant Professor',
    imageUrl: '/images/rajeswari.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. S. Muthu Saravanan',
    designation: 'Assistant Professor',
    imageUrl: '/images/muthusaravanan.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
];
const humanitiesFaculty = [
  {
    name: 'Dr. T. Kokilal',
    designation: 'Assistant Professor (English)',
    imageUrl: '/images/kokilal.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Ms. B. Anantha',
    designation: 'Assistant Professor (Mathematics)',
    imageUrl: '/images/anantha.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr. M. Vivekanandan',
    designation: 'Assistant Professor (Physics)',
    imageUrl: '/images/vivekanandan.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
];

const OrangeTickIcon = () => (
  <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center mt-1">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.19 9.205-4.548-4.548a1 1 0 1 0-1.414 1.414l5.255 5.255a1 1 0 0 0 1.414 0l9.897-9.908z" />
    </svg>
  </div>
);
interface Faculty {
  name: string;
  designation: string;
  vidwanId: string;
  profileUrl: string;
}

const facultyData = [
  {
    name: "Dr Iyah Raja.S", designation: "Professor and Head", id: "211414",
    url: "https://vidwan.inflibnet.ac.in/profile/211414"
  },
  {
    name: "Dr K.Manisekar", designation: "Professor and Dean (I&E)", id: "286307",
    url: "https://vidwan.inflibnet.ac.in/profile/286307"
  },
  {
    name: "Dr Venkatkumar.D", designation: "Professor", id: "289017",
    url: "https://vidwan.inflibnet.ac.in/profile/289017"
  },
  {
    name: "Dr Harichandran. R", designation: "Professor", id: "286954",
    url: "https://vidwan.inflibnet.ac.in/profile/286954"
  },
  {
    name: "Dr Kathiresan.M", designation: "Asso.Professor", id: "289091",
    url: "https://vidwan.inflibnet.ac.in/profile/289091"
  },
  {
    name: "Dr Sankar. I", designation: "Asst.Professor (SG)", id: "286245",
    url: "https://vidwan.inflibnet.ac.in/profile/286245"
  },
  {
    name: "Dr Vigneshkumar.D", designation: "Asst.Professor (SG)", id: "286920",
    url: "https://vidwan.inflibnet.ac.in/profile/286920"
  },
  {
    name: "Dr Ramanan. P", designation: "Asst.Professor (SG)", id: "289020",
    url: "https://vidwan.inflibnet.ac.in/profile/289020"
  },
  {
    name: "Dr Michael Thomas Rex. F", designation: "Asst.Professor (SG)", id: "286417",
    url: "https://vidwan.inflibnet.ac.in/profile/286417"
  },
  {
    name: "Dr Andrews.A", designation: "Asst.Professor (SG)", id: "289143",
    url: "https://vidwan.inflibnet.ac.in/profile/289143"
  },
  {
    name: "Dr.K.Thoufiq Mohammed", designation: "Asst.Professor (SG)", id: "289010",
    url: "https://vidwan.inflibnet.ac.in/profile/289010"
  },
  {
    name: "Dr C.Veera Ajay", designation: "Asst.Professor (SG)", id: "289027",
    url: "https://vidwan.inflibnet.ac.in/profile/289027"
  },
  {
    name: "Mr Prince Abraham. B", designation: "Asst.Professor", id: "289035",
    url: "https://vidwan.inflibnet.ac.in/profile/289035"
  },
  {
    name: "Ms. M. Rajeswari", designation: "Asst.Professor", id: "",
    url: ""
  },
  {
    name: "Mr N. Muthu Saravanan", designation: "Asst.Professor", id: "289026",
    url: "https://vidwan.inflibnet.ac.in/profile/289026"
  }
];

const researchData = [
  {
    year: "2017-2018",
    sciPublications: "4",
    patentsPublished: "9",
    patentsGranted: "-",
    fundedProjects: "3.1 Lakhs",
    consultancy: "3.6 Lakhs",
    mous: "Currently 3 active MoUs with Adroit Soft (India) Pvt., Ltd, Information Data Systems, Inc., and Viable Technologies",
  },
  {
    year: "2018-2019",
    sciPublications: "9",
    patentsPublished: "",
    patentsGranted: "",
    fundedProjects: "5.2 Lakhs",
    consultancy: "-",
    mous: "",
  },
  {
    year: "2019-2020",
    sciPublications: "6",
    patentsPublished: "",
    patentsGranted: "",
    fundedProjects: "2.7 Lakhs",
    consultancy: "-",
    mous: "",
  },
  {
    year: "2020-2021",
    sciPublications: "11",
    patentsPublished: "",
    patentsGranted: "",
    fundedProjects: "9.85 Lakhs",
    consultancy: "",
    mous: "",
  },
  {
    year: "2021-2022",
    sciPublications: "18",
    patentsPublished: "",
    patentsGranted: "",
    fundedProjects: "0.1 Lakhs",
    consultancy: "0.45 Lakhs",
    mous: "",
  },
  {
    year: "2022-2023",
    sciPublications: "5",
    patentsPublished: "",
    patentsGranted: "",
    fundedProjects: "-",
    consultancy: "5 Lakhs",
    mous: "",
  },
  {
    year: "2023-2024",
    sciPublications: "6",
    patentsPublished: "1",
    patentsGranted: "3",
    fundedProjects: "0.25 lakhs",
    consultancy: "3,50,000 (2 Lakhs Received on 16.09.2023)",
    mous: "",
  },
];

interface LabItem {
  sNo: number;
  labName: string;
  items: string;
  qty: number;
}

const labData: LabItem[] = [
  {
    sNo: 1,
    labName: 'Application Development Laboratory',
    items: 'Acer - Veriton Core i5-9400 8th Gen 16GB1TB18.5” (30 Nos) Acer - Veriton Core i5-7400 7th Gen 16GB 1TB 18.5” (22 Nos)',
    qty: 87,
  },
  {
    sNo: 2,
    labName: 'Artificial Intelligence & Deep Learning Laboratory',
    items: 'Acer - Veriton Core i5-6400 6th Gen B1TB18.5” (15 Nos) HP-Pro 3330 Core i5-2320 2nd Gen 16GB500GB18.5” (11 Nos) Dual Core/Core 2 Quad (9 Nos)',
    qty: 30,
  },
  {
    sNo: 3,
    labName: 'Networking Laboratory',
    items: 'Acer Core i5-2320 2nd Gen / 4GB/500GB/18.5” (38 Nos) HCL Core i5-2320 2nd Gen / 4GB/320GB/18.5” (2 Nos)',
    qty: 40,
  },
  {
    sNo: 4,
    labName: 'Business Intelligence Laboratory',
    items: 'Lenovo Core i5-3470 3rd Gen / 4GB/500GB/18.5” (40 Nos) Acer Core i5-3330 3rd Gen / 4GB/500GB/18.5” (7 Nos) Apple Core i5 (Turbo boost up to 3.1 GHZ) / 8GB/1 TB/21.5” (7 Nos)',
    qty: 54,
  },
  {
    sNo: 5,
    labName: 'Web Service Laboratory',
    items: 'Core i7-10700 U/I x 16GB RAM.120GB SSD/2 TB SATA /19.5” (4 Nos) Core i5-10400 U/I x 16GB RAM.120GB SSD/2 TB SATA /19.5” (20 Nos) HP-Core I5-10500 U/I x 16GB RAM.1TB HDD /19.5” (10 Nos)',
    qty: 67,
  },
  {
    sNo: 6,
    labName: 'Platform Engineering Laboratory',
    items: 'Acer – Veriton Core i5 4460 4th/4GB/500GB SATA /18.5” (3 Nos) Acer - Veriton Core i5-3340 4th Gen/4GB/500GB/18.5” (4 Nos) HP-Pro 3330 Core i5-E3470 3rd Gen/4GB/500GB/18.5” (4 Nos) Dual Core/Core 2 Quad (22 Nos)',
    qty: 30,
  },
  {
    sNo: 7,
    labName: 'Computational Programming Laboratory',
    items: 'Acer – Veriton Core i5-8400 8th Gen/8GB/1TB/18.5” (18 Nos) Acer - Veriton Core i5-6400 6th Gen/8GB/1TB/18.5” (24 Nos) Acer – Veriton Core i5-4460 4th Gen/4GB/500GB/18.5” (21 Nos) Dual Core/Core 2 Quad (4 Nos)',
    qty: 67,
  },
  {
    sNo: 8,
    labName: 'Centre for cryptography & Information Security Laboratory',
    items: 'Dell -Vostro Corei5- Processor /4GB /500GB/18.5” (7 Nos) Lenovo Intel PDC G4400 processor/ 4 GB /1TB/19.5” (8 Nos)',
    qty: 15,
  },
  {
    sNo: 9,
    labName: 'IP Research Centre Laboratory',
    items: 'Core i7-10700 – NVIDIA Gaming Desktop Systems (1 No) ASUS core i5 – 10400 NVIDIA Desktop Systems (4 Nos) AMD Core i5-9400F 9th Gen/16GB/1TB/18.5”/ASUS NVIDIA GTX – 1050Ti OC Edition (GPU Card). (1 No)',
    qty: 6,
  },
  {
    sNo: 10,
    labName: 'Adroit Soft Laboratory',
    items: 'Wipro - evolv Core i3 evolv 2100/500GB/19” (7 Nos)',
    qty: 7,
  },
];

interface SafetyEntry {
  sNo: number;
  location: string;
  qty: number;
  measure: string;
  refillDate: string;
  expiryDate: string;
}

const safetyData: SafetyEntry[] = [
  {
    sNo: 1,
    location: 'Application Development Laboratory',
    qty: 1,
    measure: 'CO2 Extinguisher type(4.5Kg)',
    refillDate: '13.02.2024',
    expiryDate: '12.02.2025',
  },
  {
    sNo: 2,
    location: 'Networking Laboratory',
    qty: 1,
    measure: 'CO2 Extinguisher type(4.5Kg)',
    refillDate: '12.10.2022',
    expiryDate: '11.10.2023',
  },
  {
    sNo: 3,
    location: 'GROUND FLOOR',
    qty: 8,
    measure:
      'CO2 Extinguisher type(4.5Kg) (4 Nos. in Corridor)\nFIRE BUCKET (SAND) – 2 Nos. (5 buckets)\nHOSE REEL – 2 Nos',
    refillDate: '13.02.2024',
    expiryDate: '12.02.2025',
  },
  {
    sNo: 4,
    location: 'FIRST FLOOR',
    qty: 4,
    measure:
      'CO2 Extinguisher type(4.5Kg) – 1 No.\nFIRE BUCKET (SAND) – 1 Nos (3 buckets)\nHOSE REEL – 2 Nos.',
    refillDate: '03.11.2023',
    expiryDate: '02.11.2024',
  },
  {
    sNo: 5,
    location: 'SECOND FLOOR',
    qty: 2,
    measure:
      'CO2 Extinguisher type(4.5Kg) – 1 No. in Corridor\nCO2 Extinguisher type(4.5Kg) – 1 No. in Seminar Hall.\nHOSE REEL – 1 No.',
    refillDate: '03.11.2023',
    expiryDate: '02.11.2024',
  },
  {
    sNo: 6,
    location: 'Lightening Arrester',
    qty: 6,
    measure: 'LAMCO make LMD type 11KV Lightening Arrester- rating- 9KV, 5KA.',
    refillDate: '-',
    expiryDate: '-',
  },
];

const navItems = ["Home", "Faculty", "Courses", "Facilities", "Gallery"];

const MechDept = () => {
  const [active, setActive] = useState("Home");
    const headingStyle = {
    fontFamily: "'Georgia', 'Times', serif",
    fontWeight: 400,
    fontSize: "1.2rem",
    lineHeight: "1.2em",
    color: "black",
    margin: "0 0 20px 0",
    padding: 0,
    textTransform: "uppercase",
    letterSpacing: "-0.5px",
  
  };
                const [currentPage, setCurrentPage] = useState(1);
                const itemsPerPage = 10;

                const totalPages = Math.ceil(facultyData.length / itemsPerPage);
                const start = (currentPage - 1) * itemsPerPage;
                const currentData = facultyData.slice(start, start + itemsPerPage);
  return (
    <div className="min-h-screen bg-white text-blue-900 flex flex-col">
      {/* Header with background image */}
       <div className="fee-banner">
        <h1 className="fee-title">DEPARTMENT OF MECHANICAL ENGINEERING</h1>
      </div><br></br>
<div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-60 bg-white  p-2 ml-[1%]">
        <br></br>
        <br></br>
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={`w-full text-center text-white font-bold py-3 px-4 mb-2 rounded-none font-serif Georgia, Times  ${
              
              active === item
                ? "bg-[#7b231c]" // Dark maroon for selected
                : "bg-[#00008B] hover:bg-[#d4af37]" // Navy blue for others
            }`}
          >
            {item}
          </button>
        ))}
      </aside>
        

        {/* Main Content */}
       <main className="flex-1 p-6 md:p-10 max-w-10xl mx-auto mb-0 ">
  {active === "Home" && (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* HoD’s Desk */}
      <section className="bg-white p-4 rounded-lg mb-0"> {/* Set mb-0 to remove margin-bottom */}
        <h4 className="mb-5 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold">About the Department</strong>
        </h4>
        <p className="border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          The Department of Mechanical Engineering is established in the year 1984. The department has qualified and experienced faculty members with industrial and research backgrounds to achieve excellence in academic and research activities. NBA has accredited the department since 2000, and presently accredited under the Tier – I category. The department is recognized as a Research Centre by Anna University, Chennai. The department has fetched research projects worth Rs. 1.72 crores from various agencies such as DST, BRNS and AICTE etc,. The department has 12 Ph.D qualified faculty members and all of them are recognized as Research Supervisors by Anna University Chennai. So far, 35 Scholars have completed their PhD from Research Center, and 12 scholars are currently doing research. The CDIO lab has been established in the department in 2016 for new product development activities. More than 36 products were developed, among which five were commercialized. The department has published five Patents and twelve under process.
        </p>
      </section>

      {/* Vision & Mission */}
      <div className="bg-white p-2 rounded-lg mb-0 mt-0"> {/* Set mb-0 and mt-0 to remove both margins */}
        <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;Vision</strong>
        </h4>
        <p className="border-0 m-0 p-0 text-base box-border mb-4 text-black Times mb-5">
          &nbsp;&nbsp;&nbsp;Producing globally competitive Mechanical Engineers with social responsibilities.
        </p>
      <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold">&nbsp;Mission</strong>
        </h4>
        
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>Imparting quality education by providing excellent Teaching-Learning environment.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>Inculcating qualities of continuous learning, professionalism, team spirit, communication skill and leadership with social responsibilities.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>Promoting leading-edge research and development through collaboration with academia and industry.</span>
          </li>
          
        </ul>
      </div>
              {/* PEO & PSO */}
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
                 <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;Program Educational Objectives (PEOs)</strong>
        </h4>
         <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PEO 1: Graduates will have successful profession in Mechanical/allied Industries or
Research /Academics or business enterprise.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PEO 2: Graduates will broaden their horizons beyond Mechanical Engineering to address
the societal and environmental concerns.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PEO 3: Graduates will have the attitudes and abilities of leaders to adapt the changing
global scenario.
           </span>
          </li>
        </ul>
                

                 <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;Program Specific Outcomes (PSOs)</strong>
           </h4>
         <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PSO 1: Apply the concepts of Engineering Design to design, analyze and develop the
Mechanical components and systems using the different analytical/CAD/experimental tools.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PSO 2: Apply the concepts of Thermal Engineering to design, analyze and develop the flow
and energy systems using the different analytical/experimental/software tools.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PSO 3: Apply the concepts of Production and Industrial Engineering for analysis,
optimization and development of mechanical systems.</span>
          </li>
          
        </ul>
                
              </section>

              {/* Salient Features */}
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
                
                 <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Salient Features</strong>
                  </h4><br></br>
                  <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
        
                   <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Thirty-eight years old well established department.</span>
                   </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Accredited by NBA since 2000 and under Tier – I from 2016.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Anna University has been recognized as Research Centre for pursuing a PhD degree in Mechanical Engineering since 2006.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Research supervisors for guiding PhD- research scholar.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Quality Academic Research and Publications in reputed Journals.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Reviewers in various reputed International Journals and Books.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Consistent Placement Records.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Industry Interaction through MOU / Industry Know-How / Internship.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Well Established Alumni Network.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>State Art Laboratory for Research works in Composite Materials and Renewable energy.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Highly Qualified Faculty members with Good Retention.</span>
          </li>

          
        </ul>
                
        
        
        
         
              </section>

              {/* Academic Programmes */}
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
                <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Academic Programmes</strong>
                  </h4><br></br>
                <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;UG – Establishment Year – 1984</h5>
                 
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Student Strength – 60</span>
          </li>
        </ul> 
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;PG – Year of Establishment – 2004</h5>
                  
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Student Strength – 6</span>
          </li>
        </ul> 
             <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;PhD – Year of Establishment – 2006</h5>
                   
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Scholars:</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Full time – 2</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Part time – 10</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Awarded – 35</span>
          </li>
        </ul> 
              </section>
       
              {/* Contact */}
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
             <div className=" bg-white ">
      <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Faculty (List with Vidwan link)</strong>
                  </h4><br></br>
                  <br></br>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-blue-600 text-white text-left">
            <tr>
              <th className="p-3 border">S.No</th>
              <th className="p-3 border">Name of Faculty</th>
              <th className="p-3 border">Designation</th>
              <th className="p-3 border">Vidwan ID</th>
              <th className="p-3 border">Profile URL</th>
            </tr>
          </thead>
          <tbody>
          {facultyData.map((faculty, index) => (
            <tr key={index} className="even:bg-gray-100">
              <td className="px-4 py-2 border">{index + 1}</td>
              <td className="px-4 py-2 border">{faculty.name}</td>
              <td className="px-4 py-2 border">{faculty.designation}</td>
              <td className="px-4 py-2 border">{faculty.id}</td>
              <td className="px-4 py-2 border text-blue-600 underline">
                {faculty.url ? (
                  <a href={faculty.url} target="_self" rel="noopener noreferrer">
                    {faculty.url}
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          &lt;
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-gray-200  text-black font-bold' : ''}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          &gt;
        </button>
      </div>
    </div>
                
              </section>
              <br></br>
               <section className="bg-white p-2 rounded-lg mb-0 mt-0">
                <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Special Laboratories Facilities (Related to Research)
<br/>R&D –Advanced Engineering Materials Lab</strong>
                  </h4><br></br>
              <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
        
                   <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Tensile Elongation Testing Machine(5 Ton)</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Ultrasonic Probe Sonicator</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Modern Hydraulic Compression Moulding Machine (70 Ton)</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Wear and Friction Monitor (Model ED-201)</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>High-Temperature Tubular Furnace (DST-FIST) ) – 1 No</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Thermogravimetric Analyzer (DST-FIST) ) – 1 No</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Impact Testing Machine</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Ultrasonic Sonicator for Aluminium and Magnesium melt Processing</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Casting Furnace (1000oC)</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Computerized Tribometer Pin-on-disc with Environment Chamber ) – 1 No</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>High Temperature Bottom Pouring Furnace (1200°C) ) – 1 No</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Olympus model GX51 Inverted Metallurgical Microscope</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Lever arm Computerized Creep/Stress rupture testing Machine</span>
                   </li>
                       <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Muffle Furnace (1600oC)</span>
                   </li>

                   </ul>
               </section>
               <br/>
             
              <div className="flex flex-col  gap-10 p-4">
  {/* Image 1 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/COMPOSITE-LAB.jpg"
      alt="Testing Machine 1"
      className="w-full h-80 object-cover rounded-lg border"
    />
  </div>

  {/* Image 2 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Composite-lab-2.jpg"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
</div>
<br/>
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Welding Research Lab</strong>
</h4>

<ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>OTC Daihen digital inverter MIG/MAG welding machine</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>OTC Daihen digital inverter DC pulse TIG welding machine</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Linear movement welding equipment</span>
  </li>
</ul>
<div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Welding-Research-Lab.png"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
  <br/>
     <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Digital Fabrication Laboratory</strong>
</h4>

<ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>CNC milling machine – Milltap-700</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>CNC Turning machine – Sprint 16TC</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>MTAB - Denford Starmill - ATC - 3 Axis CNC bench milling machine</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>XL Turn CNC Trainer Lathe</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>3-D Coordinate Measuring Machine</span>
  </li>
</ul>
     <div className="flex flex-col  gap-10 p-4">
  {/* Image 1 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Digital-Fabrication-Laboratory-2.jpg"
      alt="Testing Machine 1"
      className="w-full h-80 object-cover rounded-lg border"
    />
  </div>

  {/* Image 2 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Digital-Fabrication-Laboratory-2.png"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
</div>
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Advanced Computing Laboratory</strong>
</h4>
              <br/>
              <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Advanced-Computing-Laboratory.png"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
  <br/>

  <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Energy Laboratory</strong>
</h4>

<ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>1 KW OFF-Grid Solar PV Power plant with inverter</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Solar Radiation Meter</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Solar Simulator</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Solar Still – inclined, basin, semi-cylindrical, flash evaporation desalination</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Solar Water Heater Test Rig</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Solar Drier</span>
  </li>
</ul>
<br/>
 <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Energy-Park.jpg"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
  <br/>

   {/* Non-Destructive Testing Lab */}
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Non-Destructive Testing Lab</strong>
</h4>

<ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-6 text-black Times">
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Liquid Penetrant Test</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Magnetic Particle Test</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Radiography Test</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Ultrasonic Test</span>
  </li>
</ul>

{/* Dynamics Lab */}
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Dynamics Lab</strong>
</h4>

<ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-6 text-black Times">
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Vibration Measuring and Analyses Equipment</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Vibration Absorber</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>FFT Analyzer</span>
  </li>
</ul>
<br/>
<div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Dynamics-Lab.jpg"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
<br/>

  
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Product Development Lab</strong>
</h4>
<div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Product-Development-Lab.png"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
  <br/>
  {/* Strength of Materials Lab */}
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Strength of Materials Lab</strong>
</h4>

<ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-6 text-black Times">
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Diffusion bonding equipment with a hydraulic press and hot furnace</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Compression Testing Machine (200 Ton)</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Universal Testing Machine – 100 Ton</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Computerized UTM of 60 Ton capacity</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Brinell cum Rockwell Hardness Testing Machine (Model: MRB-250)</span>
  </li>
</ul>
 <div className="flex flex-col  gap-10 p-4">
  {/* Image 1 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Strength-of-Materials-Lab.png"
      alt="Testing Machine 1"
      className="w-full h-80 object-cover rounded-lg border"
    />
  </div>

  {/* Image 2 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Strength-of-Materials-Lab-2.jpg"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
</div>
<br/>
{/* Metrology and Measurements Lab */}
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Metrology and Measurements Lab</strong>
</h4>

<ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-6 text-black Times">
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Mitutoyo Make Portable Surface Roughness Tester</span>
  </li>
  <li className="flex items-start gap-3">
    &nbsp;&nbsp;<OrangeTickIcon />
    <span>Computerized Thermocouple Data Logging System</span>
  </li>
</ul>
<br/>
<div className="flex flex-col  gap-10 p-4">
  {/* Image 1 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Metrology-and-Measurements-Lab.png"
      alt="Testing Machine 1"
      className="w-full h-80 object-cover rounded-lg border"
    />
  </div>

  {/* Image 2 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Metrology-and-Measurements-Lab-2.jpg"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
</div>
<br/>
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Hydraulics Laboratory</strong>
</h4>
<br/>
<div className="flex flex-col  gap-10 p-4">
  {/* Image 1 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Hydraulics-Laboratory.jpg"
      alt="Testing Machine 1"
      className="w-full h-80 object-cover rounded-lg border"
    />
  </div>

  
</div>
<br/>
{/* Thermal Engineering Laboratory */}
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Thermal Engineering Laboratory</strong>
</h4>
<div className="flex flex-col  gap-10 p-4">
  {/* Image 1 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Thermal-Engineering-Laboratory.jpg"
      alt="Testing Machine 1"
      className="w-full h-80 object-cover rounded-lg border"
    />
  </div>

  {/* Image 2 */}
  <div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Thermal-Engineering-Laboratory-2.jpg"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
</div>
<br/>
<h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Machines Laboratory</strong>
</h4>
<div className="w-full max-w-[600px] text-center  p-4 ">
    <img
      src="https://nec.edu.in/wp-content/uploads/2024/01/Machines-Lab.jpg"
      alt="Testing Machine 2"
      className="w-full h-100 object-cover rounded-lg border"
    />
  </div>
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
  <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Contact Us</strong>
                  </h4><br></br>

           <div className="text-gray-800 text-[17px] leading-relaxed space-y-2">
           <p><span className="font-semibold text-black">&nbsp;&nbsp;Head of the Department,</span></p>
          
    <p>&nbsp;&nbsp;Department of Mechanical Engineering,</p>
    <p>&nbsp;&nbsp;National Engineering College (Autonomous)</p>
    <p>&nbsp;&nbsp;K.R.Nagar, Kovilpatti, Thoothukudi (Dt) – 628503</p>
    <p>
      <span className="font-semibold">&nbsp;&nbsp;Email:</span>{" "}
      <a href="mailto:hodmech@nec.edu.in" className="text-blue-600 hover:underline">hodmech@nec.edu.in</a>
    </p>
    
  </div>
</section>

            </div>
          )}

          {/* Other Tabs */}
         {active === "Faculty" && (
  <div>
    {/* Main Faculty Section */}
    <section className="bg-white p-2 rounded-lg mb-0 mt-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-20 max-w-7xl mx-auto">
        {facultyData1.map((faculty, index) => (
          <div
            key={index}
            className="bg-gray-100 shadow-[0_0_15px_3px_rgba(14,43,100,0.4)] p-6 flex flex-col items-center text-center transition-transform duration-300 hover:bg-[#0e2b73] scale-105 h-85 w-95"
          >
            <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-white shadow-md">
              <img
                src={faculty.imageUrl}
                alt={faculty.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="group-hover:text-white" style={headingStyle}>
              {faculty.name}
            </h3>
            <p className="text-gray-500 text-sm mb-4 group-hover:text-white">
              {faculty.designation}
            </p>
            <div className="flex gap-4">
              {faculty.pdfUrl && (
                <a
                  href={faculty.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 p-2 rounded-full hover: transition"
                >
                  <FaFilePdf size={18} />
                </a>
              )}
              {faculty.profileUrl && (
                <a
                  href={faculty.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 p-2 rounded-full hover: transition"
                >
                  <FaLink size={18} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
<br/>
<br/>
    {/* Humanities & Adjunct Faculty Section */}
    <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
  <strong className="font-bold">&nbsp;Humanities & Adjunct Faculty</strong>
</h4>
<br/>
<br/>
  
    <section className="bg-white p-2 rounded-lg mb-0 mt-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-20 max-w-7xl mx-auto">
        {humanitiesFaculty.map((faculty, index) => (
          <div
            key={`humanities-${index}`}
            className="bg-gray-100 shadow-[0_0_15px_3px_rgba(14,43,100,0.4)] p-6 flex flex-col items-center text-center transition-transform duration-300 hover:bg-[#0e2b73] scale-105 h-85 w-95"
          >
            <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-white shadow-md">
              <img
                src={faculty.imageUrl}
                alt={faculty.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="group-hover:text-white" style={headingStyle}>
              {faculty.name}
            </h3>
            <p className="text-gray-500 text-sm mb-4 group-hover:text-white">
              {faculty.designation}
            </p>
            <div className="flex gap-4">
              {faculty.pdfUrl && (
                <a
                  href={faculty.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 p-2 rounded-full hover: transition"
                >
                  <FaFilePdf size={18} />
                </a>
              )}
              {faculty.profileUrl && (
                <a
                  href={faculty.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 p-2 rounded-full hover: transition"
                >
                  <FaLink size={18} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
)}

          {active === "Courses" && <div>
            <div className="bg-white p-2 rounded-lg mb-0 mt-0">
      {/* M.E. Prospectus */}
      <div className="w-full max-w-[700px]">
        
        <div className="p-4">
          <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Programme Prospectus</strong>
                  </h4><br></br>
          <p className="text-[#B91C1C]  text-3xl font-bold">Prospectus M.E</p>
          <br></br>
          <img
          src="https://nec.edu.in/wp-content/uploads/2024/01/CSE.jpeg-copy.webp"
          alt="M.E CSE Prospectus"
          className="w-full h-auto object-cover"
        />
        </div>
      </div>

      {/* B.E. Prospectus */}
      <div className="w-full max-w-[700px] bg-white ">
        
        <div className="p-4">
          <br></br>
          <p className="text-[#B91C1C]  text-3xl font-bold">Prospectus B.E</p>
          <br></br>
          <img
          src="https://nec.edu.in/wp-content/uploads/2024/01/Broucher-copy.webp"
          alt="B.E CSE Prospectus"
          className="w-full h-auto object-cover"
        />
        </div>
      </div>
    </div>
        <div className="p-4">
      <div className="table-wrapper">
        <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Programme Prospectus</strong>
                  </h4><br></br>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Instructor(s) Name</th>
              <th>Course Brochure</th>
            </tr>
          </thead>
          <tbody>
            {data.map((course, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{course.code}</td>
                <td>{course.name}</td>
                <td>
                  {course.instructors.map((inst, i) => (
                    <div key={i}>{inst}</div>
                  ))}
                </td>
                <td>
                  <a href="#" className="download-link">Download</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <br></br>
    <br></br>
     <div className="p-4">
      <div className="table-wrapper">
        <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Programme Prospectus</strong>
                  </h4><br></br>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Instructor(s) Name</th>
              <th>Course Brochure</th>
            </tr>
          </thead>
          <tbody>
            {data1.map((course, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{course.code}</td>
                <td>{course.name}</td>
                <td>
                  {course.instructors.map((inst, i) => (
                    <div key={i}>{inst}</div>
                  ))}
                </td>
                <td>
                  <a href="#" className="download-link">Download</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    
    <br></br>
    <br></br>
     <div className="p-4">
      <div className="table-wrapper">
        <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Programme Prospectus</strong>
                  </h4><br></br>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Instructor(s) Name</th>
              <th>Course Brochure</th>
            </tr>
          </thead>
          <tbody>
            {data2.map((course, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{course.code}</td>
                <td>{course.name}</td>
                <td>
                  {course.instructors.map((inst, i) => (
                    <div key={i}>{inst}</div>
                  ))}
                </td>
                <td>
                  <a href="#" className="download-link">Download</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
            </div>}
          {active === "Facilities" && <div>
            <div className="overflow-x-auto p-4">
               <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Facilities</strong>
                  </h4><br></br>
      <table className="min-w-full border border-gray-300 text-sm text-left">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="px-4 py-2 border">S.No</th>
            <th className="px-4 py-2 border">Name of the Laboratory</th>
            <th className="px-4 py-2 border">Name of the item(s)</th>
            <th className="px-4 py-2 border">Qty</th>
          </tr>
        </thead>
        <tbody>
          {labData.map((lab) => (
            <tr key={lab.sNo} className="hover:bg-gray-100">
              <td className="px-4 py-2 border">{lab.sNo}</td>
              <td className="px-4 py-2 border">{lab.labName}</td>
              <td className="px-4 py-2 border whitespace-pre-line">{lab.items}</td>
              <td className="px-4 py-2 border text-center">{lab.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <br></br>
    <br></br>
     <div className="p-6  min-h-screen">
       <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Safety Measures</strong>
                  </h4><br></br>
      <div className="overflow-x-auto border rounded shadow">
        <table className="min-w-full text-sm text-left bg-white border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-2 border">S.No</th>
              <th className="px-4 py-2 border">Name of the Locations</th>
              <th className="px-4 py-2 border">Qty</th>
              <th className="px-4 py-2 border">Safety Measures</th>
              <th className="px-4 py-2 border">Refilling date</th>
              <th className="px-4 py-2 border">Expiry date</th>
            </tr>
          </thead>
          <tbody>
            {safetyData.map((entry) => (
              <tr key={entry.sNo} className="hover:bg-gray-100">
                <td className="px-4 py-2 border text-center">{entry.sNo}</td>
                <td className="px-4 py-2 border">{entry.location}</td>
                <td className="px-4 py-2 border text-center">{entry.qty}</td>
                <td className="px-4 py-2 border whitespace-pre-line">{entry.measure}</td>
                <td className="px-4 py-2 border text-center">{entry.refillDate}</td>
                <td className="px-4 py-2 border text-center">{entry.expiryDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
            </div>}
        {active === "Gallery" && (
  <div className="bg-white py-10 px-4 sm:px-6 lg:px-8">


    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {[
        "https://nec.edu.in/wp-content/uploads/2024/01/mech_gallaery_1-1-300x199-copy.webp",
        "https://nec.edu.in/wp-content/uploads/2024/01/mech_gallaery_3-1-300x200-copy.webp",
        "https://nec.edu.in/wp-content/uploads/2024/01/mech_gallaery_4-1-300x200-copy.webp",
        "https://nec.edu.in/wp-content/uploads/2024/01/mech_gallaery_5-1-300x200-copy.webp",
        "https://nec.edu.in/wp-content/uploads/2024/01/mech_gallaery_6-1-300x199-copy.webp",
        "https://nec.edu.in/wp-content/uploads/2024/01/mech_gallaery_7-300x199-copy.webp",
        "https://nec.edu.in/wp-content/uploads/2024/01/mech_gallaery_2-1-300x199-copy.webp",
      ].map((src, index) => (
        <div
          key={index}
          className="rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition duration-300"
        >
          <img
            src={src}
            alt={`Gallery Image ${index + 1}`}
            className="w-full h-auto object-cover"
          />
        </div>
      ))}
    </div>
  </div>
)}


        </main>
      </div>
    </div>
  );
};

export default MechDept;
