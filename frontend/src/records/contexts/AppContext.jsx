import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const backendUrl = "http://localhost:4000";
  const [departments, setDepartments] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, staffRes] = await Promise.all([
          axios.get(`${backendUrl}/api/departments`),
          axios.get(`${backendUrl}/api/get-staff`, { params: { role: "Staff" } }),
        ]);

        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
        //console.log("Departments:", deptRes.data);
        setStaffs(staffRes.data.staff || []);
      } catch (error) {
        toast.error("Error fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <AppContext.Provider value={{ backendUrl, departments, staffs, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);