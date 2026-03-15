import React from 'react';
import { Book, Users, Calendar, GraduationCap, Globe, FlaskConical } from 'lucide-react';

const QuickLinks = () => {
  const links = [
    { icon: Book, title: 'Academics', description: 'Explore our programs' },
    { icon: Users, title: 'Admissions', description: 'Join our community' },
    { icon: Calendar, title: 'Events', description: 'What\'s happening' },
    { icon: GraduationCap, title: 'Research', description: 'Discover innovation' },
    { icon: Globe, title: 'Global', description: 'International programs' },
    { icon: FlaskConical, title: 'Labs', description: 'Research facilities' },
  ];

  return (
    <div className="bg-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {links.map((link, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300"
            >
              <div className="flex items-center space-x-4">
                <link.icon className="h-8 w-8 text-[#003087]" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{link.title}</h3>
                  <p className="text-gray-600">{link.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickLinks;