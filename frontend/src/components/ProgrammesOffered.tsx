import React, { useState } from 'react';
import { GraduationCap, School } from 'lucide-react';

const ProgrammesOffered = () => {
  const [activeTab, setActiveTab] = useState('ug');

  const ugProgrammes = [
    { id: 1, course: 'B.E. - Mechanical Engineering', intake: 60, established: 1984 },
    { id: 2, course: 'B.E. - Electronics and Communication Engineering', intake: 120, established: 1984 },
    { id: 3, course: 'B.E. - Computer Science and Engineering', intake: 120, established: 1984 },
    { id: 4, course: 'B.E. - Electrical and Electronics Engineering', intake: 60, established: 1994 },
    { id: 5, course: 'B.Tech - Information Technology', intake: 60, established: 2001 },
    { id: 6, course: 'B.E. - Civil Engineering', intake: 60, established: 2012 },
    { id: 7, course: 'B.Tech. - Artificial Intelligence and Data Science', intake: 60, established: 2022 },
  ];

  const pgProgrammes = [
    { id: 1, course: 'M.E. - Computer Science and Engineering', intake: 25, established: 2001 },
    { id: 2, course: 'M.E. - Energy Engineering', intake: 18, established: 2004 },
    { id: 3, course: 'M.E. - High Voltage Engineering', intake: 18, established: 2005 },
    { id: 4, course: 'M.E. - Embedded Systems Technologies', intake: 18, established: 2012 },
    { id: 5, course: 'M.TECH - Information Technology\n(Information & Cyber Warfare)', intake: 18, established: 2017 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Programmes Offered</h1>
          <p className="text-lg text-gray-600">Explore our diverse range of academic programmes</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('ug')}
              className={`flex items-center space-x-2 px-8 py-4 font-semibold text-lg transition-colors duration-300 ${
                activeTab === 'ug'
                  ? 'text-[#003087] border-b-2 border-[#003087] bg-blue-50'
                  : 'text-gray-500 hover:text-[#003087]'
              }`}
            >
              <GraduationCap className="h-5 w-5" />
              <span>UG Programmes</span>
            </button>
            <button
              onClick={() => setActiveTab('pg')}
              className={`flex items-center space-x-2 px-8 py-4 font-semibold text-lg transition-colors duration-300 ${
                activeTab === 'pg'
                  ? 'text-[#003087] border-b-2 border-[#003087] bg-blue-50'
                  : 'text-gray-500 hover:text-[#003087]'
              }`}
            >
              <School className="h-5 w-5" />
              <span>PG Programmes</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">S.No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Courses</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Current Intake</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Year Established</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(activeTab === 'ug' ? ugProgrammes : pgProgrammes).map((program) => (
                  <tr
                    key={program.id}
                    className="hover:bg-blue-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {String(program.id).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{program.course}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{program.intake}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{program.established}</td>
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

export default ProgrammesOffered;