import { api } from '../services/authService.js';

const RESUME_API_BASE = '/api/resume-staff';

// ─── MAIN RESUME DATA ──────────────────────────────────────────────────────────
/**
 * Fetch complete staff resume data for a specific user
 * @param {number|string} userId - Staff user ID
 * @returns {Promise<Object>} Resume data with all activities
 */
export const getStaffResume = async (userId) => {
  try {
    console.log(`📄 Fetching resume for userId: ${userId}`);
    const response = await api.get(`${RESUME_API_BASE}/staff-data/${userId}`);
    
    if (response.data?.success !== true) {
      throw new Error(response.data?.message || 'Failed to fetch resume data');
    }

    const data = response.data.data;
    
    // Normalize data structure for consistent frontend usage
    return {
      userInfo: data.userInfo || data.personalInfo || {},
      statistics: data.statistics || {
        certificationCourses: data.certificationCourses?.length || 0,
        recognitions: data.recognitions?.length || 0,
        resourcePerson: data.resourcePerson?.length || 0,
        eventsAttended: data.eventsAttended?.length || 0,
        seedMoney: data.seedMoney?.length || 0,
        scholars: data.scholars?.length || 0,
        patents: data.patents?.length || 0,
      },
      // Flatten arrays for easy tab rendering
      certifications: data.certificationCourses || data['Certification Courses'] || [],
      recognitions: data.recognitions || data['Recognition & Appreciation'] || [],
      resourcePerson: data.resourcePerson || data['Resource Person'] || [],
      eventsAttended: data.eventsAttended || data['Events Attended'] || [],
      eventsOrganized: data.eventsOrganized || [],
      seedMoney: data.seedMoney || data['Seed Money'] || [],
      scholars: data.scholars || data['Scholars'] || [],
      patents: data.patents || data['Patents & Products'] || [],
      projectMentors: data.projectMentors || data['Project Mentors'] || [],
      education: data.education || [],
      hIndex: data.hIndex?.[0] || null,
      // Raw data for advanced usage
      rawData: data,
    };
  } catch (error) {
    console.error('❌ Resume fetch error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to load resume data');
  }
};

// ─── STATISTICS ONLY ───────────────────────────────────────────────────────────
/**
 * Get resume activity counts only (lighter payload)
 */
export const getResumeStatistics = async (userId) => {
  try {
    const response = await api.get(`${RESUME_API_BASE}/statistics/${userId}`);
    return response.data?.statistics || {};
  } catch (error) {
    console.error('Statistics fetch error:', error);
    return {
      certificationCourses: 0,
      recognitions: 0,
      resourcePerson: 0,
      eventsAttended: 0,
      seedMoney: 0,
      scholars: 0,
      patents: 0,
    };
  }
};

// ─── PROFILE IMAGE ─────────────────────────────────────────────────────────────
/**
 * Get staff profile image as base64
 */
export const getProfileImage = async (userId) => {
  try {
    const response = await api.get(`${RESUME_API_BASE}/profile-image/${userId}`);
    return response.data?.imageData || null;
  } catch (error) {
    console.warn('Profile image fetch failed:', error.message);
    return null;
  }
};

// ─── BATCH LOADING (for admin viewing multiple staff) ─────────────────────────
/**
 * Load statistics for multiple staff members (admin only)
 */
export const getMultipleStaffStats = async (userIds) => {
  const stats = {};
  try {
    const promises = userIds.map(userId => getResumeStatistics(userId).catch(() => null));
    const results = await Promise.all(promises);
    userIds.forEach((userId, index) => {
      stats[userId] = results[index] || {};
    });
    return stats;
  } catch (error) {
    console.error('Batch stats error:', error);
    return {};
  }
};

console.log('✅ ResumeService loaded - Ready to fetch staff activities!');

