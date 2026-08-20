import React, { useState } from 'react';
import { BookOpen, FlaskRound as Flask, GraduationCap, LineChart, Microscope, Users, ChevronDown } from 'lucide-react';

const researchDepartments = [
  { name: "Mechanical Engineering", year: "2006", expertise: ["Manufacturing", "Materials", "Simulation studies"] },
  { name: "Electronics and Communication Engineering", year: "2006", expertise: ["Telecommunication", "Sensor Networks"] },
  { name: "Computer Science and Engineering", year: "2006", expertise: ["Computation", "Image Processing"] },
  { name: "Electrical and Electronics Engineering", year: "2006", expertise: ["Energy", "Power Systems"] },
  { name: "CHEMISTRY", year: "2007", expertise: ["Nanotechnology", "Materials Science"] },
  { name: "Information Technology", year: "2016", expertise: ["Software Systems", "Network Security"] }
];

const researchAreas = [
  {
    icon: <Flask className="w-12 h-12 text-blue-600" />,
    title: "Engineering Research",
    description: "Cutting-edge research in Manufacturing, Materials, Energy Systems, and Power Electronics.",
    details: "Our engineering research spans across mechanical, electrical, and electronics domains, focusing on innovative solutions for industry challenges."
  },
  {
    icon: <Microscope className="w-12 h-12 text-blue-600" />,
    title: "Scientific Innovation",
    description: "Advanced research in Nanotechnology, Materials Science, and Chemical Engineering.",
    details: "Leading breakthrough research in nanotechnology and materials science, contributing to next-generation technological advancements."
  },
  {
    icon: <LineChart className="w-12 h-12 text-blue-600" />,
    title: "Data Analytics",
    description: "Research in Computation, Image Processing, and Network Security.",
    details: "Leveraging advanced computational methods and AI for solving complex analytical challenges."
  },
  {
    icon: <Users className="w-12 h-12 text-blue-600" />,
    title: "Collaborative Research",
    description: "Multi-disciplinary research programs with industry and academic partners.",
    details: "Working with AICTE, BRNS, CSIR, DST, DRDO, ICMR, IGCAR, TNSTC on funded projects worth over Rs. 6.4 Crores."
  },
  {
    icon: <BookOpen className="w-12 h-12 text-blue-600" />,
    title: "Publications",
    description: "Research publications from our 57 Ph.D holders and 143 research scholars.",
    details: "Contributing to leading journals and conferences across Engineering, Technology and Sciences."
  },
  {
    icon: <GraduationCap className="w-12 h-12 text-blue-600" />,
    title: "Academic Excellence",
    description: "Six departments recognized as research centers by Anna University.",
    details: "Supported by over 35 recognized supervisors conducting research in specialized areas."
  }
];

function Research() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showDepartments, setShowDepartments] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004684] to-[#004684]/90">
      {/* Hero Section */}
      <div className="relative h-[400px] flex items-center justify-center text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('/images/13.jpg')"
          }}
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl font-bold mb-6">Research at NEC</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Advancing knowledge through innovative research and collaborative partnerships
          </p>
        </div>
      </div>

      {/* About Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-[#004684] mb-6">About</h2>
          <p className="text-gray-700 mb-6">
            Research and Development @ NEC is carried out in several areas like Computation, Energy, Environment, 
            Image Processing, Materials, Manufacturing, Nanotechnology, Telecommunication and Sensor Networks 
            and Simulation studies. Six departments of NEC have been recognized as research centers by Anna University, Chennai.
          </p>
          <p className="text-gray-700 mb-6">
            The research centers @ NEC are supported by over 35 recognized supervisors, fifty seven Ph.D holders 
            and hundred and forty three research scholars covering specialized in a wide range of areas like 
            Engineering, Technology and Sciences. NEC is actively involved in various funded projects, and has 
            received over Rs. 6.4 Crores from various Governmental agencies like AICTE, BRNS, CSIR, DST, DRDO, 
            ICMR, IGCAR, TNSTC, etc.,
          </p>
          <div className="bg-[#004684]/5 p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-[#004684] mb-4">VISION</h3>
            <p className="text-gray-700 italic">
              "To converge knowledge, intellectuals, and resources for technological innovations"
            </p>
          </div>
        </div>
      </div>

      {/* Research Expertise Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          Our Research Expertise
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {researchAreas.map((area, index) => (
            <div 
              key={index}
              className={`bg-white rounded-lg shadow-lg transform transition-all duration-500 ease-in-out cursor-pointer
                ${expandedCard === index ? 'scale-105 z-10' : 'hover:scale-102'}
              `}
              onClick={() => setExpandedCard(expandedCard === index ? null : index)}
            >
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="transform transition-transform duration-500 hover:rotate-12">
                    {area.icon}
                  </div>
                  <h3 className="text-xl font-semibold mt-4 mb-2 text-[#004684]">
                    {area.title}
                  </h3>
                  <p className="text-gray-600">
                    {area.description}
                  </p>
                  <div 
                    className={`overflow-hidden transition-all duration-500 ease-in-out
                      ${expandedCard === index ? 'max-h-48 mt-4' : 'max-h-0'}
                    `}
                  >
                    <p className="text-gray-700 text-sm">
                      {area.details}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approved Research Centers */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="flex justify-between items-center cursor-pointer" 
               onClick={() => setShowDepartments(!showDepartments)}>
            <h2 className="text-3xl font-bold text-[#004684]">
              Approved Research Centers
            </h2>
            <ChevronDown 
              className={`w-6 h-6 text-[#004684] transform transition-transform duration-300
                ${showDepartments ? 'rotate-180' : ''}
              `}
            />
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out
            ${showDepartments ? 'max-h-[800px] mt-6' : 'max-h-0'}
          `}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {researchDepartments.map((dept, index) => (
                <div key={index} 
                     className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-semibold text-[#004684]">{dept.name}</h3>
                  <p className="text-gray-600 text-sm">Approved: {dept.year}</p>
                  <div className="mt-2">
                    <p className="text-sm text-gray-700">Expertise:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dept.expertise.map((exp, i) => (
                        <span key={i} className="text-xs bg-[#004684]/10 text-[#004684] px-2 py-1 rounded">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Research Statistics */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#004684] mb-12">
            Research Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <p className="text-4xl font-bold text-[#004684]">200+</p>
              <p className="text-gray-600 mt-2">Research Papers</p>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <p className="text-4xl font-bold text-[#004684]">50+</p>
              <p className="text-gray-600 mt-2">Research Projects</p>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <p className="text-4xl font-bold text-[#004684]">100+</p>
              <p className="text-gray-600 mt-2">Research Scholars</p>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <p className="text-4xl font-bold text-[#004684]">25+</p>
              <p className="text-gray-600 mt-2">Industry Partners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Research Facilities */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          Research Facilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://nec.edu.in/wp-content/uploads/2023/04/RD-top-image-copy.webp" 
              alt="Research Lab"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-[#004684] mb-2">
                State-of-the-art Laboratories
              </h3>
              <p className="text-gray-600">
                Our advanced research laboratories are equipped with the latest technology and tools to support groundbreaking research across various disciplines.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80" 
              alt="Research Team"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-[#004684] mb-2">
                Collaborative Research Centers
              </h3>
              <p className="text-gray-600">
                Our research centers foster collaboration between academia and industry, providing a platform for innovative research and development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Research;