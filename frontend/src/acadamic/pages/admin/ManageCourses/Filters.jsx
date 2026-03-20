import React from 'react';
import { Search } from 'lucide-react';

const Filters = ({ filters, setFilters, semesters, courseTypes, departments }) => {
  const deptOptions = Array.isArray(departments) && departments.length > 0
    ? departments.map((dept) => {
        const deptId =
          dept?.departmentIdept?.id ??
          dept?.departmentId ??
          dept?.id ??
          dept?.department_id ??
          '';
        const deptName =
          dept?.departmentName ??
          dept?.Deptname ??
          dept?.deptName ??
          'Department';
        const deptAcr =
          dept?.departmentAcr ??
          dept?.deptAcr ??
          dept?.deptCodept?.Deptacronym ??
          dept?.Deptacronym ??
          '';
        return {
          value: deptId ? String(deptId) : '',
          label: `${deptName}${deptAcr ? ` (${deptAcr})` : ''}`
        };
      }).filter(d => d.value)
    : [...new Set((semesters || [])
        .map(s => s.branch ?? s.Batch?.branch)
        .filter(Boolean)
      )].map(branch => ({ value: branch, label: branch }));

  const batchOptions = [...new Set((semesters || [])
    .map(s => s.batch ?? s.Batch?.batch)
    .filter(Boolean)
  )].sort();

  const semesterOptions = [...new Set((semesters || [])
    .map(s => s.semesterNumber)
    .filter(Boolean)
  )].sort((a, b) => a - b);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex flex-wrap gap-4 items-end justify-center">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            value={filters.dept}
            onChange={(e) => setFilters({ ...filters, dept: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {deptOptions.map((dept) => (
              <option key={dept.value} value={dept.value}>{dept.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select
            value={filters.semester}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {semesterOptions.map(num => (
              <option key={num} value={num}>Semester {num}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
          <select
            value={filters.batch}
            onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Batches</option>
            {batchOptions.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {(Array.isArray(courseTypes) ? courseTypes : []).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setFilters({ dept: '', semester: '', batch: '', name: '', type: '' })}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
        >
          <Search size={16} />
          Clear
        </button>
      </div>
    </div>
  );
};

export default Filters;
