import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();

  const academicsMenu = [
    { title: 'Overview', link: '#' },
    { title: 'Academic Regulations', link: '#' },
    { title: 'Academic Council', link: '#' },
    { title: 'FFCS', link: '#' },
    { title: 'Library', link: '#' },
    { title: 'Schools', link: '#' },
    { title: 'Online Learning Institute', link: '#' },
    { title: 'Feedback', link: '#' }
  ];

  const admissionsMenu = [
    { title: 'Overview', link: '#' },
    { title: 'Programmes Offered', link: '/programmes-offered' },
    { title: 'Undergraduate', link: '#' },
    { title: 'Postgraduate', link: '#' },
    { title: 'International', link: '#' },
    { title: 'STARS', link: '#' }
  ];

  const cdcMenu = [
    { title: 'Overview', link: '/cdc/overview' },
    { title: 'Placement Highlights', link: '/placement-highlights' },
    { title: 'Placement Tracker', link: '#' },
    { title: 'CDC Office', link: '#' },
    { title: 'Contact Us', link: '#' }
  ];

  const feeStructureMenu = [
    { title: 'Undergraduate', link: '#' },
    { title: 'Postgraduate', link: '#' }
  ];

  const researchMenu = [
    { title: 'Research-About', link: '/research-about' },
    { title: 'Green Energy', link: '#' },
    { title: 'ED Cell', link: '#' },
    { title: 'NEC - Business Incubator', link: '#' },
    { title: 'KR Innovation Centre', link: '#' },
    { title: 'IEDC', link: '#' },
    { title: 'Newgen IEDC Portal', link: '#' }
  ];

  const navItems = [
    { title: 'About', hasDropdown: false, link: '/about' },
    { title: 'Academics', hasDropdown: true, menu: academicsMenu },
    { title: 'Admissions', hasDropdown: true, menu: admissionsMenu },
    { title: 'CDC', hasDropdown: true, menu: cdcMenu },
    { title: 'Fee Structure', hasDropdown: true, menu: feeStructureMenu },
    { title: 'Research', hasDropdown: true, menu: researchMenu },
    { title: 'Campus Life', hasDropdown: true },
  ];

  const handleDropdown = (title: string) => {
    if (activeDropdown === title) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(title);
    }
  };

  const handleMenuItemClick = (link: string) => {
    document.body.classList.add('fade-out');
    setTimeout(() => {
      if (link.startsWith('/')) {
        navigate(link);
        setActiveDropdown(null);
        setIsOpen(false);
      }
      document.body.classList.remove('fade-out');
    }, 300);
  };

  return (
    <nav className="bg-[#003087] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-24">
          <Link to="/" className="flex items-center space-x-4">
            <img 
              src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fgyaanarth.com%2Fwp-content%2Fuploads%2F2022%2F06%2Flogo-dark-2a.png&f=1&nofb=1&ipt=702fb9e323ef51f7cf2c5b35c5e7847362c0f2462c85517fdfc0604eca08bc2d&ipo=images"
              alt="College Logo"
              className="h-12 w-auto"
            />
            <div className="text-lg py-4">
              <h1 className="font-semibold">National Engineering College</h1>
              <p className="text-sm text-gray-200">Kovilpatti</p>
            </div>
          </Link>

          <div className="hidden md:flex space-x-4">
            {navItems.map((item) => (
              <div key={item.title} className="relative group">
                {item.hasDropdown ? (
                  <button 
                    className="nav-button px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1a4b8c] flex items-center"
                    onClick={() => handleDropdown(item.title)}
                  >
                    {item.title}
                    <ChevronDown className={`ml-1 h-4 w-4 transform transition-transform duration-300 ${
                      activeDropdown === item.title ? 'rotate-180' : ''
                    }`} />
                  </button>
                ) : (
                  <button 
                    className="nav-button px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1a4b8c]"
                    onClick={() => handleMenuItemClick(item.link || '#')}
                  >
                    {item.title}
                  </button>
                )}
                {item.menu && activeDropdown === item.title && (
                  <div className="dropdown-menu absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    {item.menu.map((menuItem, index) => (
                      <button
                        key={menuItem.title}
                        onClick={() => handleMenuItemClick(menuItem.link)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: 'slideIn 0.3s ease-out forwards',
                        }}
                      >
                        {menuItem.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
                <Link to="/records/login" className="nav-button px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1a4b8c]">
                  Login
                </Link>

          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-[#1a4b8c] transition-colors duration-300"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          {navItems.map((item) => (
            <div key={item.title}>
              {item.hasDropdown ? (
                <>
                  <button
                    onClick={() => handleDropdown(item.title)}
                    className="w-full flex justify-between items-center px-3 py-2 text-base font-medium hover:bg-[#1a4b8c] transition-colors duration-300"
                  >
                    {item.title}
                    <ChevronDown className={`h-4 w-4 transform transition-transform duration-300 ${
                      activeDropdown === item.title ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {item.menu && activeDropdown === item.title && (
                    <div className="bg-[#1a4b8c] px-4">
                      {item.menu.map((menuItem) => (
                        <button
                          key={menuItem.title}
                          onClick={() => handleMenuItemClick(menuItem.link)}
                          className="block w-full text-left py-2 text-sm text-gray-200 hover:text-white transition-all duration-300 hover:pl-6"
                        >
                          {menuItem.title}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleMenuItemClick(item.link || '#')}
                  className="w-full text-left px-3 py-2 text-base font-medium hover:bg-[#1a4b8c] transition-colors duration-300"
                >
                  {item.title}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
