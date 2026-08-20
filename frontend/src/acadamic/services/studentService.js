import { api } from './authService';

const DEBUG_ACADAMIC = import.meta.env.VITE_DEBUG_ACADAMIC === 'true';

// Optional: Add a helper to handle common response checks
const handleResponse = (response) => {
  if (response.data?.status === 'success') {
    return response.data.data;
  }
  throw new Error(response.data?.message || 'Request failed');
};

export const fetchStudentDetails = async () => {
  try {
    const response = await api.get("/student/details");
    return handleResponse(response);
  } catch (error) {
    console.error("fetchStudentDetails error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch student details"
    );
  }
};

export const fetchSemesters = async (batchYear) => {
  try {
    const response = await api.get('/student/semesters', {
      params: { batchYear }
    });
    return handleResponse(response);
  } catch (error) {
    console.error("fetchSemesters error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch semesters"
    );
  }
};

export const fetchMandatoryCourses = async (semesterId) => {
  try {
    const response = await api.get('/student/courses/mandatory', {
      params: { semesterId }
    });
    return handleResponse(response);
  } catch (error) {
    console.error("fetchMandatoryCourses error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch mandatory courses"
    );
  }
};

export const fetchElectiveBuckets = async (semesterId) => {
  try {
    const response = await api.get('/student/elective-buckets', {
      params: { semesterId }
    });
    const data = handleResponse(response);
    if (Array.isArray(data)) {
      return {
        buckets: data,
        isFinalized: false,
        canReselectNow: false,
        reselectionRequest: null,
      };
    }
    return data;
  } catch (error) {
    console.error("fetchElectiveBuckets error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch elective buckets"
    );
  }
};

export const allocateElectives = async (semesterId, selections) => {
  try {
    const response = await api.post("/student/allocate-electives", {
      semesterId,
      selections,
    });
    return handleResponse(response);
  } catch (error) {
    console.error("allocateElectives error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to allocate electives"
    );
  }
};

export const fetchEnrolledCourses = async (semesterId) => {
  try {
    const response = await api.get('/student/enrolled-courses', {
      params: { semesterId }
    });
    if (DEBUG_ACADAMIC) {
      console.log('Enrolled courses response:', response.data);
    }
    return handleResponse(response);
  } catch (error) {
    console.error("fetchEnrolledCourses error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch enrolled courses"
    );
  }
};

export const fetchAttendanceSummary = async (semesterId) => {
  try {
    const response = await api.get('/student/attendance-summary', {
      params: { semesterId }
    });
    return handleResponse(response);
  } catch (error) {
    console.error("fetchAttendanceSummary error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch attendance summary"
    );
  }
};

export const fetchSubjectwiseAttendance = async (semesterId) => {
  try {
    const response = await api.get('/student/subject-attendance', {
      params: { semesterId }
    });
    return handleResponse(response);
  } catch (error) {
    console.error("fetchSubjectwiseAttendance error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch subject-wise attendance"
    );
  }
};

export const fetchUserId = async () => {
  try {
    const response = await api.get("/student/userid");
    return handleResponse(response)?.userId; // adjust key if response uses "Userid"
  } catch (error) {
    console.error("fetchUserId error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch Userid"
    );
  }
};

export const fetchNptelCourses = async (semesterId) => {
  try {
    const response = await api.get('/student/nptel-courses', {
      params: { semesterId }
    });
    return handleResponse(response);
  } catch (error) {
    console.error("fetchNptelCourses error:", error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch NPTEL courses'
    );
  }
};

export const enrollNptelCourses = async (semesterId, nptelCourseIds) => {
  try {
    const response = await api.post('/student/nptel-enroll', {
      semesterId,
      nptelCourseIds
    });
    return handleResponse(response);
  } catch (error) {
    console.error("enrollNptelCourses error:", error);
    throw new Error(
      error.response?.data?.message || 'Failed to enroll in NPTEL courses'
    );
  }
};

export const fetchStudentNptelEnrollments = async () => {
  try {
    const response = await api.get('/student/nptel-enrollments');
    return handleResponse(response);
  } catch (error) {
    console.error("fetchStudentNptelEnrollments error:", error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch NPTEL enrollments'
    );
  }
};

export const requestNptelCreditTransfer = async (enrollmentId, decision = 'accepted', remarks = '') => {
  try {
    const response = await api.post('/student/nptel-credit-transfer', { enrollmentId, decision, remarks });
    return handleResponse(response);
  } catch (error) {
    console.error("requestNptelCreditTransfer error:", error);
    throw new Error(
      error.response?.data?.message || 'Failed to request credit transfer'
    );
  }
};

export const fetchOecPecProgress = async () => {
  try {
    const response = await api.get('/student/oec-pec-progress');
    return handleResponse(response);
  } catch (error) {
    console.error("fetchOecPecProgress error:", error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch OEC/PEC progress'
    );
  }
};

export const fetchStudentAcademicIds = async () => {
  try {
    const response = await api.get("/student/academic-ids");
    if (DEBUG_ACADAMIC) {
      console.log("Academic IDs response:", response);
    }

    return handleResponse(response); // returns { departmentId, batchId, semesterId }
  } catch (error) {
    console.error("fetchStudentAcademicIds error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch academic IDs"
    );
  }
};

export const requestElectiveReselection = async (semesterId, reason) => {
  try {
    const response = await api.post('/student/elective-reselection-request', {
      semesterId,
      reason: reason || ''
    });
    return handleResponse(response);
  } catch (error) {
    console.error("requestElectiveReselection error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to submit reselection request"
    );
  }
};
