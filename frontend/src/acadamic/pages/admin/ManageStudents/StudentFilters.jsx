import React from 'react';
import { Search } from 'lucide-react';
import { branchMap, degreeBranches } from '../ManageSemesters/branchMap.js';

const StudentFilters = ({ filters, setFilters, searchTerm, setSearchTerm, degrees, branches, semesters, batches, searchInputRef }) => {
  const filteredBranches = filters.degree
    ? (degreeBranches[filters.degree] || []).filter(b => branches.includes(b))
    : branches;

  const filteredSemesters = ['ME', 'MTech'].includes(filters.degree)
    ? semesters.filter((sem) => {
        const semNum = parseInt(String(sem).replace(/\D/g, ''), 10);
        return semNum >= 1 && semNum <= 4;
      })
    : semesters;

  const filteredBatches = filters.degree
    ? batches.filter((b) => b.degree === filters.degree)
    : batches;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            name="student-search"
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => {
              const newValue = e.target.value.trim();
              console.log('Search term updated:', newValue);
              setSearchTerm(newValue);
            }}
            ref={searchInputRef}
            autoComplete="new-search"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filters.batch}
          onChange={(e) => {
            console.log('Batch filter changed:', e.target.value);
            setFilters({ ...filters, batch: e.target.value });
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Batches</option>
          {filteredBatches.map((batch) => (
            <option key={batch.batchId} value={batch.batch}>
              {`${batch.batch} (${batch.batchYears})`}
            </option>
          ))}
        </select>
        <select
          value={filters.degree}
          onChange={(e) => {
            const nextDegree = e.target.value;
            let nextSemester = filters.semester;
            if (['ME', 'MTech'].includes(nextDegree)) {
              const semNum = parseInt(String(nextSemester).replace(/\D/g, ''), 10);
              if (semNum > 4) {
                nextSemester = '';
              }
            }
            console.log('Degree filter changed:', nextDegree);
            setFilters({ ...filters, degree: nextDegree, branch: '', semester: nextSemester, batch: '' });
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Degrees</option>
          {degrees.map((deg) => (
            <option key={deg} value={deg}>
              {deg}
            </option>
          ))}
        </select>
        <select
          value={filters.branch}
          onChange={(e) => {
            console.log('Branch filter changed:', e.target.value);
            setFilters({ ...filters, branch: e.target.value, batch: '' });
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Branches</option>
          {filteredBranches.map((branch) => (
            <option key={branch} value={branch}>
              {branchMap[branch] || branch}
            </option>
          ))}
        </select>
        <select
          value={filters.semester}
          onChange={(e) => {
            console.log('Semester filter changed:', e.target.value);
            setFilters({ ...filters, semester: e.target.value });
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Semesters</option>
          {filteredSemesters.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default StudentFilters;