import React, { useState } from 'react';
import { BookOpen, Users, Award, Building2, GraduationCap, X } from 'lucide-react';
import Navbar from './Navbar'; // Assuming Navbar is in the same directory

const departments = [
  {
    name: "Department of Civil Engineering",
    hod: "Dr. K. Gunasekaran",
    icon: Building2,
    description: "Focusing on structural engineering, construction management, and sustainable development."
  },
  {
    name: "Department of Computer Science and Engineering",
    hod: "Dr. N. Krishnamoorthy",
    icon: BookOpen,
    description: "Advancing technology through innovative research in AI, cybersecurity, and software engineering."
  },
  {
    name: "Department of Electronics and Communication Engineering",
    hod: "Dr. R. Dhaya",
    icon: GraduationCap,
    description: "Leading research in communications, signal processing, and embedded systems."
  },
  {
    name: "Department of Electrical and Electronics Engineering",
    hod: "Dr. D. Sabapathi",
    icon: Users,
    description: "Excellence in power systems, control systems, and renewable energy."
  },
  {
    name: "Department of Mechanical Engineering",
    hod: "Dr. S. Rajesh",
    icon: Award,
    description: "Innovation in design, manufacturing, and thermal engineering."
  }
];

const staffMembers = [
  { name: "Dr.A.Shenbagavalli", position: "Dean (Academic)" },
  { name: "Dr.K.Mohaideen Pitchai", position: "Professor/ CSE" },
  { name: "Dr. F.Micheal Thomas Rex", position: "Asso. Professor/Mech." },
  { name: "Dr.K.J.Prasanna Venkatesan", position: "Asso. Professor/ECE." },
  { name: "Dr.S.Geetha", position: "Asso. Professor/Sci. & Hum." },
  { name: "Ms.R.Chermasakthi", position: "Assistant" }
];

function AcademicsOverview() {
  const [showDepartments, setShowDepartments] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar /> {/* Include the Navbar component */}
      
      {/* Header */}
      <header className="bg-blue-900 text-white py-6 fixed top-0 left-0 w-full z-20">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold animate_animated animate_fadeIn">Welcome to Academics Overview</h1>
          </div>
        </div>
      </header>
      <div className="pt-24">
        {/* Additional content can go here */}
      </div>

      {/* Fixed Department Button */}
      <button 
        className="fixed right-6 top-1/2 transform -translate-y-1/2 bg-blue-900 text-white px-6 py-3 rounded-l-xl shadow-lg hover:bg-blue-800 transition-colors duration-300 z-30"
        onClick={() => setShowDepartments(true)}
      >
        <span className="writing-mode-vertical text-lg font-semibold">Departments</span>
      </button>

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 w-80 bg-blue-900 text-white transform transition-transform duration-300 ease-in-out z-40 ${
          showDepartments ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 pt-20 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Departments</h2>
            <button 
              onClick={() => setShowDepartments(false)}
              className="hover:bg-blue-800 p-2 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="space-y-4 overflow-y-auto departments-scroll flex-1 pr-2">
            {departments.map((dept, index) => (
              <a
                key={index}
                href="#"
                className="block p-4 rounded-xl bg-blue-800/50 hover:bg-blue-800 transition-all duration-200 group"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <dept.icon className="h-6 w-6" />
                  <h3 className="font-semibold">{dept.name}</h3>
                </div>
                <p className="text-sm text-blue-200 pl-9">{dept.description}</p>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section 
          className="relative h-[600px] bg-cover bg-center mb-16"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-900/50" />
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
            <div className="max-w-3xl">
              <p className="text-xl text-blue-100 leading-relaxed mb-8">
                Established in 2010, we oversee all academic activities and ensure excellence in education through continuous improvement and innovation.
              </p>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-blue-50">
                <p className="leading-relaxed">
                  The Academic Dean is responsible for all academic matters pertaining to U.G. and P.G. programmes offered by the Institute.
                  This office revises the U.G. and P.G. Regulations, curriculum and syllabus of all branches of Engineering, Technology & Science 
                  and Humanities as per the guidelines of UGC, AICTE and Anna University, Chennai.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Staff Section */}
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-blue-900 mb-12 text-center">Academic Office Staff</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {staffMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-blue-900 mb-2">{member.name}</h3>
                    <p className="text-blue-600">{member.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-blue-900 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Contact Us</h2>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
                <div className="space-y-4 text-lg">
                  <p>Email: academic.dean@institution.edu</p>
                  <p>Phone: +91 (123) 456-7890</p>
                  <p>Office Hours: Monday - Friday, 9:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-blue-950 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2024 Office of the Academic Dean. All rights reserved.</p>
        </div>
      </footer>

      {/* Overlay */}
      {showDepartments && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowDepartments(false)}
        />
      )}
    </div>
  );
}

export default AcademicsOverview;