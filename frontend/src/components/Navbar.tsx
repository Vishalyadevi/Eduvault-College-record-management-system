import React, { useState, useEffect } from "react";
import './Navbar.css';

interface NavItem {
  title: string;
  link?: string;
  submenu?: NavItem[];
}

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  const [activeNestedSubmenu, setActiveNestedSubmenu] = useState<number | null>(null);
  
  const navItems: NavItem[] = [
    {
      title: "Home",
      submenu: [
        { title: "About", link: "/about-us" },
        { title: "Admission", link: "/admission" },
        { title: "Scholarship", link: "#" },
        { title: "Bulletin 2024–2025", link: "https://nec.edu.in/wp-content/uploads/2024/12/Bulletin-2024.pdf" },
      ],
    },
    {
      title: "Mandatory Disclosure",
      submenu: [
        {
          title: "All India Council For Technical Education (AICTE) ›",
          link: "#",
          submenu: [
            { title: "Feedback", link: "https://www.aicte-india.org/feedback/" },
            { title: "Schemes", link: "/scheme" },
            { title: "Approval Letters", link: "/approval" },
          ],
        },
        { title: "Approval Letters", link: "/approval1" },
        { title: "Audited Statement", link: "/auditedStatements" },
        { title: "Finance Committee Meeting Minutes", link: "/meeting" },
        { title: "Undertaking To UGC", link: "https://nec.edu.in/wp-content/uploads/2024/01/undertaking-certificate.pdf" },
        { title: "NEC Institutional & HR Manual", link: "https://nec.edu.in/wp-content/uploads/2024/04/6.2.2.HR-Manual.pdf" },
      ],
    },
    {
      title: "Academics",
      submenu: [
        { title: "About", link: "/academicdeansection" },
        { title: "Governing Council", link: "/governing-concil" },
        { title: "Academic Council", link: "/academiccouncil" },
        { title: "Courses Offered", link: "#" },
        { title: "Academic Calendar", link: "/AcademicCalender" },
        { title: "UG/PG Regulations", link: "/regulationlist" },
        { title: "Curriculum And Syllabus", link: "#" },
        { title: "R-2023 Curriculum Design Framework", link: "https://nec.edu.in/Portal%20Book/flipbook/index.html" },
      ],
    },
    {
      title: "CoE",
      submenu: [
        { title: "About", link: "#" },
        { title: "Circular", link: "https://nec.edu.in/wp-content/uploads/2024/11/Circular-II-Year-Exam-fees-Apr.2024.pdf" },
        {
          title: "Exams ›",
          link: "#",
          submenu: [
            { title: "Instructions", link: "#" },
            { title: "Examination Rules", link: "#" },
            { title: "Time Table", link: "#" },
            { title: "Hall Seating Arrangements", link: "#" },
            { title: "Autonomous Rank Holders", link: "#" },
          ],
        },
        { title: "Results", link: "/result" },
        { title: "Services", link: "#",
          submenu: [
            { title: "Status Of Provisional/Degree Certificates", link: "#" },
            { title: "Transcript", link: "#" },
            { title: "Duplicate Grade Sheet / Consolidated Grade Sheet", link: "#" }],
        },
        { title: "Downloads", link: "#" },
      ],
    },
    {
      title: "Departments",
      submenu: [
        {
          title: "Mechanical Engineering", 
          link: "/mech-dept"
        },
        {
          title: "Computer Science Engineering",
          link: "/cse-dept"
        },        
        {
          title: "Electronics and Communication Engineering",
          submenu: [
            { title: "Home", link: "#" },
            { title: "Faculty", link: "#" },
            { title: "Laboratories", link: "#" },
            { title: "Research Activities", link: "#" },
            { title: "Student Achievements", link: "#" },
            { title: "ECE Dept. Placement Details", link: "#" },
            { title: "ECE Association", link: "#" },
            { title: "Gallery", link: "#" },
          ],
        },
        {
          title: "Electrical and Electronics Engineering",
          submenu: [
            { title: "Home", link: "#" },
            { title: "Faculty", link: "#" },
            { title: "EEE Facilities", link: "#" },
            { title: "Research", link: "#" },
            { title: "Placement-Details", link: "#" },
            { title: "Patents", link: "#" },
            { title: "Innovative Teaching and Learning Process", link: "#" },
            { title: "Events", link: "#" },
            { title: "Student Achievements", link: "#" },
            { title: "Mini Project Forum", link: "#" },
            { title: "Special Interest Group", link: "#" },
            { title: "News Letter", link: "#" },
            { title: "Social Awareness Cell", link: "#" },
            { title: "MOU", link: "#" },
            { title: "EEE Association", link: "#" },
          ],
        },        
        {
          title: "Civil Engineering",
          link: "/civil-dept"
        },        
        {
          title: "Information Technology",
          link: "/it-dept"
        },        
        {
          title: "Artificial Intelligence and Data Science",
          submenu: [
            { title: "Home", link: "#" },
            { title: "Faculty", link: "#" },
            { title: "Course Details", link: "#" },
            { title: "Laboratories", link: "#" },
            { title: "Students' Achievements", link: "#" },
            { title: "Research", link: "#" },
            { title: "Faculty Interactions", link: "#" },
            { title: "Salient Features", link: "#" },
            { title: "AI & DS Association", link: "#" },
          ],
        },        
        {
          title: "Science & Humanities",
          submenu: [
            { title: "Home", link: "#" },
            { title: "Faculty", link: "#" },
            { title: "Activities", link: "#" },
            { title: "Induction Programme and Bridge Course", link: "#" },
            { title: "Funded Projects", link: "#" },
            { title: "Research Facilities", link: "#" },
            { title: "Student Achievements", link: "#" },
            { title: "Facilities", link: "#" },
            { title: "S & H Association", link: "#" },
            { title: "Newsletter", link: "#" },
            { title: "Gallery", link: "#" },
            { title: "Research", link: "#" },
            { title: "Placement", link: "#" },
          ],
        },        
      ],
    },
    {
      title: "Research",
      submenu: [
        { title: "About", link: "/research-about" },
        { title: "Research Advisory Board", link: "#" },
        { title: "Research Policy", link: "#" },
        { title: "Research Newsletter", link: "#" },
        { title: "Academic Research", link: "#" },
        { title: "Sponsored Research", link: "#" },
        { title: "Journal Publications", link: "#" },
        { title: "Research Statistics", link: "#" },
        { title: "Patent Details", link: "#" },
        { title: "IRINS Portal", link: "#" },
        { title: "Contact", link: "#" },
      ],
    },
    {
      title: "Placement",
      link: "/placement"
    },
    {
      title: "IQAC",
      submenu: [
        { title: "About", link: "#" },
        { title: "National Board of Accreditation (NBA)", link: "#" },
        { title: "National Institutional Ranking Framework (NIRF)", link: "#" },
        { title: "NAAC Grade Sheet", link: "#" },
        {
          title:
            "Atal Ranking of Institutions On Innovation Achievements (ARIIA)",
          link: "#",
        },
        { title: "IIQA", link: "#" },
        { title: "SSR", link: "#" },
        { title: "DVV Clarification", link: "#" },
        { title: "IQAC Meeting Minutes", link: "#" },
        { title: "AQAR Reports", link: "#" },
        { title: "AQAR 2023 – 2024", link: "#" },
        { title: "Strategic Planning and Quality Assurance Centre", link: "#" },
      ],
    },
    {
      title: "SA & IR",
      submenu: [
        { title: "About", link: "/sa&ir" },
        { title: "Industries Inside Campus", link: "#" },
        { title: "Chapters", link: "#" },
        { title: "Clubs", link: "#" },
      ],
    },
    {
      title: "Innovation",
      submenu: [
        { title: "About", link: "#" },
        { title: "Green Energy", link: "/green-energy" },
        { title: "ED Cell Staff", link: "#" },
        { title: "NEC – Business Incubator", link: "#" },
        { title: "KR Innovation Centre", link: "#" },
        { title: "Newgen IEDC Portal", link: "#" },
      ],
    },
    {
      title: "Facilities",
      submenu: [
        { title: "Library", link: "#" },
        { title: "Amenities", link: "#" },
        { title: "Sports and Games", link: "#" },
        { title: "Lakshmi Ammal Sports Academy(LASA)", link: "#" },
        { title: "Voice of NEC", link: "#" },
      ],
    },
    {
      title: "Students",
      submenu: [
        { title: "LMS", link: "https://lms.nec.edu.in/login/index.php" },
        { title: "Fee Payment", link: "/fees-payment" },
        { title: "OPAC", link: "https://erp.nec.edu.in/opac/" },
        { title: "Results", link: "/result" },
        { title: "Student Login", link: "/records/login" },
      ],
    },
    {
      title: "Alumni",
      submenu: [
        { title: "Alumni Official Website", link: "https://alumni.nec.edu.in/" },
      ],
    },
    { title: "NIRF", link: "#" },
  ];

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      setActiveSubmenu(null);
      setActiveNestedSubmenu(null);
    }
  };

  const toggleSubmenu = (index: number): void => {
    if (activeSubmenu === index) {
      setActiveSubmenu(null);
      setActiveNestedSubmenu(null);
    } else {
      setActiveSubmenu(index);
      setActiveNestedSubmenu(null);
    }
  };

  const toggleNestedSubmenu = (index: number): void => {
    if (activeNestedSubmenu === index) {
      setActiveNestedSubmenu(null);
    } else {
      setActiveNestedSubmenu(index);
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const nav = document.querySelector('nav');
      const mobileMenuButton = document.querySelector('.mobile-menu-button');
      
      if (isMobileMenuOpen && 
          nav && !nav.contains(event.target as Node) && 
          mobileMenuButton && !mobileMenuButton.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
        setActiveSubmenu(null);
        setActiveNestedSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="relative w-full z-50 p-0 m-0">
      {/* Top help desk section */}
      <div className="absolute top-0 left-0 w-full flex justify-end px-4">
        <a
          href="#"
          className="flex items-center space-x-2 text-green-600 font-semibold text-lg"
        >
          <img
            src="https://nec.edu.in/wp-content/uploads/2025/03/helpdesk30x30.png"
            alt="Help Desk"
            className="h-8 w-8"
          />
          <span>Help Desk</span>
        </a>
      </div>

      {/* Logo and social media section */}
      <div className="top-bar">
        <div className="max-w-[1300px] mx-auto py-2 px-6">
          {/* Left: Logo Only */}
          <div className="logo-section">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqOR0sIBcRIh0vArID_erhTyKRvZUEby4t5w&s"
              alt="NEC Logo"
              className="h-20 object-contain"
            />
          </div>

          {/* Center: Animated College Motto */}
          <div className="center-actions">
            <div className="motto-container">
              <h2 className="college-motto">
                <span className="motto-letter">அ</span>
                <span className="motto-letter">றி</span>
                <span className="motto-letter">வே</span>
                <span className="motto-space"> </span>
                <span className="motto-letter">ஆ</span>
                <span className="motto-letter">க்</span>
                <span className="motto-letter">க</span>
                <span className="motto-letter">ம்</span>
              </h2>
              {/* <h3 className="motto-translation" style={{ textAlign: "center" }}>Knowledge is Wealth</h3> */}
            </div>
          </div>

          {/* Right: TNEA Badge and Social Icons */}
          <div className="right-actions">
            {/* TNEA Counselling Code Badge */}
            <div className="tnea-badge">
              <div className="tnea-badge-header">
                <span>TNEA</span>
                <span className="tnea-badge-subtitle">COUNSELLING CODE</span>
              </div>
              <div className="tnea-badge-code">4962</div>
            </div>

            {/* Social Icons */}
            <div className="social-icons-row">
              {[
                {
                  href: "https://www.linkedin.com/school/national-engineering-college",
                  src: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
                  alt: "LinkedIn",
                },
                {
                  href: "https://www.facebook.com/necofficial",
                  src: "https://cdn-icons-png.flaticon.com/512/145/145802.png",
                  alt: "Facebook",
                },
                {
                  href: "https://www.instagram.com/necofficial/",
                  src: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png",
                  alt: "Instagram",
                },
                {
                  href: "https://www.youtube.com/@necofficial",
                  src: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",
                  alt: "YouTube",
                },
                {
                  href: "https://twitter.com/necofficial",
                  src: "https://cdn-icons-png.flaticon.com/512/5968/5968958.png",
                  alt: "Twitter",
                },
              ].map((icon, i) => (
                <a key={i} href={icon.href} target="_blank" rel="noreferrer">
                  <img
                    src={icon.src}
                    alt={icon.alt}
                    className="h-6 w-6 hover:scale-110 transition"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative w-full bg-[#003087] text-white z-50">
        <div className="max-w-[1300px] mx-auto flex justify-between items-center px-4 py-3">
          {/* Mobile menu button */}
          <button
            className="mobile-menu-button md:hidden text-white focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex justify-center space-x-6">
            {navItems.map((item, idx) => (
              <div key={idx} className="relative group">
                <a
                  href={item.link || "#"}
                  className="text-sm font-semibold group-hover:text-white relative"
                >
                  {item.title}
                  <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-6"></span>
                </a>

                {item.submenu && (
                  <div className="absolute top-full left-0 bg-white text-black rounded-md shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 group-hover:translate-y-1 transition-all duration-300 z-50 w-64">
                    {item.submenu.map((subItem, subIdx) => (
                      <div key={subIdx} className="relative group/sub">
                        <a
                          href={subItem.link || "#"}
                          className="block px-4 py-2 text-sm font-medium hover:bg-gradient-to-r from-[#0b104b] to-[#237ccf] hover:text-white transition duration-300 flex justify-between items-center relative"
                        >
                          {subItem.title}
                          {subItem.submenu && <span className="ml-2">›</span>}
                          <span className="absolute left-4 bottom-1 w-0 h-[2px] bg-white transition-all duration-300 ease-in-out group-hover/sub:w-6"></span>
                        </a>

                        {subItem.submenu && (
                          <div className="absolute top-0 left-full bg-white text-black rounded-md shadow-lg opacity-0 invisible group-hover/sub:visible group-hover/sub:opacity-100 transition-all duration-300 z-50 w-64 ml-1">
                            {subItem.submenu.map((nestedItem, nestedIdx) => (
                              <a
                                key={nestedIdx}
                                href={nestedItem.link}
                                className="block px-4 py-2 text-sm font-medium hover:bg-gradient-to-r from-[#0b104b] to-[#237ccf] hover:text-white transition duration-300"
                              >
                                {nestedItem.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden bg-[#003087] w-full transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-screen py-4' : 'max-h-0 overflow-hidden'
          }`}
        >
          <div className="px-4">
            {navItems.map((item, idx) => (
              <div key={idx} className="mb-2 border-b border-white/10 pb-2">
                <div className="flex justify-between items-center">
                  {item.submenu ? (
                    <button
                      onClick={() => toggleSubmenu(idx)}
                      className="text-sm font-semibold py-2 block flex-1 text-left text-white"
                    >
                      {item.title}
                    </button>
                  ) : (
                    <a
                      href={item.link || "#"}
                      className="text-sm font-semibold py-2 block flex-1 text-white"
                    >
                      {item.title}
                    </a>
                  )}
                  
                  {item.submenu && (
                    <button
                      onClick={() => toggleSubmenu(idx)}
                      className="text-white p-2 focus:outline-none"
                    >
                      <svg
                        className="w-4 h-4 transition-transform duration-200"
                        style={{
                          transform: activeSubmenu === idx ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {item.submenu && activeSubmenu === idx && (
                  <div className="ml-4 mt-1 animate-slideDown">
                    {item.submenu.map((subItem, subIdx) => (
                      <div key={subIdx} className="mb-2">
                        <div className="flex justify-between items-center">
                          {subItem.submenu ? (
                            <button
                              onClick={() => toggleNestedSubmenu(subIdx)}
                              className="text-sm font-medium py-1 block flex-1 text-left text-white/90"
                            >
                              {subItem.title.replace(' ›', '')}
                            </button>
                          ) : (
                            <a
                              href={subItem.link || "#"}
                              className="text-sm font-medium py-1 block flex-1 text-white/90"
                            >
                              {subItem.title}
                            </a>
                          )}
                          
                          {subItem.submenu && (
                            <button
                              onClick={() => toggleNestedSubmenu(subIdx)}
                              className="text-white p-2 focus:outline-none"
                            >
                              <svg
                                className="w-4 h-4 transition-transform duration-200"
                                style={{
                                  transform: activeNestedSubmenu === subIdx ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          )}
                        </div>

                        {subItem.submenu && activeNestedSubmenu === subIdx && (
                          <div className="ml-4 mt-1 animate-slideDown">
                            {subItem.submenu.map((nestedItem, nestedIdx) => (
                              <a
                                key={nestedIdx}
                                href={nestedItem.link || "#"}
                                className="text-sm font-medium py-1 block text-white/80"
                              >
                                {nestedItem.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;