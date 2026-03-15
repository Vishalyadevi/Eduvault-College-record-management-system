import API from "../../api";

/**
 * Submit a new activity
 */
export const submitActivity = async (formData) => {
  try {
    const response = await API.post(`/activity/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get all activities for current staff
 */
export const getStaffActivities = async () => {
  try {
    const response = await API.get(`/activity/staff`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get single activity by ID
 */
export const getActivityById = async (id) => {
  try {
    const response = await API.get(`/activity/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update activity
 */
export const updateActivity = async (id, formData) => {
  try {
    const response = await API.put(`/activity/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Delete activity
 */
export const deleteActivity = async (id) => {
  try {
    const response = await API.delete(`/activity/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin APIs

/**
 * Get all pending activities (Admin)
 */
export const getPendingActivities = async () => {
  try {
    const response = await API.get(`/admin/activity/pending`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get all activities with filters (Admin)
 */
export const getAllActivities = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await API.get(
      `/admin/activity/all${params ? '?' + params : ''}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get activity status count (Admin)
 */
export const getActivityStatusCount = async () => {
  try {
    const response = await API.get(`/admin/activity/status-count`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Approve activity (Admin)
 */
export const approveActivity = async (id) => {
  try {
    const response = await API.post(`/admin/activity/${id}/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Reject activity (Admin)
 */
export const rejectActivity = async (id, rejectionReason) => {
  try {
    const response = await API.post(`/admin/activity/${id}/reject`, {
      rejection_reason: rejectionReason,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
