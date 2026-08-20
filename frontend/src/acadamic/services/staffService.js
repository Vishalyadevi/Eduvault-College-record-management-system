import axios from 'axios';

const API_URL = 'http://localhost:4000/api/staff';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post('http://localhost:4000/api/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// --- HELPERS ---
const splitIds = (id) => (id ? String(id).split('_') : []);
const withSectionScope = (sectionIds, config = {}) => {
  const sections = splitIds(sectionIds).map(id => id.trim()).filter(Boolean).join('_');
  if (!sections) return config;
  return { ...config, params: { ...(config.params || {}), sections } };
};

// Map each student RegNo to their Course Code to know where to save marks
const getStudentCourseMap = async (codes, sectionIds) => {
  const map = {};
  const sIds = splitIds(sectionIds);

  const promises = codes.map((code, idx) => {
    const secId = sIds[idx] || sIds[0];
    return api.get(`/students/${code}/section/${secId}`).then(res => ({
      code,
      students: res.data.data || []
    }));
  });

  const results = await Promise.all(promises);
  results.forEach(({ code, students }) => {
    students.forEach(s => {
      map[s.regno] = code;
    });
  });

  return map;
};

// --- MARKS FUNCTIONS ---

export const getStudentCOMarks = async (courseCode, sectionIds) => {
  try {
    const codes = splitIds(courseCode);
    const sections = splitIds(sectionIds);
    const promises = codes.map((code, index) => api.get(
      `/marks/co/${code}`,
      withSectionScope(sections[index] || sections[0])
    ));
    const responses = await Promise.all(promises);

    let allStudents = [];
    let partitionData = {};

    responses.forEach((res, index) => {
      // FIX: Handle nested response structure { data: { students: ... } }
      const responseBody = res.data;
      const innerData = responseBody.data || responseBody;

      if (index === 0) partitionData = innerData.partitions || {};

      if (innerData.students && Array.isArray(innerData.students)) {
        allStudents = [...allStudents, ...innerData.students];
      }
    });

    const uniqueStudents = [...new Map(allStudents.map(item => [item.regno, item])).values()];
    return { students: uniqueStudents, partitions: partitionData };
  } catch (error) {
    console.error('Error in getStudentCOMarks:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch CO marks');
  }
};

export const updateStudentCOMark = async (courseCode, regno, coId, consolidatedMark, sectionIds) => {
  try {
    const response = await api.put(
      `/marks/co/${regno}/${coId}`,
      { consolidatedMark },
      withSectionScope(sectionIds)
    );
    return response.data;
  } catch (error) {
    console.error('Error in updateStudentCOMark:', error);
    throw new Error(error.response?.data?.message || 'Failed to update CO mark');
  }
};

// --- SYNCED TOOL FUNCTIONS ---

export const saveToolsForCO = async (coId, toolsData, compositeCourseCode, compositeSectionId) => {
  const codes = splitIds(compositeCourseCode);
  const sections = splitIds(compositeSectionId);
  const primaryCode = codes[0];
  const tools = Array.isArray(toolsData) ? toolsData : toolsData.tools;

  try {
    await api.post(`/tools/${coId}/save`, { tools });

    if (codes.length > 1) {
      const primaryCosRes = await api.get(`/cos/${primaryCode}`, withSectionScope(sections[0]));
      const primaryCo = (primaryCosRes.data.data || []).find(c => c.coId === coId);

      if (primaryCo) {
        for (let i = 1; i < codes.length; i++) {
          const siblingCode = codes[i];
          const siblingCosRes = await api.get(
            `/cos/${siblingCode}`,
            withSectionScope(sections[i] || sections[0])
          );
          const siblingCo = (siblingCosRes.data.data || []).find(c => c.coNumber === primaryCo.coNumber);

          if (siblingCo) {
            const toolsForSibling = tools.map(({ toolId, uniqueId, ...rest }) => rest);
            await api.post(`/tools/${siblingCo.coId}/save`, { tools: toolsForSibling });
          }
        }
      }
    }
    return { success: true, message: 'Tools synced successfully' };
  } catch (error) {
    console.error('Error saving tools:', error);
    throw error;
  }
};

export const deleteTool = async (toolId, compositeCourseCode) => {
  try {
    await api.delete(`/tools/${toolId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting tool:', error);
    throw error;
  }
};

// --- SYNCED MARK SAVING ---

export const saveStudentMarksForTool = async (toolId, marksData, compositeCourseCode, compositeSectionId) => {
  const codes = splitIds(compositeCourseCode);
  const marksArray = Array.isArray(marksData) ? marksData : marksData.marks;

  try {
    if (codes.length <= 1) {
      const payload = Array.isArray(marksData) ? { marks: marksData } : marksData;
      await api.post(`/marks/${toolId}`, payload, withSectionScope(compositeSectionId));
    } else {
      const primaryCode = codes[0];
      const sections = splitIds(compositeSectionId);
      const studentMap = await getStudentCourseMap(codes, compositeSectionId);

      const marksByCourse = {};
      marksArray.forEach(m => {
        const course = studentMap[m.regno];
        if (course) {
          if (!marksByCourse[course]) marksByCourse[course] = [];
          marksByCourse[course].push(m);
        }
      });

      const primaryCosRes = await api.get(`/cos/${primaryCode}`, withSectionScope(sections[0]));
      const primaryCos = primaryCosRes.data.data || [];

      let primaryTool = null;
      let primaryCo = null;

      for (const co of primaryCos) {
        const toolsRes = await api.get(`/tools/${co.coId}`);
        const tools = toolsRes.data.data || [];
        const found = tools.find(t => t.toolId === toolId);
        if (found) {
          primaryTool = found;
          primaryCo = co;
          break;
        }
      }

      if (!primaryTool) throw new Error("Primary tool details could not be found.");

      for (const code of codes) {
        const courseMarks = marksByCourse[code] || [];
        if (courseMarks.length === 0) continue;

        if (code === primaryCode) {
          await api.post(`/marks/${toolId}`, { marks: courseMarks }, withSectionScope(sections[0]));
        } else {
          const codeIndex = codes.indexOf(code);
          const section = sections[codeIndex] || sections[0];
          const siblingCosRes = await api.get(`/cos/${code}`, withSectionScope(section));
          const siblingCo = (siblingCosRes.data.data || []).find(c => c.coNumber === primaryCo.coNumber);

          if (!siblingCo) continue;

          const siblingToolsRes = await api.get(`/tools/${siblingCo.coId}`);
          let siblingTool = (siblingToolsRes.data.data || []).find(t => t.toolName === primaryTool.toolName);

          if (!siblingTool) {
            const createRes = await api.post(`/tools/${siblingCo.coId}`, {
              toolName: primaryTool.toolName,
              weightage: primaryTool.weightage,
              maxMarks: primaryTool.maxMarks
            });
            const newId = createRes.data.toolId || createRes.data.insertId;
            siblingTool = { toolId: newId };
          }

          await api.post(`/marks/${siblingTool.toolId}`, { marks: courseMarks }, withSectionScope(section));
        }
      }
    }
    return { success: true, message: 'Marks saved successfully across courses' };
  } catch (error) {
    console.error('Error in saveStudentMarksForTool:', error);
    throw error;
  }
};

export const getStudentMarksForTool = async (toolId, compositeCourseCode, compositeSectionId) => {
  const codes = splitIds(compositeCourseCode);

  try {
    if (codes.length <= 1) {
      const response = await api.get(`/marks/${toolId}`, withSectionScope(compositeSectionId));
      return response.data.data || [];
    }

    const primaryCode = codes[0];
    const sections = splitIds(compositeSectionId);
    const primaryCosRes = await api.get(`/cos/${primaryCode}`, withSectionScope(sections[0]));
    let primaryToolName = null;
    let primaryCoNum = null;

    for (const co of primaryCosRes.data.data || []) {
      const tRes = await api.get(`/tools/${co.coId}`);
      const found = (tRes.data.data || []).find(t => t.toolId === parseInt(toolId));
      if (found) {
        primaryToolName = found.toolName;
        primaryCoNum = co.coNumber;
        break;
      }
    }

    if (!primaryToolName) {
      const res = await api.get(`/marks/${toolId}`, withSectionScope(compositeSectionId));
      return res.data.data || [];
    }

    const marksSets = await Promise.all(
      codes.map(async (code, index) => {
        const section = sections[index] || sections[0];
        const coRes = await api.get(`/cos/${code}`, withSectionScope(section));
        const co = (coRes.data.data || []).find(c => c.coNumber === primaryCoNum);
        if (!co) return [];

        const tRes = await api.get(`/tools/${co.coId}`);
        const tool = (tRes.data.data || []).find(t => t.toolName === primaryToolName);
        if (!tool) return [];

        const mRes = await api.get(`/marks/${tool.toolId}`, withSectionScope(section));
        return mRes.data.data || [];
      })
    );

    return marksSets.flat();

  } catch (error) {
    console.error('Error in getStudentMarksForTool:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch marks');
  }
};

// --- STANDARD EXPORTS ---
export const getCoursePartitions = async (courseCode, sectionIds) => {
  const codes = splitIds(courseCode);
  const response = await api.get(`/partitions/${codes[0]}`, withSectionScope(splitIds(sectionIds)[0]));
  return response.data.data;
};

export const saveCoursePartitions = async (courseCode, partitions, sectionIds) => {
  const codes = splitIds(courseCode);
  const sections = splitIds(sectionIds);
  const promises = codes.map((code, index) => api.post(
    `/partitions/${code}`,
    partitions,
    withSectionScope(sections[index] || sections[0])
  ));
  const responses = await Promise.all(promises);
  return responses[0].data;
};

export const updateCoursePartitions = async (courseCode, partitions, sectionIds) => {
  const codes = splitIds(courseCode);
  const sections = splitIds(sectionIds);
  const promises = codes.map((code, index) => api.put(
    `/partitions/${code}`,
    partitions,
    withSectionScope(sections[index] || sections[0])
  ));
  const responses = await Promise.all(promises);
  return responses[0].data;
};

export const getCOsForCourse = async (courseCode, sectionIds) => {
  const codes = splitIds(courseCode);
  const response = await api.get(`/cos/${codes[0]}`, withSectionScope(splitIds(sectionIds)[0]));
  const cos = response.data.data || [];
  return cos.map((co) => ({
    ...co,
    coType: co.coType || co.COType?.coType || 'N/A',
  }));
};

export const getToolsForCO = async (coId) => {
  const response = await api.get(`/tools/${coId}`);
  return response.data.data || [];
};

export const getStudentsForSection = async (courseCode, sectionId) => {
  try {
    const codes = splitIds(courseCode);
    const sections = splitIds(sectionId);
    const promises = codes.map((code, index) => {
      const sec = sections[index] || sections[0];
      return api.get(`/students/${code}/section/${sec}`);
    });
    const responses = await Promise.all(promises);
    let allStudents = [];
    responses.forEach(res => {
      if (res.data.data) allStudents = [...allStudents, ...res.data.data];
    });
    const uniqueStudents = [...new Map(allStudents.map(item => [item.regno, item])).values()];
    uniqueStudents.sort((a, b) => a.regno.localeCompare(b.regno));
    return uniqueStudents;
  } catch (error) {
    console.error('Error in getStudentsForSection:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch students');
  }
};

export const getMyCourses = async () => {
  const response = await api.get(`/courses`);
  return response.data.data || [];
};

export const createTool = async (coId, tool) => {
  const response = await api.post(`/tools/${coId}`, tool);
  return response.data;
};

export const updateTool = async (toolId, tool) => {
  const response = await api.put(`/tools/${toolId}`, tool);
  return response.data;
};

export const importMarksForTool = async (toolId, file, sectionIds) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/marks/${toolId}/import`, formData, withSectionScope(sectionIds));
  return response.data;
};

export const exportCoWiseCsv = async (coId, sectionIds) => {
  const response = await api.get(
    `/export/co/${coId}`,
    withSectionScope(sectionIds, { responseType: 'blob' })
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `co_${coId}_marks.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportCourseWiseCsv = async (courseCode, sectionIds) => {
  const codes = splitIds(courseCode);
  const response = await api.get(
    `/export/course/${codes[0]}`,
    withSectionScope(splitIds(sectionIds)[0], { responseType: 'blob' })
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${codes[0]}_marks.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getMarksLockStatus = async (courseCode) => {
  try {
    const codes = splitIds(courseCode);
    const response = await api.get(`/marks/lock-status/${codes[0]}`);
    return response.data?.data?.isLocked ?? false;
  } catch (error) {
    console.error('Error in getMarksLockStatus:', error);
    return false;
  }
};

export const getAttendanceShortage = async (courseCode, sectionIds, minPercentage = 75) => {
  try {
    const codes = splitIds(courseCode).join('_');
    const sections = splitIds(sectionIds).join('_');
    const params = {};
    if (sections) params.sections = sections;
    if (minPercentage !== undefined && minPercentage !== null) params.min = minPercentage;
    const response = await api.get(`/attendance/shortage/${codes}`, { params });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error in getAttendanceShortage:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch shortage students');
  }
};

export const getStaffAttendanceReportFilters = async () => {
  const response = await api.get('/attendance/report/filters');
  return response.data?.data || [];
};

export const generateStaffAttendanceReport = async (params) => {
  const response = await api.get('/attendance/report', { params });
  return response.data || { data: [], summary: {} };
};
