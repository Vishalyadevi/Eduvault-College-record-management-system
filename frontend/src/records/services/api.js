import API from "../../api";

// Re-export the centralized API instance as the default export for this file
export const api = API;

// Auth services (using centralized API)
export const login = (username, password) => api.post('/auth/login', { username, password });
export const getCurrentUser = () => api.get('/auth/me');

// Personal Information services
export const getPersonal = (userId) => api.get(`/personal/${userId}`);
export const getStaffResumeData = (userId) => api.get(`/resume-staff/staff-data/${userId}`);
export const createPersonal = (data) => {
  return api.post('/personal', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updatePersonal = (userId, data) => {
  return api.put(`/personal/${userId}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deletePersonal = (userId) => api.delete(`/personal/${userId}`);

// Personal Info entries (alternative endpoint)
export const getPersonalInfoEntries = () => api.get('/personal-info');
export const getPersonalInfoById = (id) => api.get(`/personal-info/${id}`);
export const getPersonalInfoByUserId = (userId) => api.get(`/personal-info/user/${userId}`);
export const createPersonalInfoEntry = (data) => api.post('/personal-info', data);
export const updatePersonalInfoEntry = (id, data) => api.put(`/personal-info/${id}`, data);
export const deletePersonalInfoEntry = (id) => api.delete(`/personal-info/${id}`);

// Education services
export const getEducationEntries = async () => {
  try {
    const response = await api.get('/education');
    return response.data;
  } catch (error) {
    console.error('Error fetching education entries:', error);
    throw error;
  }
};

export const getEducationEntry = async (id) => {
  try {
    const response = await api.get(`/education/${id}`);
    return { data: response.data };
  } catch (error) {
    console.error('Error fetching education entry:', error);
    throw error;
  }
};

export const createEducationEntry = async (data) => {
  try {
    const response = await api.post('/education', data);
    return response.data;
  } catch (error) {
    console.error('Error creating education entry:', error);
    throw error;
  }
};

export const updateEducationEntry = async (id, data) => {
  try {
    const response = await api.put(`/education/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating education entry:', error);
    throw error;
  }
};

export const deleteEducationEntry = async (id) => {
  try {
    const response = await api.delete(`/education/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting education entry:', error);
    throw error;
  }
};

// Student Education services
export const addOrUpdateStudentEducation = (data) => api.post('/student-education/add-or-update', data);
export const getStudentEducationRecord = (userId) => api.get(`/student-education/my-record?UserId=${userId}`);
export const getStudentEducationAverages = (userId) => api.get(`/student-education/averages?UserId=${userId}`);
export const getPendingStudentEducationApprovals = () => api.get('/student-education/pending-approvals');
export const approveStudentEducationRecord = (id, data) => api.put(`/student-education/approve/${id}`, data);
export const rejectStudentEducationRecord = (id, data) => api.put(`/student-education/reject/${id}`, data);
export const bulkUploadStudentGPA = (data) => api.post('/student-education/bulk-upload-gpa', { data });
export const getAllStudentEducationRecords = () => api.get('/student-education/all-records');

// Scholars services
export const getScholars = () => api.get('/scholars');
export const getScholar = (id) => api.get(`/scholars/${id}`);
export const createScholar = (data) => api.post('/scholars', data);
export const updateScholar = (id, data) => api.put(`/scholars/${id}`, data);
export const deleteScholar = (id) => api.delete(`/scholars/${id}`);

// Funding agency master services
export const getFundingAgencies = (params) => api.get('/funding-agencies', { params });
export const getFundingAgency = (id) => api.get(`/funding-agencies/${id}`);
export const createFundingAgency = (data) => api.post('/funding-agencies', data);
export const updateFundingAgency = (id, data) => api.put(`/funding-agencies/${id}`, data);
export const deleteFundingAgency = (id) => api.delete(`/funding-agencies/${id}`);

// Certification course master services
export const getCertificationCourses = (params) => api.get('/certification-courses', { params });
export const getCertificationCourse = (id) => api.get(`/certification-courses/${id}`);
export const createCertificationCourse = (data) => api.post('/certification-courses', data);
export const updateCertificationCourse = (id, data) => api.put(`/certification-courses/${id}`, data);
export const deleteCertificationCourse = (id) => api.delete(`/certification-courses/${id}`);

// Event type master services
export const getEventTypes = (params) => api.get('/event-types', { params });
export const getEventType = (id) => api.get(`/event-types/${id}`);
export const createEventType = (data) => api.post('/event-types', data);
export const updateEventType = (id, data) => api.put(`/event-types/${id}`, data);
export const deleteEventType = (id) => api.delete(`/event-types/${id}`);

// Consultancy Proposals services
export const getProposals = () => api.get('/proposals');
export const getProposal = (id) => api.get(`/proposals/${id}`);
export const createProposal = (data) => {
  return api.post('/proposals', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateProposal = (id, data) => {
  return api.put(`/proposals/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteProposal = (id) => api.delete(`/proposals/${id}`);

// Consultancy Payment Details services
export const getPaymentDetails = (proposalId) => api.get(`/payment-details/proposal/${proposalId}`);
export const getPaymentDetail = (id) => api.get(`/payment-details/${id}`);
export const createPaymentDetail = (data) => api.post('/payment-details', data);
export const updatePaymentDetail = (id, data) => api.put(`/payment-details/${id}`, data);
export const deletePaymentDetail = (id) => api.delete(`/payment-details/${id}`);

// Project Proposals services (Funded Projects)
export const getProjectProposals = () => api.get('/project-proposal');
export const getProjectProposal = (id) => api.get(`/project-proposal/${id}`);
export const createProjectProposal = (data) => {
  return api.post('/project-proposal', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateProjectProposal = (id, data) => {
  return api.put(`/project-proposal/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteProjectProposal = (id) => api.delete(`/project-proposal/${id}`);

// Project Payment Details services (bundled under /project-proposal)
export const getProjectPaymentDetails = (proposalId) => api.get(`/project-proposal/proposal/${proposalId}`);
export const getProjectPaymentDetail = (id) => api.get(`/project-proposal/payment/${id}`);
export const createProjectPaymentDetail = (data) => api.post('/project-proposal/payment', data);
export const updateProjectPaymentDetail = (id, data) => api.put(`/project-proposal/payment/${id}`, data);
export const deleteProjectPaymentDetail = (id) => api.delete(`/project-proposal/payment/${id}`);

// Events services
export const getEvents = () => api.get('/events');
export const getEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => {
  return api.post('/events', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const bulkCreateEvents = (records) => postBulkHelper('/events/bulk', records);
export const updateEvent = (id, data) => {
  return api.put(`/events/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Get event document (PDF)
export const getEventDocument = (eventId, documentType) => {
  return api.get(`/events/${eventId}/document/${documentType}`, {
    responseType: 'blob'
  });
};

// Staff Events Attended services
export const getStaffEventsAttended = () => api.get('/staff/events-attended');
export const getStaffEventAttended = (id) => api.get(`/staff/events-attended/${id}`);
export const createStaffEventAttended = (data) => {
  return api.post('/staff/events-attended', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateStaffEventAttended = (id, data) => {
  return api.put(`/staff/events-attended/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteStaffEventAttended = (id) => api.delete(`/staff/events-attended/${id}`);

export const getStaffEventDocument = (eventId, documentType) => {
  return api.get(`/staff/events-attended/${eventId}/document/${documentType}`, {
    responseType: 'blob'
  });
};

// Industry Know-how services
export const getIndustryKnowhow = () => api.get('/industry');
export const getIndustryKnowhowItem = (id) => api.get(`/industry/${id}`);
export const createIndustryKnowhow = (data) => {
  return api.post('/industry', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateIndustryKnowhow = (id, data) => {
  return api.put(`/industry/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteIndustryKnowhow = (id) => api.delete(`/industry/${id}`);

// Get industry certificate PDF
export const getIndustryCertificatePDF = async (id) => {
  const response = await api.get(`/industry/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
};

// Certifications services
export const getCertifications = () => api.get('/certifications');
export const getCertification = (id) => api.get(`/certifications/${id}`);
export const createCertification = (data) => api.post('/certifications', data);
export const updateCertification = (id, data) => api.put(`/certifications/${id}`, data);
export const deleteCertification = (id) => api.delete(`/certifications/${id}`);

// Conference Details services (/conference-details)
export const getConferences = () => api.get('/conference-details');
export const getConference = (id) => api.get(`/conference-details/${id}`);
export const createConference = (data) => api.post('/conference-details', data);
export const bulkCreateConferences = (records) => postBulkHelper('/conference-details/bulk', records);
export const updateConference = (id, data) => api.put(`/conference-details/${id}`, data);
export const deleteConference = (id) => api.delete(`/conference-details/${id}`);
export const getConferenceDocument = (id) => api.get(`/conference-details/${id}/certificate`, { responseType: 'blob' });


// Journals services (routed through /book-chapters)
export const getJournals = async () => {
  const res = await api.get('/book-chapters');
  const items = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
  return { data: items.filter(i => i.publication_type === 'journal') };
};
export const getJournal = (id) => api.get(`/book-chapters/${id}`);
export const createJournal = (data) => api.post('/book-chapters', { ...data, publication_type: 'journal' });
export const updateJournal = (id, data) => api.put(`/book-chapters/${id}`, { ...data, publication_type: 'journal' });
export const deleteJournal = (id) => api.delete(`/book-chapters/${id}`);

// Book Chapters services (Publications)
export const getBookChapters = () => api.get('/book-chapters');
export const getBookChapter = (id) => api.get(`/book-chapters/${id}`);
export const createBookChapter = (data) => api.post('/book-chapters', data);
export const updateBookChapter = (id, data) => api.put(`/book-chapters/${id}`, data);
export const deleteBookChapter = (id) => api.delete(`/book-chapters/${id}`);

// Events Organized services
export const getEventsOrganized = () => api.get('/events-organized');
export const getEventOrganized = (id) => api.get(`/events-organized/${id}`);
export const createEventOrganized = (data) => {
  return api.post('/events-organized', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateEventOrganized = (id, data) => {
  return api.put(`/events-organized/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteEventOrganized = (id) => api.delete(`/events-organized/${id}`);

// H-Index services
export const getHIndexes = () => api.get('/h-index');
export const getHIndex = (id) => api.get(`/h-index/${id}`);
export const createHIndex = (data) => api.post('/h-index', data);
export const updateHIndex = (id, data) => api.put(`/h-index/${id}`, data);
export const deleteHIndex = (id) => api.delete(`/h-index/${id}`);

// Resource Person services
export const getResourcePersonEntries = () => api.get('/resource-person');
export const getResourcePersonEntry = (id) => api.get(`/resource-person/${id}`);
export const createResourcePersonEntry = (data) => {
  return api.post('/resource-person', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateResourcePersonEntry = (id, data) => {
  return api.put(`/resource-person/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteResourcePersonEntry = (id) => api.delete(`/resource-person/${id}`);

export const viewResourcePersonFile = async (filename) => {
  const encodedFilename = encodeURIComponent(filename);
  const response = await api.get(`/resource-person/view/${encodedFilename}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadResourcePersonFile = async (filename) => {
  const encodedFilename = encodeURIComponent(filename);
  const response = await api.get(`/resource-person/download/${encodedFilename}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Recognition services
export const getRecognitions = () => api.get('/recognition');
export const getRecognition = (id) => api.get(`/recognition/${id}`);
export const createRecognition = (data) => api.post('/recognition', data);
export const updateRecognition = (id, data) => api.put(`/recognition/${id}`, data);
export const deleteRecognition = (id) => api.delete(`/recognition/${id}`);

// Patent/Product Development services
export const getPatentEntries = () => api.get('/patent-product');
export const getPatentEntry = (id) => api.get(`/patent-product/${id}`);
export const createPatentEntry = (data) => api.post('/patent-product', data, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const updatePatentEntry = (id, data) => api.put(`/patent-product/${id}`, data, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const deletePatentEntry = (id) => api.delete(`/patent-product/${id}`);

// Project Mentors services
export const getProjectMentors = () => api.get('/project-mentors');
export const getProjectMentor = (id) => api.get(`/project-mentors/${id}`);
export const createProjectMentor = (data) => {
  return api.post('/project-mentors', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateProjectMentor = (id, data) => {
  return api.put(`/project-mentors/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteProjectMentor = (id) => api.delete(`/project-mentors/${id}`);

// Seed Money services
export const getSeedMoneyEntries = () => api.get('/seed-money');
export const getSeedMoneyEntry = (id) => api.get(`/seed-money/${id}`);
export const createSeedMoneyEntry = (data) => {
  return api.post('/seed-money', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateSeedMoneyEntry = (id, data) => {
  return api.put(`/seed-money/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteSeedMoneyEntry = (id) => api.delete(`/seed-money/${id}`);

// Dashboard stats service
export const getDashboardStats = async () => {
  try {
    const [
      seedMoneyResponse,
      scholarsResponse,
      proposalsResponse,
      projectProposalsResponse,
      eventsResponse,
      industryResponse,
      certificationsResponse,
      publicationsResponse,
      eventsOrganizedResponse,
      hIndexResponse,
      resourcePersonResponse,
      recognitionResponse,
      patentsResponse,
      projectMentorsResponse
    ] = await Promise.all([
      api.get('/seed-money').catch(() => ({ data: [] })),
      api.get('/scholars').catch(() => ({ data: [] })),
      api.get('/proposals').catch(() => ({ data: [] })),
      api.get('/project-proposal').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })), // fixed endpoint
      api.get('/industry').catch(() => ({ data: [] })),
      api.get('/certifications').catch(() => ({ data: [] })),
      api.get('/book-chapters').catch(() => ({ data: [] })),
      api.get('/events-organized').catch(() => ({ data: [] })), // fixed endpoint
      api.get('/h-index').catch(() => ({ data: [] })),
      api.get('/resource-person').catch(() => ({ data: [] })),
      api.get('/recognition').catch(() => ({ data: [] })),
      api.get('/patent-product').catch(() => ({ data: [] })),
      api.get('/project-mentors').catch(() => ({ data: [] }))
    ]);

    const getCount = (res) => {
      if (Array.isArray(res?.data)) return res.data.length;
      if (Array.isArray(res?.data?.data)) return res.data.data.length;
      if (res?.data?.count !== undefined) return res.data.count;
      return 0;
    };

    return {
      data: {
        seedmoney: getCount(seedMoneyResponse),
        scholars: getCount(scholarsResponse),
        proposals: getCount(proposalsResponse),
        projectProposals: getCount(projectProposalsResponse),
        events: getCount(eventsResponse),
        industry: getCount(industryResponse),
        certifications: getCount(certificationsResponse),
        publications: getCount(publicationsResponse),
        eventsOrganized: getCount(eventsOrganizedResponse),
        hIndex: getCount(hIndexResponse),
        resourcePerson: getCount(resourcePersonResponse),
        recognition: getCount(recognitionResponse),
        patents: getCount(patentsResponse),
        projectMentors: getCount(projectMentorsResponse)
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Staff Dashboard - Tutor WardStats
export const getTutorWardDashboardStats = async () => {
  return api.get('/staff-dashboard/tutor-ward-stats');
};

// Helper function for bulk API requests
export const postBulkHelper = (url, records) => {
  return api.post(url, { records });
};

// ─── BULK INSERTION API HELPERS FOR ALL 17 ACTIVITY MODULES ───────────────────
export const bulkCreateScholars = (records) => postBulkHelper('/scholars/bulk', records);
export const bulkCreateProposals = (records) => postBulkHelper('/proposals/bulk', records);
export const bulkCreateFundedProjects = (records) => postBulkHelper('/project-proposal/bulk', records);
export const bulkCreateSeedMoney = (records) => postBulkHelper('/seed-money/bulk', records);
export const bulkCreateIndustryKnowhow = (records) => postBulkHelper('/industry/bulk', records);
export const bulkCreateCertifications = (records) => postBulkHelper('/certifications/bulk', records);
export const bulkCreateBookChapters = (records) => postBulkHelper('/book-chapters/bulk', records);
export const bulkCreateEventsOrganized = (records) => postBulkHelper('/events-organized/bulk', records);
export const bulkCreateResourcePerson = (records) => postBulkHelper('/resource-person/bulk', records);
export const bulkCreateRecognitions = (records) => postBulkHelper('/recognition/bulk', records);
export const bulkCreatePatentProducts = (records) => postBulkHelper('/patent-product/bulk', records);
export const bulkCreateProjectMentors = (records) => postBulkHelper('/project-mentors/bulk', records);
export const bulkCreateMOUs = (records) => postBulkHelper('/mou/bulk', records);
export const bulkCreateTlpActivities = (records) => postBulkHelper('/staff/tlp/bulk', records);
export const bulkCreateClubActivities = (records) => postBulkHelper('/activity/bulk', records);
export const bulkCreateActivities = (records) => postBulkHelper('/activity/bulk', records);

export default api;