import { useState, useEffect } from 'react';
import { branchMap } from '../../ManageSemesters/branchMap.js';
import manageStudentsService from '../../../../services/manageStudentService.js';

const useManageStudentsData = (filters) => {
  const [students, setStudents] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [degrees] = useState(['BE', 'BTech', 'ME', 'MTech']);
  const [branches, setBranches] = useState(Object.keys(branchMap));
  const [semesters, setSemesters] = useState([
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8',
  ]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setError(null);
      try {
        const [baseOptions, branchOptions] = await Promise.all([
          manageStudentsService.fetchFilterOptions(''),
          filters.branch ? manageStudentsService.fetchFilterOptions(filters.branch) : Promise.resolve(null),
        ]);
        setBranches(baseOptions?.branches || Object.keys(branchMap));
        setSemesters(baseOptions?.semesters || []);
        setBatches((branchOptions?.batches || baseOptions?.batches) || []);
      } catch (err) {
        console.error('Error fetching filter options:', err);
        setError(err.message || 'Network error: Unable to fetch filter options.');
      }
    };
    fetchFilterOptions();
  }, [filters.branch, reloadToken]);

  useEffect(() => {
    const areRequiredFiltersSelected = filters.branch !== '' && filters.semester !== '' && filters.batch !== '';
    if (!areRequiredFiltersSelected) {
      setStudents([]);
      setAvailableCourses([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { studentsData, coursesData } = await manageStudentsService.fetchStudentsAndCourses(
          filters,
          batches
        );
        setStudents(studentsData || []);
        setAvailableCourses(coursesData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Unable to load data.');
        setStudents([]);
        setAvailableCourses([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters.degree, filters.branch, filters.semester, filters.batch, reloadToken]);

  const reloadData = () => {
    setReloadToken((prev) => prev + 1);
  };

  return {
    students,
    setStudents,
    availableCourses,
    setAvailableCourses,
    degrees,
    branches,
    semesters,
    batches,
    isLoading,
    error,
    setError,
    reloadData,
  };
};

export default useManageStudentsData;
