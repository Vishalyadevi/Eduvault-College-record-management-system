import React, { useState } from "react";
import classNames from "classnames";
import "./FeePaymentGuide.css";
import { FaFilePdf, FaLink } from 'react-icons/fa';
import './ScrollableTable.css'; // Import custom scrollbar CSS
import SectionWrapper from './wrapper';
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
    name: 'Dr.V.Gomathi',
    designation: 'Professor & Head',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2024/01/cset004_gomathi_cse-1-1.jpg',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.D.Manimegalai',
    designation: 'Professor',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2024/01/manimegali_cse-1.jpg',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.K.Mohaideen Pitchai',
    designation: 'Professor',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2024/01/cset008.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.S.Kalaiselvi',
    designation: 'Associate Professor',
    imageUrl: 'https://nec.edu.in/wp-content/uploads/2024/01/CSET031_cse-1-1024x1024.jpg ',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.J.Naskath',
    designation: 'Associate Professor',
    imageUrl: '/images/naskath.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.R.Rajakumari',
    designation: 'Associate Professor',
    imageUrl: '/images/rajakumari.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.G.Sivakamasundari',
    designation: 'Associate Professor',
    imageUrl: '/images/sivakamasundari.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.B.Shunmuga Priya',
    designation: 'Associate Professor',
    imageUrl: '/images/shunmuga.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.D.Manimegalai',
    designation: 'Professor',
    imageUrl: '/images/manimegalai.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.K.Mohaideen Pitchai',
    designation: 'Professor',
    imageUrl: '/images/mohaideen.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.S.Kalaiselvi',
    designation: 'Associate Professor',
    imageUrl: '/images/kalaiselvi.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.J.Naskath',
    designation: 'Associate Professor',
    imageUrl: '/images/naskath.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.D.Manimegalai',
    designation: 'Professor',
    imageUrl: '/images/manimegalai.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.K.Mohaideen Pitchai',
    designation: 'Professor',
    imageUrl: '/images/mohaideen.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.S.Kalaiselvi',
    designation: 'Associate Professor',
    imageUrl: '/images/kalaiselvi.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.J.Naskath',
    designation: 'Associate Professor',
    imageUrl: '/images/naskath.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.D.Manimegalai',
    designation: 'Professor',
    imageUrl: '/images/manimegalai.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.K.Mohaideen Pitchai',
    designation: 'Professor',
    imageUrl: '/images/mohaideen.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.S.Kalaiselvi',
    designation: 'Associate Professor',
    imageUrl: '/images/kalaiselvi.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.J.Naskath',
    designation: 'Associate Professor',
    imageUrl: '/images/naskath.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.D.Manimegalai',
    designation: 'Professor',
    imageUrl: '/images/manimegalai.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.K.Mohaideen Pitchai',
    designation: 'Professor',
    imageUrl: '/images/mohaideen.png',
    pdfUrl: '#',
    profileUrl: '#',
  },
  {
    name: 'Dr.S.Kalaiselvi',
    designation: 'Associate Professor',
    imageUrl: '/images/kalaiselvi.png',
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

const facultyData: Faculty[] = [
  { name: "Dr.V.Gomathi", designation: "Prof. & Head", vidwanId: "211465", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211465" },
  { name: "Dr.D.Manimegalai", designation: "Professor", vidwanId: "273974", profileUrl: "https://vidwan.inflibnet.ac.in/profile/273974" },
  { name: "Dr.K.Mohaideen Pitchai", designation: "Professor", vidwanId: "211468", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211468" },
  { name: "Dr.S.Kalaiselvi", designation: "Associate Professor", vidwanId: "211426", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211426" },
  { name: "Dr.J.Naskath", designation: "Associate Professor", vidwanId: "211475", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211475" },
  { name: "Ms.R.Rajakumari", designation: "Associate Professor", vidwanId: "211480", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211480" },
  { name: "Dr.G.Sivakama Sundari", designation: "Associate Professor", vidwanId: "211481", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211481" },
  { name: "Ms.B.Shanmugapriya", designation: "Associate Professor", vidwanId: "211499", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211499" },
  { name: "Mr.S.Dheenathayalan", designation: "Associate Professor", vidwanId: "211514", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211514" },
  { name: "Mr.D.Vijayakumar", designation: "Assistant Professor (SG)", vidwanId: "211415", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211415" },
  { name: "Mr.A.Shenbagaraman", designation: "Assistant Professor (SG)", vidwanId: "211523", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211523" },
  { name: "Mr.K.Rajkumar", designation: "Assistant Professor (SG)", vidwanId: "211512", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211512" },
  { name: "Ms.D.Thamarai Selvi", designation: "Assistant Professor (SG)", vidwanId: "211483", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211483" },
  { name: "Mr.J.Karthikeyan", designation: "Assistant Professor (SG)", vidwanId: "273149", profileUrl: "https://vidwan.inflibnet.ac.in/profile/273149" },
  { name: "Dr.J.Ida Christy", designation: "Assistant Professor (SG)", vidwanId: "293327", profileUrl: "https://vidwan.inflibnet.ac.in/profile/293327" },
  { name: "Ms.M.Kanthimathi", designation: "Assistant Professor", vidwanId: "211524", profileUrl: "https://vidwan.inflibnet.ac.in/profile/211524" },
  { name: "Ms.D.Abisha", designation: "Assistant Professor", vidwanId: "273148", profileUrl: "https://vidwan.inflibnet.ac.in/profile/273148" },
  { name: "Ms.P.Priyadharshini", designation: "Assistant Professor", vidwanId: "286935", profileUrl: "https://vidwan.inflibnet.ac.in/profile/286935" },
  { name: "Ms.R. Vazhan Arul Santhiya", designation: "Assistant Professor", vidwanId: "286925", profileUrl: "https://vidwan.inflibnet.ac.in/profile/404213" },
  { name: "Ms.Navedha Evanjalin.R", designation: "Assistant Professor", vidwanId: "286939", profileUrl: "https://vidwan.inflibnet.ac.in/profile/286939" },
    { name: "Ms.A.Lincy", designation: "Assistant Professor", vidwanId: "292931", profileUrl: "https://vidwan.inflibnet.ac.in/profile/292931" },
  { name: "Ms.S.G.Janani Ratthna", designation: "Assistant Professor", vidwanId: "338519", profileUrl: "https://vidwan.inflibnet.ac.in/profile/338519" },
  { name: "Ms.K.Amsaveni", designation: "Assistant Professor", vidwanId: "294695", profileUrl: "https://vidwan.inflibnet.ac.in/profile/294695" },
  { name: "Ms.R.Srimathi", designation: "Assistant Professor", vidwanId: "525686", profileUrl: "https://vidwan.inflibnet.ac.in/profile/525686" },
  { name: "Ms.G.Pavithra", designation: "Assistant Professor", vidwanId: "554088", profileUrl: "https://vidwan.inflibnet.ac.in/profile/554088/NTU0MDg4" },
  { name: "Ms.K.Amutha", designation: "Assistant Professor", vidwanId: "549078", profileUrl: "https://vidwan.inflibnet.ac.in/profile/549078" },
  { name: "Ms.M.Mahalakshmi", designation: "Assistant Professor", vidwanId: "549806", profileUrl: "https://vidwan.inflibnet.ac.in/profile/549806" },

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

const CivilDept = () => {
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
        <h1 className="fee-title">Department of Civil Engineering
</h1>
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
       <main className="flex-1 px-4 sm:px-6 md:px-10 py-6 max-w-screen-xl mx-auto mb-0">
  {active === "Home" && (
    <div>
      {/* HoD’s Desk */}
       {/* About Section */}
  <section className="bg-white p-4 sm:p-6 md:p-8 rounded-lg mb-6">
     
    <h4 className="mb-5 text-xl sm:text-2xl md:text-[2rem] leading-tight font-normal font-serif text-[darkblue] clear-both">
      <strong className="font-bold">About</strong>
    </h4>
  
    <p className="text-sm sm:text-base text-black text-justify">
      The Civil Engineering Department started in the year 2012, offers B.E-Civil Engineering. The department has its own well-equipped state of art infrastructure. The department follows technology enabled teaching learning process like Learning Management System (LMS) and Classes are well equipped with Smart Monitors. The department is also a member of Institute of Engineers (India) – Student’s Chapter and Indian Society for Technical Education (ISTE) as professional bodies. The Civil Engineering Association (CEA) serves as a platform for students to make technical presentations, gain knowledge about recent advancements. The department has signed MoU’s with Federation of All Civil Engineers Association and CADD Technologies, Coimbatore for Student Mentor programme, to train Civil Engineering students. It also offers consultancy services in Structural, Environmental, Survey and Geotechnical fields.
    </p>
    
  </section>

  {/* Vision & Mission Section */}
  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg mb-6">
    <h4 className="mb-3 text-xl sm:text-2xl md:text-[2rem] leading-tight font-normal font-serif text-[darkblue] clear-both">
      <strong className="font-bold">Vision</strong>
    </h4>
    <p className="text-sm sm:text-base text-black mb-5">
      Producing outstanding civil engineering professionals with human values to face future challenges.
    </p>

    <h4 className="mb-3 text-xl sm:text-2xl md:text-[2rem] leading-tight font-normal font-serif text-[darkblue] clear-both">
      <strong className="font-bold">Mission</strong>
    </h4>
        
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>To maintain excellent infrastructure and highly qualified and dedicated faculty.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>To provide a conducive environment with an ambiance of humanity, wisdom, creativity, and team spirit.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>To promote the values of ethical behavior and commitment to society.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;<OrangeTickIcon />
            <span>To partner with academic, industrial, and government entities to attain collaborative research.</span>
          </li>
        </ul>
      </div>
              {/* PEO & PSO */}
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
                 <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;PEO Statements</strong>
        </h4>
         <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PEO 1: Achieve their professional career in industry/academia by applying the acquired knowledge of computer science and engineering.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PEO 2: Engage in life-long learning and enhance their capabilities by embracing cutting edge technical advancements.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PEO 3: Excel in collaboration with interdisciplinary teams and diverse stake holders for persevering successful start-ups.
           </span>
          </li>
        </ul>
                

                 <h4 className="mb-3 text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
          <strong className="font-bold ">&nbsp;PSO Statements</strong>
           </h4>
         <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black Times">
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PSO 1: Build domain specific expertise by showcasing deliverables in the field of Application development, Business Intelligence, Computational Intelligence and Cyber Security.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>PSO 2: Build knowledge base for students to solve complex technical problems through participation in global contests and hackathons.</span>
          </li>
          
        </ul>
                
              </section>

              {/* Salient Features */}
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
                
                 <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Salient Features</strong>
                  </h4><br></br>
                  <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;Accreditations & Recognitions</h5>
                   <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>B.E. CSE is accredited by NBA, New Delhi, since 2006.</span>
                   </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>NVIDIA DLI ambassadorship.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Zonal Partner under leadingindia.ai (up to Mar 2021).</span>
          </li>
          
        </ul>
               <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;Faculty</h5>
                   <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Highly motivated and well experienced faculty members.</span>
                   </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>11 faculty members hold Doctorate.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Student teacher ratio has been consistently maintained around 1 : 15.</span>
          </li>
          
        </ul> 
        
        
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;Infrastructure</h5>
                   <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>Department has well-equipped and spacious laboratories.</span>
                   </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>24/7 Wi-Fi connectivity.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Established research center for Image Processing.</span>
          </li>
          
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Classroom with ICT tools like Smartboard, Wall mounted projectors, Smart TV, Interactive display board, A-View systems, Document Cameras, and Wacom tablets for enhancing the teaching learning process.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Department has separate Library with more than 1000 books.</span>
          </li>
        </ul>
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;Academic Initiatives</h5>
                   <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
                    <span>OBE based academic planning before the start of semester by conducting course committee meetings.</span>
                   </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Meticulous student mentoring system.</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Faculty mentoring through focus group heads.</span>
          </li>
          
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Quality assurance through moderation process and academic audit.</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;<OrangeTickIcon />
            <span>Consistent placement (above 95%) and good internship records.</span>
          </li>
        </ul> 
              </section>

              {/* Academic Programmes */}
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
                <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Academic Programmes</strong>
                  </h4><br></br>
                <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;UG – B.E. Computer Science and Engineering</h5>
                   <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;
                    <span>Establishment Year – 1984</span>
                   </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Student Strength = 131+135+134 = 400</span>
          </li>
        </ul> 
        <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;PG – M.E. Computer Science and Engineering</h5>
                   <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;
                    <span>Establishment Year – 2002</span>
                   </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Student Strength – 6+3 = 9</span>
          </li>
        </ul> 
             <ul className="space-y-4 border-0 m-0 p-0 text-base box-border mb-4 text-black ">
                  
                    <h5 className=" text-black Times">&nbsp;&nbsp;&nbsp;&nbsp;PhD Research Centre</h5>
                   <li className="flex items-start gap-3">
                     &nbsp;&nbsp;&nbsp;
                    <span>Establishment Year – 2006</span>
                   </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Scholars:</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Full time – 3</span>
          </li>
           <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Part time – 10</span>
          </li>
          <li className="flex items-start gap-3">
            &nbsp;&nbsp;&nbsp;
            <span>Awarded – 40</span>
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
              <br></br>
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
                <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Research @ CSE In NEC</strong>
                  </h4><br></br>
                  <br></br>
                <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-blue-600 text-white text-center">
            <th className="p-4 border border-gray-300">Academic Year</th>
            <th className="p-4 border border-gray-300">SCI Publications (Nos)</th>
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
              <br></br>
              <br></br>
              <section className="bg-white p-2 rounded-lg mb-0 mt-0">
  <h4 className=" text-[2rem] leading-[1.2] font-normal font-serif text-[darkblue] clear-both">
                   <strong className="font-bold ">&nbsp;Contact Us</strong>
                  </h4><br></br>

           <div className="text-gray-800 text-[17px] leading-relaxed space-y-2">
           <p><span className="font-semibold text-black">&nbsp;&nbsp;Dr. V. Gomathi</span> M.Tech, Ph.D.</p>
          <p>&nbsp;&nbsp;Professor &amp; Head,</p>
    <p>&nbsp;&nbsp;Department of Computer Science and Engineering,</p>
    <p>&nbsp;&nbsp;National Engineering College,</p>
    <p>&nbsp;&nbsp;K. R Nagar, Kovilpatti.</p>
    <p>
      <span className="font-semibold">&nbsp;&nbsp;Email:</span>{" "}
      <a href="mailto:hodcse@nec.edu.in" className="text-blue-600 hover:underline">hodcse@nec.edu.in</a>
    </p>
    <p>
      <span className="font-semibold">&nbsp;&nbsp;Ph. No:</span> 9442522764, 8428884480
    </p>
  </div>
</section>

            </div>
          )}

          {/* Other Tabs */}
          {active === "Faculty" && <div>
           <section className="bg-white p-2 rounded-lg mb-0 mt-0 ">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-20 max-w-7xl mx-auto">
        {facultyData1.map((faculty, index) => (
          <div
            key={index}
            className="bg-gray-100  shadow-[0_0_15px_3px_rgba(14,43,100,0.4)] p-6 flex flex-col items-center text-center transition-transform duration-300 hover:bg-[#0e2b73] scale-105 h-85 w-95"
          >
            <div className="w-40 h-40 rounded-full overflow-hidden mb-4  border-white shadow-md ">
              <img
                src={faculty.imageUrl}
                alt={faculty.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="group-hover:text-white" style={headingStyle}>
                {faculty.name}
              </h3>
            
            <p className="text-gray-500 text-sm mb-4 group-hover:text-white">{faculty.designation}</p>
            <div className="flex gap-4">
              {faculty.pdfUrl && (
                <a
                  href={faculty.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 p-2 rounded-full hover:  transition"
                >
                  <FaFilePdf size={18} />
                </a>
              )}
              {faculty.profileUrl && (
                <a
                  href={faculty.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 p-2 rounded-full hover:  transition"
                >
                  <FaLink size={18} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
          </div>}
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

export default CivilDept;
