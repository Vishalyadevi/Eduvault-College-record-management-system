import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Search, Users } from 'lucide-react';
import { getAttendanceShortage } from '../../services/staffService';

const AttendanceShortage = () => {
  const { courseId: courseCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const course = location.state?.course ?? { name: courseCode || 'Unknown Course' };
  const compositeSectionIds = location.state?.compositeSectionIds || '';

  const [minPercentage, setMinPercentage] = useState(75);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [nameFilter, setNameFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAttendanceShortage(courseCode, compositeSectionIds, minPercentage);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch attendance shortage list');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseCode, compositeSectionIds, minPercentage]);

  const filteredRows = useMemo(() => {
    if (!nameFilter) return rows;
    const term = nameFilter.toLowerCase();
    return rows.filter(r => (r.name || '').toLowerCase().includes(term) || (r.regno || '').toLowerCase().includes(term));
  }, [rows, nameFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance Shortage</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  {course.name || courseCode}
                  {compositeSectionIds && (
                    <span className="ml-2 text-blue-600 font-medium">
                      (Sections: {compositeSectionIds.split('_').join(' & ')})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Min %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={minPercentage}
                onChange={(e) => setMinPercentage(e.target.value === '' ? 75 : Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or reg no..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Showing <strong>{filteredRows.length}</strong> of <strong>{rows.length}</strong> students
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
            <AlertTriangle className="mx-auto text-amber-400 mb-3" size={36} />
            <p className="text-gray-600">Loading shortage list...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-red-800 text-lg">Something went wrong</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">No Shortage Students</h3>
            <p className="text-gray-500 mt-2">
              All students are at or above {minPercentage}% attendance for this course.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Reg No</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Student Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Section</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Present / Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((row) => (
                    <tr key={`${row.regno}-${row.courseId}-${row.sectionId}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-800">{row.regno}</td>
                      <td className="px-4 py-3 text-gray-800">{row.name}</td>
                      <td className="px-4 py-3 text-gray-700">{row.sectionName || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.courseCode} {row.courseTitle ? `- ${row.courseTitle}` : ''}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {row.presentClasses} / {row.totalClasses}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {row.percentage.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceShortage;
