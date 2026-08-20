import React from 'react';
import { Search } from 'lucide-react';
import { degrees, branchMap, degreeBranches } from './branchMap';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  const branches = searchQuery.degree 
    ? degreeBranches[searchQuery.degree] || []
    : Object.keys(branchMap);

  const maxSemesters = ['ME', 'MTech'].includes(searchQuery.degree) ? 4 : 8;
  const semestersArray = Array.from({ length: maxSemesters }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center gap-4 mb-4">
        <Search className="w-5 h-5 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-800">Find Semesters</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Batch Year</label>
          <input
            type="text"
            placeholder="e.g., 2023"
            value={searchQuery.batch}
            onChange={(e) => setSearchQuery({ ...searchQuery, batch: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
          <select
            value={searchQuery.degree}
            onChange={(e) => {
              const nextDegree = e.target.value;
              let nextBranch = searchQuery.branch;
              let nextSemester = searchQuery.semesterNumber;
              
              if (nextDegree) {
                const validBranches = degreeBranches[nextDegree] || [];
                if (!validBranches.includes(nextBranch)) {
                  nextBranch = '';
                }
                const maxSems = ['ME', 'MTech'].includes(nextDegree) ? 4 : 8;
                if (Number(nextSemester) > maxSems) {
                  nextSemester = '';
                }
              }
              setSearchQuery({ 
                ...searchQuery, 
                degree: nextDegree, 
                branch: nextBranch, 
                semesterNumber: nextSemester 
              });
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Degrees</option>
            {degrees.map((deg) => (
              <option key={deg} value={deg}>{deg}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <select
            value={searchQuery.branch}
            onChange={(e) => setSearchQuery({ ...searchQuery, branch: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Branches</option>
            {branches.map((code) => (
              <option key={code} value={code}>{branchMap[code]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
          <select
            value={searchQuery.semesterNumber}
            onChange={(e) => setSearchQuery({ ...searchQuery, semesterNumber: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Semesters</option>
            {semestersArray.map((sem) => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;