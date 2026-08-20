import React from 'react';
import { Building2, Users, TrendingUp, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlacementHighlights = () => {
  const placementData = [
    {
      name: "Arun Kumar",
      company: "Microsoft",
      package: "44 LPA",
      role: "Software Engineer",
      batch: "2024",
    },
    {
      name: "Priya Sharma",
      company: "Amazon",
      package: "38 LPA",
      role: "SDE II",
      batch: "2024",
    },
    {
      name: "Karthik Raja",
      company: "Google",
      package: "42 LPA",
      role: "Product Engineer",
      batch: "2024",
    },
    {
      name: "Deepa Lakshmi",
      company: "Oracle",
      package: "32 LPA",
      role: "Systems Engineer",
      batch: "2024",
    },
    {
      name: "Mohammed Siddiq",
      company: "Adobe",
      package: "35 LPA",
      role: "Frontend Engineer",
      batch: "2024",
    },
    {
      name: "Kavitha Senthil",
      company: "Salesforce",
      package: "36 LPA",
      role: "Cloud Engineer",
      batch: "2024",
    }
  ];

  const navigate = useNavigate();

  const stats = [
    {
      icon: Building2,
      value: "180+",
      label: "Companies Visited",
      onClick: () => navigate('/companies-visited')
    },
    {
      icon: Users,
      value: "92%",
      label: "Placement Rate"
    },
    {
      icon: TrendingUp,
      value: "44 LPA",
      label: "Highest Package"
    },
    {
      icon: Award,
      value: "12 LPA",
      label: "Average Package"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Placement Highlights</h1>
          <p className="text-lg text-gray-600">Class of 2024</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md transform hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={stat.onClick}
            >
              <div className="flex items-center justify-center mb-4">
                <stat.icon className="h-8 w-8 text-[#003087]" />
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Placement Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-[#003087] text-white">
            <h2 className="text-xl font-semibold">Student Placements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Package</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Batch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {placementData.map((student, index) => (
                  <tr 
                    key={index}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{student.company}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.role}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-medium">{student.package}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.batch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementHighlights;
