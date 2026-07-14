import { useState, useMemo } from 'react';

const useManageStaffFilters = (staffList, courses, selectedStaff) => {
  const [filters, setFilters] = useState({ degree: '', dept: '', semester: '', batch: '' });
  const [nameSearch, setNameSearch] = useState('');
  const [sortBy, setSortBy] = useState('staffId');
  const [sortOrder, setSortOrder] = useState('desc');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilters, setCourseFilters] = useState({ degree: '', dept: '', semester: '', batch: '' });

  const getFilteredStaff = () => {
    return staffList
      .filter(staff => {
        const { degree, dept, semester, batch } = filters;
        const matchesName = !nameSearch || staff.name.toLowerCase().includes(nameSearch.toLowerCase());
        const hasMatchingCourse = staff.allocatedCourses.some(course =>
          (!degree || String(course.degree || '').toLowerCase() === degree.toLowerCase()) &&
          (!semester || course.semester === semester) &&
          (!batch || course.year.toLowerCase() === batch.toLowerCase())
        );
        return (
          (!dept || staff.departmentName.toLowerCase() === dept.toLowerCase()) &&
          ((!degree && !semester && !batch) || hasMatchingCourse) &&
          matchesName
        );
      })
      .sort((a, b) => {
        const aVal = sortBy === 'allocatedCourses' ? a.allocatedCourses.length : a[sortBy];
        const bVal = sortBy === 'allocatedCourses' ? b.allocatedCourses.length : b[sortBy];
        return sortOrder === 'desc' ? (aVal < bVal ? 1 : -1) : (aVal < bVal ? -1 : 1);
      });
  };

  const getFilteredCourses = useMemo(() => {
    const allocatedCourseDetails = selectedStaff?.allocatedCourses.map(c => ({
      courseCode: c.courseCode,
      sectionId: c.sectionId,
      batch: c.batch,
    })) || [];
    return courses
      .filter(course => {
        const { degree, dept, semester, batch } = courseFilters;
        return (
          (!degree || String(course.degree || '').toLowerCase() === degree.toLowerCase()) &&
          (!dept || course.department.toLowerCase() === dept.toLowerCase()) &&
          (!semester || course.semester === semester) &&
          (!batch || String(course.batchYears || '').toLowerCase() === batch.toLowerCase()) &&
          (course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
           course.code.toLowerCase().includes(courseSearch.toLowerCase()))
        );
      })
      .map(course => ({
        ...course,
        isAllocated: !!allocatedCourseDetails.find(c => c.courseCode === course.code),
        currentBatch: allocatedCourseDetails.find(c => c.courseCode === course.code)?.batch || null,
      }));
  }, [courses, selectedStaff, courseSearch, courseFilters]);

  const handleSort = (field) => {
    setSortBy(field);
    setSortOrder(sortBy === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
  };

  return {
    filters,
    setFilters,
    nameSearch,
    setNameSearch,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    courseSearch,
    setCourseSearch,
    courseFilters,
    setCourseFilters,
    getFilteredStaff,
    getFilteredCourses,
    handleSort,
  };
};

export default useManageStaffFilters;
