import API from "../../api";

// Re-export the centralized API instance as the default export for this file
export const api = API;

// Auth services (using centralized API)
export const login = (username, password) => api.post('/auth/login', { username, password });
export const getCurrentUser = () => api.get('/auth/me');

// Personal Information services
export const getPersonal = (userId) => api.get(`/personal/${userId}`);
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
    const response = await api.get('/staff/education/');
    return response.data;
  } catch (error) {
    console.error('Error fetching education entries:', error);
    throw error;
  }
};

export const getEducationEntry = async (id) => {
  try {
    const response = await api.get(`/staff/education/${id}`);
    return { data: response.data };
  } catch (error) {
    console.error('Error fetching education entry:', error);
    throw error;
  }
};

export const createEducationEntry = async (data) => {
  try {
    const response = await api.post('/staff/education/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating education entry:', error);
    throw error;
  }
};

export const updateEducationEntry = async (id, data) => {
  try {
    const response = await api.put(`/staff/education/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating education entry:', error);
    throw error;
  }
};

export const deleteEducationEntry = async (id) => {
  try {
    const response = await api.delete(`/staff/education/${id}`);
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

// Conferences services
export const getConferences = () => api.get('/conferences');
export const getConference = (id) => api.get(`/conferences/${id}`);
export const createConference = (data) => api.post('/conferences', data);
export const updateConference = (id, data) => api.put(`/conferences/${id}`, data);
export const deleteConference = (id) => api.delete(`/conferences/${id}`);

// Journals services
export const getJournals = () => api.get('/journals');
export const getJournal = (id) => api.get(`/journals/${id}`);
export const createJournal = (data) => api.post('/journals', data);
export const updateJournal = (id, data) => api.put(`/journals/${id}`, data);
export const deleteJournal = (id) => api.delete(`/journals/${id}`);

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
      api.get('/events').catch(() => ({ data: [] })),
      api.get('/industry').catch(() => ({ data: [] })),
      api.get('/certifications').catch(() => ({ data: [] })),
      api.get('/book-chapters').catch(() => ({ data: [] })),
      api.get('/other/events-organized').catch(() => ({ data: [] })),
      api.get('/h-index').catch(() => ({ data: [] })),
      api.get('/resource-person').catch(() => ({ data: [] })),
      api.get('/recognition').catch(() => ({ data: [] })),
      api.get('/patent-product').catch(() => ({ data: [] })),
      api.get('/project-mentors').catch(() => ({ data: [] }))
    ]);

    return {
      data: {
        seedmoney: Array.isArray(seedMoneyResponse.data) ? seedMoneyResponse.data.length : 0,
        scholars: Array.isArray(scholarsResponse.data) ? scholarsResponse.data.length : 0,
        proposals: Array.isArray(proposalsResponse.data) ? proposalsResponse.data.length : 0,
        projectProposals: Array.isArray(projectProposalsResponse.data) ? projectProposalsResponse.data.length : 0,
        events: Array.isArray(eventsResponse.data) ? eventsResponse.data.length : 0,
        industry: Array.isArray(industryResponse.data) ? industryResponse.data.length : 0,
        certifications: Array.isArray(certificationsResponse.data) ? certificationsResponse.data.length : 0,
        publications: Array.isArray(publicationsResponse.data) ? publicationsResponse.data.length : 0,
        eventsOrganized: Array.isArray(eventsOrganizedResponse.data) ? eventsOrganizedResponse.data.length : 0,
        hIndex: Array.isArray(hIndexResponse.data) ? hIndexResponse.data.length : 0,
        resourcePerson: Array.isArray(resourcePersonResponse.data) ? resourcePersonResponse.data.length : 0,
        recognition: Array.isArray(recognitionResponse.data) ? recognitionResponse.data.length : 0,
        patents: Array.isArray(patentsResponse.data) ? patentsResponse.data.length : 0,
        projectMentors: Array.isArray(projectMentorsResponse.data) ? projectMentorsResponse.data.length : 0
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export default api;