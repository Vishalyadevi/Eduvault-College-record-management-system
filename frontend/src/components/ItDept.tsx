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

export const facultyData1 = [
  {
    name: "Dr.K.G.Srinivasan",
    designation: "Professor & Head",
    imageUrl: "/images/kg-srinivasan.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Dr.R.Muthukkumar",
    designation: "Associate Professor",
    imageUrl: "/images/r-muthukkumar.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Dr.S.Chidambaram",
    designation: "Associate Professor",
    imageUrl: "/images/s-chidambaram.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Dr.V.Manimaran",
    designation: "Associate Professor",
    imageUrl: "/images/v-manimaran.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Dr.S.Rajagopal",
    designation: "Associate Professor",
    imageUrl: "/images/s-rajagopal.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Ms.V.Anitha",
    designation: "Assistant Professor (Sr Grade)",
    imageUrl: "/images/v-anitha.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Ms.N.Gowthami",
    designation: "Assistant Professor (Sr Grade)",
    imageUrl: "/images/n-gowthami.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Ms.M.Manimegalai",
    designation: "Assistant Professor (Sr Grade)",
    imageUrl: "/images/m-manimegalai.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Ms.S.Santhi",
    designation: "Assistant Professor",
    imageUrl: "/images/s-santhi.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Ms.R.Suguna",
    designation: "Assistant Professor",
    imageUrl: "/images/r-suguna.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Ms.M.Malathi",
    designation: "Assistant Professor",
    imageUrl: "/images/m-malathi.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Ms.C.Ajitha",
    designation: "Assistant Professor",
    imageUrl: "/images/c-ajitha.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
  {
    name: "Ms.M.Akila",
    designation: "Assistant Professor",
    imageUrl: "/images/m-akila.png",
    pdfUrl: "#",
    profileUrl: "#",
  },
];

export const adjunctFacultyData = [
  {
    name: "Mr.S.Rajendran",
    designation: "Adjunct Faculty",
    imageUrl: "/images/s-rajendran.png", // Replace with actual image path
    pdfUrl: "#",                         // Replace with actual PDF URL if available
    profileUrl: "#",                     // Replace with actual profile URL if available
  },
];

const researchData = [
  {
    year: "1",
    sciPublications: 58,
    patentsPublished: 3,
    patentsGranted: 0,
    fundedProjects: "13,09,271",
    consultancy: "Rs.45,000/-",
    mous: 3
  }
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

const facultyData: Faculty[] = [
  { name: "Dr.K.G.Srinivasa​gan", designation: "Professor & Head", vidwanId: "338936", profileUrl: "https://vidwan.inflibnet.ac.in/profile/338936" },
  { name: "Dr.B.Paramasivan", designation: "Professor", vidwanId: "211513", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211513" },
  { name: "Dr.R.Muthukkumar", designation: "Professor", vidwanId: "211505", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211505" },
  { name: "Dr.S.Chidambaram", designation: "Associate Professor", vidwanId: "286530", profileUrl: "https://vidwan.inflibnet.ac.in/profile/286530" },
  { name: "Dr.V.Manimaran", designation: "Associate Professor", vidwanId: "211506", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211506" },
  { name: "Dr.S.Rajagopal", designation: "Associate Professor", vidwanId: "286250", profileUrl: "https://vidwan.inflibnet.ac.in/profile/286250" },
  { name: "Ms.V.Anitha", designation: "Assistant Professor (Sr.Grade)", vidwanId: "286250", profileUrl: "https://vidwan.inflibnet.ac.in/profile/286250" },
  { name: "Ms.N.Gowthami", designation: "Assistant Professor (Sr.Grade)", vidwanId: "286927", profileUrl: "https://vidwan.inflibnet.ac.in/profile/286927" },
  { name: "Ms.M.Manimegalai", designation: "Assistant Professor (Sr.Grade)", vidwanId: "287045", profileUrl: "https://vidwan.inflibnet.ac.in/profile/287045" },
  { name: "Ms.S.Santhi", designation: "Assistant Professor (Sr.Grade)", vidwanId: "286936", profileUrl: "https://vidwan.inflibnet.ac.in/profile/286936" },
  { name: "Ms.R.Suguna", designation: "Assistant Professor", vidwanId: "338890", profileUrl: "https://vidwan.inflibnet.ac.in/profile/338890" },
  { name: "Ms.R.Madhu", designation: "Assistant Professor", vidwanId: "338868", profileUrl: "https://vidwan.inflibnet.ac.in/profile/338868" },
  { name: "Ms.M.Malathi", designation: "Assistant Professor", vidwanId: "404982", profileUrl: "https://vidwan.inflibnet.ac.in/profile/404982" },
  { name: "Ms.C.Ajitha", designation: "Assistant Professor", vidwanId: "614029", profileUrl: "https://vidwan.inflibnet.ac.in/profile/614029" },
  { name: "Ms.H.Ummu Sabura", designation: "Assistant Professor", vidwanId: "590246", profileUrl: "https://vidwan.inflibnet.ac.in/profile/590246" },
  { name: "Ms.M.Akila", designation: "Assistant Professor", vidwanId: "613920", profileUrl: "https://vidwan.inflibnet.ac.in/profile/613920" }
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
const peos = [
  {
    icon: "https://nec.edu.in/wp-content/uploads/2024/01/businessman-success-copy.webp", // Replace with your image path
    text: "Excel in IT, ITES industries and higher education by applying the principles and practices of computing.",
  },
  {
    icon: "https://nec.edu.in/wp-content/uploads/2024/01/leader-of-a-group-with-an-empty-speech-bubble-copy.webp", // Replace with your image path
    text: "Maintain professionalism and adapt to emerging technologies.",
  },
  {
    icon: "https://nec.edu.in/wp-content/uploads/2024/01/manager-3-copy.webp", // Replace with your image path
    text: "Equip themselves as a leader and capable of managing Multi disciplinary environment.",
  },
];

const navItems = ["Home", "Faculty", "Courses", "Facilities", "Gallery"];

const ItDept = () => {
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
    <div className="min-h-screen  text-blue-900 flex flex-col">
      {/* Header with background image */}
       <div className="fee-banner">
        <h1 className="fee-title">Department of Information Technology</h1>
      </div><br></br>
<div className="flex min-h-screen ">
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
    <div>
      {/* HoD’s Desk */}
      <section className="bg-white p-4 rounded-lg mb-0"> {/* Set mb-0 to remove margin-bottom */}
        <h4 className="mb-5 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold">HoD's Desk</strong>
        </h4>
        <p className="border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          Our IT department was established in the year 2001 and offers both B.Tech. in Information Technology at the undergraduate level and M.Tech. in Information and Cyber Warfare at the postgraduate level. In 2016, a Ph.D. research programme was also introduced. We have highly qualified faculty members with rich teaching and research experience in diverse fields such as IoT, Data Analytics, Image Processing, Optical Communication, Network Security, and Mobile Ad-Hoc Networks. Our department is committed to fostering a culture of research and innovation, supported by well-equipped laboratories and a dedicated research centre. Students benefit from a technologically enriched environment with modern infrastructure. With a consistent placement record exceeding 90%, our students have secured positions in leading multinational corporations.
        </p>
      </section>

      {/* Vision & Mission */}
      <div className="bg-white p-2 rounded-lg mb-0 mt-0"> {/* Set mb-0 and mt-0 to remove both margins */}
        <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;Vision</strong>
        </h4>
        <p className="border-0 m-0 p-0 text-base box-border mb-4 text-black Times mb-5">
          &nbsp;&nbsp;&nbsp;To produce technically competent and ethically grounded IT professionals capable of meeting the dynamic challenges of the global IT industry.
        </p>
      <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold">&nbsp;Mission</strong>
        </h4>
        
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>Delivering high-quality education with innovative teaching-learning practices.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>Organizing student-centric activities to foster communication, teamwork, leadership, and self-directed learning.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>Instilling strong ethical values and a sense of social responsibility.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>Promoting a collaborative research ecosystem to support academic and industry-aligned innovation.</span>
          </li>
        </ul>
      </div>

      {/* Salient Features */}
      <section className="bg-white p-2 rounded-lg mb-0 mt-0">
        <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;Salient Features</strong>
        </h4><br></br>
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Autonomous status conferred by UGC</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>NBA Accredited</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Anna University recognized Research Centre</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Active participation in Smart India Hackathon</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Emphasis on Project-Based Learning</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>ICT-enabled classrooms</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Career counseling by alumni and industry experts</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Vibrant technical and student associations: IT Association, IEEE Student Branch, CSI Student Chapter, IE(I) Student Chapter</span>
          </li>
        </ul>
      </section>

      {/* Academic Programmes */}
      <section className="bg-white p-2 rounded-lg mb-0 mt-0">
        <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;Academic Programmes</strong>
        </h4><br></br>
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
          <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;UG – B.Tech. Information Technology</h5>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Establishment Year – 2001</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Student Intake: 60</span>
          </li>
        </ul> 
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
          <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;PG – M.Tech. Information and Cyber Warfare</h5>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Establishment Year – 2009</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Student Intake: 18</span>
          </li>
        </ul> 
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
          <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;PhD Research Centre</h5>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Establishment Year – 2016</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Research Scholars:</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Full time – 4</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Part time – 32</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Awarded – 26</span>
          </li>
        </ul> 
      </section>
       
      {/* Faculty */}
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
                {currentData.map((faculty, index) => (
                  <tr key={faculty.vidwanId} className="even:bg-gray-100">
                    <td className="p-2 border text-center">{start + index + 1}</td>
                    <td className="p-2 border">{faculty.name}</td>
                    <td className="p-2 border">{faculty.designation}</td>
                    <td className="p-2 border">{faculty.vidwanId}</td>
                    <td className="p-2 border">
                      <a
                        href={faculty.profileUrl}
                        className="text-blue-500 underline hover:text-blue-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {faculty.profileUrl}
                      </a>
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
      
      {/* Research */}
      <br></br>
      <section className="bg-white p-2 rounded-lg mb-0 mt-0">
        <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;Research @ IT In NEC</strong>
        </h4><br></br>
        <br></br>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-blue-600 text-white text-center">
                <th className="p-4 border border-gray-300">Academic Year</th>
                <th className="p-4 border border-gray-300">Publications (Nos)</th>
                <th className="p-4 border border-gray-300">Patents Published</th>
                <th className="p-4 border border-gray-300">Patents Granted</th>
                <th className="p-4 border border-gray-300">Funded Projects (Rs)</th>
                <th className="p-4 border border-gray-300">Consultancy (Rs)</th>
                <th className="p-4 border border-gray-300">MoUs</th>
              </tr>
            </thead>
            <tbody>
              {researchData.map((item, index) => (
                <tr key={index} className="even:bg-gray-100">
                  <td className="p-4 border border-gray-300">{item.year}</td>
                  <td className="p-4 border border-gray-300">{item.sciPublications}</td>
                  <td className="p-4 border border-gray-300">{item.patentsPublished}</td>
                  <td className="p-4 border border-gray-300">{item.patentsGranted}</td>
                  <td className="p-4 border border-gray-300">{item.fundedProjects}</td>
                  <td className="p-4 border border-gray-300">{item.consultancy}</td>
                  <td className="p-4 border border-gray-300">{item.mous}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
       
       <section className="bg-white p-2 rounded-lg mt-4">
  <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;Facilities</strong>
  </h4>
  <br />
  <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black">
    <li className="flex items-start gap-3">
      &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
      <span>Department has enough classrooms for conducting lectures and tutorials for II-, III-, and IV-year B.Tech IT students.</span>
    </li>
    <li className="flex items-start gap-3">
      &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
      <span>Department has a seminar hall to conduct workshops, seminars, and guest lectures.</span>
    </li>
    <li className="flex items-start gap-3">
      &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
      <span>Classrooms are provided with good ventilation and uninterrupted power supply.</span>
    </li>
    <li className="flex items-start gap-3">
      &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
      <span>Counseling room is provided for grievance redressal and student motivation.</span>
    </li>
    <li className="flex items-start gap-3">
      &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
      <span>UG classrooms are of size 75 sq.mt, PG classrooms and elective halls are 56 sq.mt, adequately accommodating students.</span>
    </li>
    <li className="flex items-start gap-3">
      &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
      <span>Department has good soundproof classrooms.</span>
    </li>
    <li className="flex items-start gap-3">
      &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
      <span>Multimedia projectors and overhead projectors are available for conducting presentation sessions.</span>
    </li>
  </ul>
</section>
<br/>
<br/>
<br/>
<div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
          {/* UG Lab I */}
          <div>
             <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;UG Lab I</strong>
  </h4>
  <br/>
            <img
              src="https://nec.edu.in/wp-content/uploads/2024/02/UG1-copy-scaled-copy-1536x864.webp" // Replace with correct path
              alt="UG Lab I - Boolean Lab"
              className="w-full h-auto rounded shadow-lg"
            />
            
          </div>

          {/* UG Lab II */}
          <div>
            <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;UG Lab II</strong>
   
  </h4>
   <br/>
            <img
              src="https://nec.edu.in/wp-content/uploads/2024/02/UG2-copy-scaled-copy-1536x864.webp" // Replace with correct path
              alt="UG Lab II - S.Ramanujan Lab"
              className="w-full h-auto rounded shadow-lg"
            />
            
          </div>
        </div>
      </div>
      <br/>
<br/>
<br/>
<div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
          {/* UG Lab I */}
          <div>
             <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;UG Lab III</strong>
  </h4>
  <br/>
            <img
              src="https://nec.edu.in/wp-content/uploads/2024/02/UG3-copy-scaled-1-1536x864.webp" // Replace with correct path
              alt="UG Lab I - Boolean Lab"
              className="w-full h-auto rounded shadow-lg"
            />
            
          </div>

          {/* UG Lab II */}
          <div>
            <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;PG Lab </strong>
   
  </h4>
   <br/>
            <img
              src="https://nec.edu.in/wp-content/uploads/2024/02/PG-Lab-copy-scaled-1-1536x864.webp" // Replace with correct path
              alt="UG Lab II - S.Ramanujan Lab"
              className="w-full h-auto rounded shadow-lg"
            />
            
          </div>
        </div>
      </div>
      <br/>
<br/>
<br/>
<div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
          {/* UG Lab I */}
          <div>
             <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;UG Lab I</strong>
  </h4>
  <br/>
            <img
              src="https://nec.edu.in/wp-content/uploads/2024/02/UG1-copy-scaled-copy-1536x864.webp" // Replace with correct path
              alt="UG Lab I - Boolean Lab"
              className="w-full h-auto rounded shadow-lg"
            />
            
          </div>

          {/* UG Lab II */}
          <div>
            <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;UG Lab II</strong>
   
  </h4>
   <br/>
            <img
              src="https://nec.edu.in/wp-content/uploads/2024/02/UG2-copy-scaled-copy-1536x864.webp" // Replace with correct path
              alt="UG Lab II - S.Ramanujan Lab"
              className="w-full h-auto rounded shadow-lg"
            />
            
          </div>
        </div>
      </div>
      <br/>
<br/>
<br/>
<div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
          {/* UG Lab I */}
          <div>
             <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;Seminar Hall</strong>
  </h4>
  <br/>
            <img
              src="https://nec.edu.in/wp-content/uploads/2024/02/Seminar-Hall-copy-scaled-copy-2-1536x864.webp" // Replace with correct path
              alt="UG Lab I - Boolean Lab"
              className="w-full h-auto rounded shadow-lg"
            />
            
          </div>

          {/* UG Lab II */}
          <div>
            <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;Technobation Centre </strong>
   
  </h4>
   <br/>
            <img
              src="https://nec.edu.in/wp-content/uploads/2024/02/technobation-centre-copy-scaled-copy-1536x864.webp" // Replace with correct path
              alt="UG Lab II - S.Ramanujan Lab"
              className="w-full h-auto rounded shadow-lg"
            />
            
          </div>
        </div>
      </div>
        <br/>
<br/>
<br/>
<div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
          {/* UG Lab I */}
          <div>
             <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;Incubation Centre</strong>
  </h4>
  <br/>
  
            <img
              src="https://nec.edu.in/wp-content/uploads/2024/02/incubation-centre-copy-scaled-1-1536x864.webp" // Replace with correct path
              alt="UG Lab I - Boolean Lab"
              className="w-full h-auto rounded shadow-lg"
            />
            
          </div>
      </div>
      </div>
      <br/>
      <br/>
      <div className="max-w-7xl mx-auto ">
       
        <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;Programme Educational Objectives (PEOs)</strong>
  </h4>
  <br/>
  <br/>
        <p className=" border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          Programme educational objectives are broad statements that describe
          the career and professional accomplishments that the program is
          preparing graduates to achieve.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-8">
          {peos.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center px-4">
              <img
                src={item.icon}
                alt="PEO icon"
                className="w-16 h-16 mb-4"
              />
              <p className="text-gray-800 text-base">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      <br/>
      
      {/* Contact */}
      <br></br>
      <br></br>
      <section className="bg-white p-2 rounded-lg mb-0 mt-0">
        <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;Contact Us</strong>
        </h4><br></br>

        <div className="text-gray-800 text-[17px] leading-relaxed space-y-2">
          <p><span className="font-semibold text-black">&nbsp;&nbsp;Dr. K.G. Srinivasagan</span> M.Tech, Ph.D.</p>
          <p>&nbsp;&nbsp;Professor &amp; Head,</p>
          <p>&nbsp;&nbsp;Department of Information Technology,</p>
          <p>&nbsp;&nbsp;National Engineering College,</p>
          <p>&nbsp;&nbsp;K. R Nagar, Kovilpatti.</p>
          <p>
            <span className="font-semibold">&nbsp;&nbsp;Email:</span>{" "}
            <a href="mailto:hodit@nec.edu.in" className="text-blue-600 hover:underline">hodit@nec.edu.in</a>
          </p>
          <p>
            <span className="font-semibold">&nbsp;&nbsp;Ph. No:</span> [Phone Number]
          </p>
        </div>
      </section>
    </div>
)}

          {/* Other Tabs */}
         {/* Other Tabs */}
{active === "Faculty" && (
  <div>
    <section className="bg-white p-2 rounded-lg mb-0 mt-0">
      {/* Regular Faculty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-20 max-w-7xl mx-auto">
        {facultyData1.map((faculty, index) => (
          <div
            key={index}
            className="bg-gray-100 shadow-[0_0_15px_3px_rgba(14,43,100,0.4)] p-6 flex flex-col items-center text-center transition-transform duration-300 hover:bg-[#0e2b73] scale-105 h-85 w-95 group"
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
                  className="bg-gray-200 p-2 rounded-full hover:bg-red-200 transition"
                >
                  <FaFilePdf size={18} />
                </a>
              )}
              {faculty.profileUrl && (
                <a
                  href={faculty.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 p-2 rounded-full hover:bg-blue-200 transition"
                >
                  <FaLink size={18} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
<br/>
<br/>
      {/* Adjunct Faculty */}

       <h4 className="text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
    <strong className="font-bold">&nbsp;Adjunct Faculty</strong>
  </h4>
  <br/>
  <br/>
      <div className="flex flex-wrap gap-6 ">
        {adjunctFacultyData.map((faculty, index) => (
          <div
            key={index}
            className="bg-gray-100 shadow-[0_0_15px_3px_rgba(14,43,100,0.4)] p-6 flex flex-col items-center text-center transition-transform duration-300 hover:bg-[#0e2b73] scale-105 h-85 w-95 group"
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
                  className="bg-gray-200 p-2 rounded-full hover:bg-red-200 transition"
                >
                  <FaFilePdf size={18} />
                </a>
              )}
              {faculty.profileUrl && (
                <a
                  href={faculty.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 p-2 rounded-full hover:bg-blue-200 transition"
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
          {active === "Gallery" && <div>
            
            </div>}
        </main>
      </div>
    </div>
  );
};

export default ItDept;
