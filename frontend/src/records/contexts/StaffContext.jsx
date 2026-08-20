import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../../api";
import { toast } from "react-toastify";
import { useAuth } from "../pages/auth/AuthContext";

const StaffContext = createContext();

export const StaffProvider = ({ children }) => {
  const [staffs, setStaffs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userRole = user?.role;
      const userDeptId = user?.departmentId;

      // Fetch departments first
      const deptRes = await API.get("/departments");
      let allDepartments = deptRes.data || [];

      // Fetch staff data
      const staffRes = await API.get("/staffs");
      let allStaffs = staffRes.data || [];

      // Filter based on user role
      if (userRole === "DeptAdmin" && userDeptId) {
        const deptIdNum = parseInt(userDeptId);
        allStaffs = allStaffs.filter(staff => staff.Deptid === deptIdNum);
        allDepartments = allDepartments.filter(dept => dept.Deptid === deptIdNum);
      }

      setStaffs(allStaffs);
      setDepartments(allDepartments);
    } catch (err) {
      console.error("Error fetching staff/dept data:", err);
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        toast.error("Failed to load staff data");
      }
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const path = window.location.pathname;
    const isRecordsPath = path.startsWith("/records");
    if (!isRecordsPath || !user) return;

    fetchData();
  }, [fetchData]);

  return (
    <StaffContext.Provider value={{ staffs, departments, loading, error, setStaffs, fetchData }}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => useContext(StaffContext);
