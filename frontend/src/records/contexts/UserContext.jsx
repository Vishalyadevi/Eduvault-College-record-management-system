import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';

// Create User Context
const UserContext = createContext();

// Custom Hook to use the User Context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

import API from '../../api';

// No need for a local api instance with its own interceptors,
// using the shared API from src/api which handles credentials and cookies.
const api = API;

// User Provider Component
export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Load user from localStorage on mount
  useEffect(() => {
    const initializeUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        console.log('🔍 Initializing user from localStorage');
        console.log('Has stored user:', !!storedUser);
        console.log('Has stored token:', !!storedToken);

        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUserState(parsedUser);
            setTokenState(storedToken);
            console.log('✅ User loaded from localStorage:', parsedUser.userName || parsedUser.userMail);
          } catch (parseError) {
            console.error('❌ Error parsing stored user:', parseError);
            localStorage.clear();
          }
        } else {
          console.log('ℹ️ No stored user/token found');
        }
      } catch (error) {
        console.error('❌ Error loading user from localStorage:', error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Function to update user state and localStorage
  const setUser = useCallback((newUser) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
      console.log('✅ User state updated:', newUser.userName || newUser.userMail);
    } else {
      localStorage.removeItem('user');
      console.log('ℹ️ User state cleared');
    }
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    console.log('\n========================================');
    console.log('🔐 LOGIN ATTEMPT FROM CONTEXT');
    console.log('========================================');
    console.log('Email:', email);

    try {
      // Make login request
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password
      });

      console.log('📥 Login response received:', response.data);

      // Validate response structure
      if (!response.data) {
        throw new Error('Empty response from server');
      }

      const { success, token, user: userData, message } = response.data;

      // Check if login was successful
      if (!success) {
        throw new Error(message || 'Login failed');
      }

      // Validate required data
      if (!token) {
        throw new Error('No token received from server');
      }

      if (!userData) {
        throw new Error('No user data received from server');
      }

      if (!userData.role || !userData.role.roleName) {
        throw new Error('Invalid user data: missing role information');
      }

      console.log('✅ Login successful');
      console.log('👤 User:', userData.userName || userData.userMail);
      console.log('🎭 Role:', userData.role.roleName);

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userId', userData.userId.toString());
      localStorage.setItem('userRole', userData.role.roleName);
      localStorage.setItem('roleId', userData.role.roleId.toString());
      localStorage.setItem('userImage', userData.profileImage || '/uploads/default.jpg');

      if (userData.department) {
        localStorage.setItem('departmentId', userData.department.departmentId.toString());
        localStorage.setItem('departmentName', userData.department.departmentName);
      }

      console.log('💾 Data stored in localStorage');

      // Update state
      setUserState(userData);
      setTokenState(token);

      console.log('✅ Context state updated');
      console.log('========================================\n');

      return response.data;

    } catch (error) {
      console.error('\n========================================');
      console.error('❌ LOGIN ERROR IN CONTEXT');
      console.error('========================================');

      if (error.response) {
        // Server responded with error
        console.error('Status:', error.response.status);
        console.error('Message:', error.response.data?.message);
        console.error('Data:', error.response.data);
      } else if (error.request) {
        // Request made but no response
        console.error('No response received from server');
        console.error('Request:', error.request);
      } else {
        // Error in setting up request
        console.error('Error:', error.message);
      }

      console.error('========================================\n');
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    console.log('👋 Logging out...');

    try {
      // Call logout endpoint (don't wait for it)
      api.post('/auth/logout').catch(err => {
        console.warn('Logout endpoint error (ignored):', err.message);
      });
    } catch (error) {
      console.warn('Logout error (ignored):', error.message);
    } finally {
      // Always clear local state
      console.log('🧹 Clearing local storage and state');
      localStorage.clear();
      setUserState(null);
      setTokenState(null);

      console.log('✅ Logout complete - redirecting to login');
      window.location.href = '/records/login';
    }
  }, []);

  // Get current user from server
  const fetchCurrentUser = useCallback(async () => {
    console.log('🔄 Fetching current user from server...');

    try {
      const response = await api.get('/auth/me');

      if (!response.data.success || !response.data.user) {
        throw new Error('Invalid response from server');
      }

      const userData = response.data.user;
      console.log('✅ Current user fetched:', userData.userName || userData.userMail);

      setUserState(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error('❌ Error fetching current user:', error.message);

      // If authentication failed, logout
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }

      throw error;
    }
  }, [logout]);

  // Update user profile
  const updateProfile = useCallback(async (userId, formData) => {
    console.log('🔄 Updating profile for user:', userId);

    try {
      const response = await api.put(`/auth/update-profile/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('✅ Profile updated successfully');

      // Update user state with new profile image
      if (response.data.profileImage) {
        setUserState((prev) => ({
          ...prev,
          profileImage: response.data.profileImage,
        }));
        localStorage.setItem('userImage', response.data.profileImage);
        console.log('🖼️ Profile image updated');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  }, []);

  // Fetch available roles
  const fetchRoles = useCallback(async () => {
    console.log('🔄 Fetching roles...');

    try {
      const response = await api.get('/admin/roles');
      const fetchedRoles = response.data.roles || [];

      setRoles(fetchedRoles);
      console.log('✅ Roles fetched:', fetchedRoles.length);

      return fetchedRoles;
    } catch (error) {
      console.error('❌ Error fetching roles:', error.message);
      return [];
    }
  }, []);

  // Fetch available departments
  const fetchDepartments = useCallback(async () => {
    console.log('🔄 Fetching departments...');

    try {
      const response = await api.get('/admin/departments');
      const fetchedDepartments = response.data.departments || [];

      setDepartments(fetchedDepartments);
      console.log('✅ Departments fetched:', fetchedDepartments.length);

      return fetchedDepartments;
    } catch (error) {
      console.error('❌ Error fetching departments:', error.message);
      return [];
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => {
    const authenticated = !!user && !!token;
    console.log('🔐 Authentication status:', authenticated);
    return authenticated;
  }, [user, token]);

  // Check if user has specific role
  const hasRole = useCallback(
    (rolesToCheck) => {
      if (!user || !user.role) {
        console.log('❌ hasRole: No user or role');
        return false;
      }

      const roleArray = Array.isArray(rolesToCheck) ? rolesToCheck : [rolesToCheck];
      const hasRequiredRole = roleArray.includes(user.role.roleName);

      console.log('🎭 hasRole check:', user.role.roleName, 'in', roleArray, '=', hasRequiredRole);

      return hasRequiredRole;
    },
    [user]
  );

  // Check if user is admin (any role with "Admin" in name)
  const isAdmin = useCallback(() => {
    if (!user || !user.role) {
      console.log('❌ isAdmin: No user or role');
      return false;
    }

    const adminStatus = user.role.roleName.includes('Admin');
    console.log('👑 isAdmin check:', user.role.roleName, '=', adminStatus);

    return adminStatus;
  }, [user]);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      user,
      token,
      setUser,
      login,
      logout,
      loading,
      isAuthenticated,
      hasRole,
      isAdmin,
      fetchCurrentUser,
      updateProfile,
      roles,
      departments,
      fetchRoles,
      fetchDepartments,
      api, // Export api instance for use in other components
    }),
    [
      user,
      token,
      setUser,
      login,
      logout,
      loading,
      isAuthenticated,
      hasRole,
      isAdmin,
      fetchCurrentUser,
      updateProfile,
      roles,
      departments,
      fetchRoles,
      fetchDepartments,
    ]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserProvider;