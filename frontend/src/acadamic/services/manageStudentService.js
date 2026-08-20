import { showErrorToast } from '../utils/swalConfig.js';
import { api } from '../services/authService.js';

const API_BASE = 'http://localhost:4000/api/admin';
const DEBUG_ACADAMIC = import.meta.env.VITE_DEBUG_ACADAMIC === 'true';

const manageStudentsService = {
  fetchFilterOptions: async (branch, degree) => {
    try {
      const batchesQuery = [];
      if (branch) batchesQuery.push(`branch=${encodeURIComponent(branch)}`);
      if (degree) batchesQuery.push(`degree=${encodeURIComponent(degree)}`);
      const queryString = batchesQuery.length ? `?${batchesQuery.join('&')}` : '';

      const [branchesRes, semestersRes, batchesRes] = await Promise.all([
        api.get(`${API_BASE}/students/branches`),
        api.get(`${API_BASE}/students/semesters`),
        api.get(`${API_BASE}/students/batches${queryString}`),
      ]);

      if (branchesRes.status !== 200) throw new Error('Failed to load branches.');
      if (semestersRes.status !== 200) throw new Error('Failed to load semesters.');
      if (batchesRes.status !== 200) throw new Error('Failed to load batches.');

      return {
        branches: branchesRes.data.data || [],
        semesters: semestersRes.data.data || [],
        batches: batchesRes.data.data || [],
      };
    } catch (err) {
      console.error('Error in fetchFilterOptions:', err);
      showErrorToast(err.message || 'Failed to load filter options');
      throw err;
    }
  },

  fetchStudentsAndCourses: async (filters, batches) => {
    try {
        const { degree, branch, batch, semester } = filters;
      const semesterNumber = semester && typeof semester === 'string' && semester.startsWith('Semester ')
        ? semester.replace('Semester ', '')
        : '';

      const studentsRes = await api.get(`${API_BASE}/students/search`, {
        params: {
          degree: degree || undefined,
          branch: branch || undefined,
          batch: batch || undefined,
          semesterNumber: semesterNumber || undefined,
        },
      });

      if (studentsRes.status !== 200 || studentsRes.data.status !== 'success') {
        throw new Error(studentsRes.data.message || 'Failed to fetch students');
      }

      let studentsData = studentsRes.data.studentsData || [];
      let coursesData = studentsRes.data.coursesData || [];

      const cleanedStudents = Array.isArray(studentsData)
        ? studentsData.map((student) => ({
            ...student,
            enrolledCourses: Array.isArray(student.enrolledCourses)
              ? student.enrolledCourses.map((course) => ({
                  ...course,
                  courseId: String(course.courseId),
                  courseCode: course.courseCode,
                  staffId: course.staffId ? String(course.staffId).replace(/"/g, '') : '',
                  staffName: course.staffName && typeof course.staffName === 'string' ? course.staffName.replace(/"/g, '') : 'Not Assigned',
                  sectionName: course.sectionName && typeof course.sectionName === 'string' ? course.sectionName.replace(/"/g, '') : '',
                }))
              : [],
            selectedElectiveIds: student.selectedElectiveIds?.map(id => String(id)) || [],
          }))
        : [];

      coursesData = Array.isArray(coursesData)
        ? coursesData.map((course) => ({
            ...course,
            courseId: String(course.courseId),
            courseCode: course.courseCode,
            courseTitle: course.courseTitle || 'Unknown Course',
            category: course.category,
            batches: Array.isArray(course.batches)
              ? course.batches.map((batch, index) => ({
                  ...batch,
                  sectionId: String(batch.sectionId),
                  sectionName: batch.sectionName || `Batch ${index + 1}`,
                  staffId: batch.staffId ? String(batch.staffId) : '',
                  staffName: batch.staffName || 'Not Assigned',
                  enrolled: batch.enrolled || 0,
                  capacity: batch.capacity || 'N/A',
                }))
              : [],
          }))
        : [];

      if (DEBUG_ACADAMIC) {
        console.log('Students Data:', cleanedStudents);
        console.log('Courses Data:', coursesData);
      }

      return { studentsData: cleanedStudents, coursesData };
    } catch (err) {
      console.error('Error in fetchStudentsAndCourses:', err);
      showErrorToast(err.message || 'Failed to load students and courses');
      throw err;
    }
  },

  fetchStudentsByBatchAndSemester: async (branch, batch, semesterNumber) => {
    try {
      const res = await api.get(`${API_BASE}/students/batch-semester`, {
        params: { branch, batch, semesterNumber },
      });
      if (res.status !== 200 || res.data.status !== 'success') {
        throw new Error(res.data.message || 'Failed to fetch students');
      }
      return res.data.data;
    } catch (err) {
      console.error('Error in fetchStudentsByBatchAndSemester:', err);
      showErrorToast(err.message || 'Failed to fetch students by batch/semester');
      throw err;
    }
  },

  bulkUpdateStudentSemester: async (students, batch, branch) => {
    try {
      const res = await api.post(`${API_BASE}/students/bulk-update-semester`, {
        students,
        batch,
        branch,
      });
      if (res.status !== 200 || res.data.status !== 'success') {
        throw new Error(res.data.message || 'Failed to update semesters');
      }
      return res.data;
    } catch (err) {
      console.error('Error in bulkUpdateStudentSemester:', err);
      showErrorToast(err.message || 'Bulk semester update failed');
      throw err;
    }
  },

  unenroll: async (rollnumber, courseId) => {
    try {
      const res = await api.delete(`${API_BASE}/students/unenroll`, {
        data: { rollnumber, courseId },
      });
      if (res.status !== 200 || res.data.status !== 'success') {
        throw new Error(res.data.message || 'Failed to unenroll.');
      }
      return true;
    } catch (err) {
      console.error('Error in unenroll:', err);
      showErrorToast(err.message || 'Failed to unenroll student');
      throw err;
    }
  },

  saveAssignments: async (assignments) => {
    try {
      const responses = await Promise.all(
        assignments.map((assignment) =>
          api.post(`${API_BASE}/students/enroll`, {
            rollnumber: assignment.rollnumber,
            courseId: String(assignment.courseId),
            sectionName: assignment.sectionName,
            staffId: String(assignment.staffId),
          }).then((res) => ({
            status: res.status,
            data: res.data,
            assignment,
          }))
        )
      );

      const failed = responses.filter((res) => res.data.status !== 'success');
      if (failed.length > 0) {
        const errorMessages = failed
          .map(
            (res) =>
              `${res.data.message || 'Unknown error'} (Student: ${res.assignment.rollnumber}, Course: ${res.assignment.courseId})`
          )
          .join('; ');
        throw new Error(`Failed to save ${failed.length} assignment(s): ${errorMessages}`);
      }
      return true;
    } catch (err) {
      console.error('Error in saveAssignments:', err);
      showErrorToast(err.message || 'Failed to save course assignments');
      throw err;
    }
  },

  autoAllocateSemester: async ({ branch, batch, semester }) => {
    try {
      const semesterNumber =
        typeof semester === 'string' && semester.startsWith('Semester ')
          ? Number(semester.replace('Semester ', ''))
          : Number(semester);

      const res = await api.post(`${API_BASE}/students/auto-allocate`, {
        branch,
        batch,
        semesterNumber,
      });

      if (res.status !== 200 || res.data.status !== 'success') {
        throw new Error(res.data.message || 'Failed to auto allocate semester data');
      }

      return res.data;
    } catch (err) {
      console.error('Error in autoAllocateSemester:', err);
      showErrorToast(err.response?.data?.message || err.message || 'Failed to auto allocate semester data');
      throw err;
    }
  },
};

export default manageStudentsService;
