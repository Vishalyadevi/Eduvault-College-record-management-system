import React, { useState } from 'react';
import { ChevronDown, MapPin, GraduationCap, Eye, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageSlider from './ImageSlider';

const About = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleExplorePrograms = () => {
    navigate('/programmes-offered');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="relative z-10">
      </div>
      
      <div className="flex-grow pt-4 bg-fixed bg-cover bg-center relative" 
        style={{
          backgroundImage: `url('https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fgyaanarth.com%2Fwp-content%2Fuploads%2F2022%2F06%2FIMG-1-6350609.jpg&f=1&nofb=1&ipt=f4a9b5f20239133dab084ee80118934c04fde366bdbedc7c58de4748e377e9a7&ipo=images')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 pt-8">
              <h1 className="text-4xl font-bold text-yellow-500 mb-4">About National Engineering College</h1>
              <p className="text-lg text-white">
                Established in 1984 by the visionary Kalvithanthai Thiru. K. Ramasamy, National Engineering College (NEC) 
                is a premier autonomous institution affiliated with Anna University, Chennai.
              </p>
            </div>

            <div className="space-y-6">
              {/* Why Choose NEC? */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSection('why-choose')}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-6 w-6 text-[#003087]" />
                    <span className="text-lg font-semibold">Why Choose NEC?</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 transform transition-transform duration-300 ${
                    activeSection === 'why-choose' ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {activeSection === 'why-choose' && (
                  <div className="p-6 bg-gray-50 animate-slideDown">
                    <div className="flex flex-col space-y-6">
                      <video 
                        controls
                        className="w-full rounded-lg"
                      >
                        <source 
                          src="https://nec.edu.in/wp-content/uploads/2024/11/Nec-Campus-2024-NATIONAL-ENGINEERING-COLLEGE-KOVILPATTI-720p-h264-youtube.mp4" 
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <h3 className="font-semibold text-[#003087] mb-2">Ranked #169</h3>
                          <p>in the National Institutional Ranking Framework (NIRF) 2022</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <h3 className="font-semibold text-[#003087] mb-2">Autonomous Status</h3>
                          <p>Freedom to innovate and design cutting-edge curricula</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <h3 className="font-semibold text-[#003087] mb-2">State-of-the-Art Infrastructure</h3>
                          <p>Modern labs, libraries, and facilities to support learning and research</p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Our Location */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSection('location')}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-6 w-6 text-[#003087]" />
                    <span className="text-lg font-semibold">Our Location</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 transform transition-transform duration-300 ${
                    activeSection === 'location' ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {activeSection === 'location' && (
                  <div className="p-6 bg-gray-50 animate-slideDown">
                    <div className="space-y-6">
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3942.8874803543544!2d77.81419827507695!3d8.804356791798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b03e7a0bd8d0bbb%3A0x14c27b873ef94923!2sNational%20Engineering%20College!5e0!3m2!1sen!2sin!4v1710414433399!5m2!1sen!2sin"
                          width="100%"
                          height="450"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="rounded-lg"
                        ></iframe>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <h3 className="font-semibold text-[#003087] mb-3">Nearby Cities</h3>
                          <ul className="space-y-2">
                            <li>Madurai (100 km | 62 mi)</li>
                            <li>Tirunelveli (60 km | 37 mi)</li>
                            <li>Thoothukudi (60 km | 37 mi)</li>
                            <li>Kanyakumari (110 km | 68 mi)</li>
                          </ul>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <h3 className="font-semibold text-[#003087] mb-3">Industry Partnerships</h3>
                          <p>Collaborations with leading organizations to provide real-world exposure</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Our Vision */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSection('vision')}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <Eye className="h-6 w-6 text-[#003087]" />
                    <span className="text-lg font-semibold">Our Vision</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 transform transition-transform duration-300 ${
                    activeSection === 'vision' ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {activeSection === 'vision' && (
                  <div className="p-6 bg-gray-50 animate-slideDown">
                    <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                      <ImageSlider />
                      <p className="text-lg mt-8">
                        To be a globally recognized institution that fosters 
                        <span className="font-semibold text-[#003087]"> academic excellence, innovation, and ethical leadership</span>, 
                        empowering students to create a sustainable future.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Join the NEC Family */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSection('join')}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-[#003087]" />
                    <span className="text-lg font-semibold">Join the NEC Family</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 transform transition-transform duration-300 ${
                    activeSection === 'join' ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {activeSection === 'join' && (
                  <div className="p-6 bg-gray-50 animate-slideDown">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <p className="text-lg mb-6 text-center">
                        Whether you're an aspiring engineer, a researcher, or a collaborator, NEC offers a dynamic 
                        environment to learn, grow, and innovate.
                      </p>
                      <div className="flex justify-center space-x-4">
                        <button 
                          onClick={handleExplorePrograms}
                          className="bg-[#003087] text-white px-6 py-3 rounded-lg hover:bg-[#1a4b8c] transition-colors duration-300"
                        >
                          Explore Programs
                        </button>
                        <button className="border-2 border-[#003087] text-[#003087] px-6 py-3 rounded-lg hover:bg-[#003087] hover:text-white transition-colors duration-300">
                          Contact Us
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
