import React, { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaCheck, FaTimes, FaUserTie } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import config from '../../../config';

const TutorAllocation = () => {
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('unassigned'); // Default to unassigned
  const [filterTutor, setFilterTutor] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  
  // Allocation
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const api = axios.create({
    baseURL: `${config.backendUrl}/api`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, filterStatus, filterTutor, filterBatch, filterSemester]);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/admin/tutor-allocation/staff');
      if (response.data.success) {
        setStaffList(response.data.staff);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff list');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterTutor) params.tutorId = filterTutor;
      if (filterBatch) params.batch = filterBatch;
      if (filterSemester) params.semester = filterSemester;

      const response = await api.get('/admin/tutor-allocation/students', { params });
      
      if (response.data.success) {
        setStudents(response.data.students);
        
        // If a specific staff is selected for assignment, pre-check their students
        if (selectedStaffToAssign) {
          const preChecked = response.data.students
            .filter(s => s.staffId === parseInt(selectedStaffToAssign))
            .map(s => s.studentId);
          setSelectedStudentIds(preChecked);
        } else {
          setSelectedStudentIds([]);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSelectionForAssign = (e) => {
    const staffId = e.target.value;
    setSelectedStaffToAssign(staffId);
    
    // Auto check students already assigned to this staff within the current list
    if (staffId) {
      const preChecked = students
        .filter(s => s.staffId === parseInt(staffId))
        .map(s => s.studentId);
      setSelectedStudentIds(preChecked);
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleCheckboxChange = (studentId) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleAssignTutor = async () => {
    if (!selectedStaffToAssign) {
      toast.error('Please select a staff member to assign to.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/admin/tutor-allocation/assign', {
        studentIds: selectedStudentIds,
        tutorId: selectedStaffToAssign
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedStaffToAssign('');
        fetchStudents(); // Refresh the list
      }
    } catch (error) {
      console.error('Error assigning tutor:', error);
      toast.error(error.response?.data?.message || 'Failed to assign tutor');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignTutor = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student to unassign.');
      return;
    }

    if (!window.confirm('Are you sure you want to remove the tutor for selected students?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/admin/tutor-allocation/assign', {
        studentIds: selectedStudentIds,
        tutorId: null // Sending null unassigns
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchStudents();
      }
    } catch (error) {
      console.error('Error unassigning tutor:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign tutor');
    } finally {
      setLoading(false);
    }
  };

  // Pagination related
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(students.length / itemsPerPage);
  const currentStudents = students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === currentStudents.length) {
      setSelectedStudentIds(selectedStudentIds.filter(id => !currentStudents.some(s => s.studentId === id)));
    } else {
      const newIds = new Set([...selectedStudentIds, ...currentStudents.map(s => s.studentId)]);
      setSelectedStudentIds(Array.from(newIds));
    }
  };

  const allVisibleSelected = currentStudents.length > 0 && currentStudents.every(s => selectedStudentIds.includes(s.studentId));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Assign Student to Tutor</h1>
        <p className="text-gray-600">Allocate students to staff members as their tutors</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        
        {/* Action Bar */}
        <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-md font-semibold text-indigo-900 flex items-center shrink-0">
            <FaUserTie className="mr-2" /> Assign Selected Students To:
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 justify-end">
            <select
              value={selectedStaffToAssign}
              onChange={handleStaffSelectionForAssign}
              className="w-full sm:w-auto px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white min-w-[250px]"
            >
              <option value="">-- Select Staff Tutor --</option>
              {staffList.map((staff) => (
                <option key={staff.userId} value={staff.userId}>
                  {staff.userName} ({staff.userNumber})
                </option>
              ))}
            </select>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleAssignTutor}
                disabled={loading || selectedStudentIds.length === 0 || !selectedStaffToAssign}
                className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm font-semibold whitespace-nowrap"
              >
                <FaCheck className="mr-1" /> Assign ({selectedStudentIds.length})
              </button>
              <button
                onClick={handleUnassignTutor}
                disabled={loading || selectedStudentIds.length === 0}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center text-sm font-semibold whitespace-nowrap"
                title="Remove tutor from selected"
              >
                <FaTimes className="mr-1" /> Unassign
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <FaSearch className="mr-2 text-indigo-500" /> Filter Options
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Reg No/Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Students</option>
              <option value="unassigned">Unassigned Only</option>
              <option value="assigned">Assigned Only</option>
            </select>

            <select
              value={filterTutor}
              onChange={(e) => setFilterTutor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Filter by Tutor</option>
              {staffList.map((staff) => (
                <option key={staff.userId} value={staff.userId}>
                  {staff.userName} - {staff.userNumber}
                </option>
              ))}
            </select>
            
            <input
              type="number"
              placeholder="Batch Year"
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && students.length === 0 ? (
          <div className="flex justify-center flex-col items-center h-64 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p>Loading students...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reg Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Dept
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Batch/Sem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Current Tutor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No students found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    currentStudents.map((student) => (
                      <tr 
                        key={student.studentId} 
                        className={`hover:bg-indigo-50/30 transition-colors ${selectedStudentIds.includes(student.studentId) ? 'bg-indigo-50/50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.studentId)}
                            onChange={() => handleCheckboxChange(student.studentId)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.registerNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {student.studentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                            {student.departmentAcronym}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.batch || '-'} / {student.semester || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {student.tutorAssigned ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              {student.tutorName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              Unassigned
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination block */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, students.length)}</span> of{' '}
                    <span className="font-medium">{students.length}</span> students
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-50 text-sm font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-50 text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TutorAllocation;
