import React, { useState, useEffect } from "react";
import { FaSave, FaSpinner, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../../../api";
import { useAuth } from "../auth/AuthContext";

const StudentMarksheets = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Semester");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState([]);

  // Initialize default rows if no data exists
  const semesters = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);
  const personalCerts = ["Birth Certificate", "10th Marksheet", "12th Marksheet", "Transfer Certificate", "Community Certificate", "Aadhar Card", "Nativity Certificate", "Income Certificate"];

  useEffect(() => {
    const fetchMarksheets = async () => {
      try {
        setLoading(true);
        const userId = user?.userId || user?.id || localStorage.getItem("userId");
        if (!userId) return;

        const response = await API.get(`/student/marksheets/${userId}`);
        if (response.data.success) {
          setData(response.data.marksheets);
        }
      } catch (error) {
        console.error("Error fetching marksheets:", error);
        toast.error("Failed to load marksheet data");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchMarksheets();
  }, [user]);

  const getRecord = (name, category) => {
    return data.find(d => d.marksheetName === name && d.category === category) || {
      marksheetName: name,
      category: category,
      receivedStatus: false,
      issueDate: "",
      certificateNumber: ""
    };
  };

  const handleStatusChange = (name, category, status) => {
    const existingIndex = data.findIndex(d => d.marksheetName === name && d.category === category);
    const newData = [...data];

    if (existingIndex > -1) {
      newData[existingIndex] = { ...newData[existingIndex], receivedStatus: status };
    } else {
      newData.push({
        marksheetName: name,
        category: category,
        receivedStatus: status,
        issueDate: "",
        certificateNumber: ""
      });
    }
    setData(newData);
  };

  const handleInputChange = (name, category, field, value) => {
    const existingIndex = data.findIndex(d => d.marksheetName === name && d.category === category);
    const newData = [...data];

    if (existingIndex > -1) {
      newData[existingIndex] = { ...newData[existingIndex], [field]: value };
    } else {
      newData.push({
        marksheetName: name,
        category: category,
        receivedStatus: true,
        [field]: value
      });
    }
    setData(newData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = user?.userId || user?.id || localStorage.getItem("userId");

      const response = await API.post("/student/marksheets/update", {
        userId,
        marksheets: data
      });

      if (response.data.success) {
        toast.success("Marksheets updated successfully!");
      }
    } catch (error) {
      console.error("Error saving marksheets:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const currentList = activeTab === "Semester" ? semesters : personalCerts;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Marksheets & Certificates</h2>

        {/* Tab Navigation (Styled like user request) */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("Semester")}
            className={`px-8 py-3 rounded-lg font-bold transition-all shadow-md ${activeTab === "Semester"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Semester Marksheet
          </button>
          <button
            onClick={() => setActiveTab("Personal")}
            className={`px-8 py-3 rounded-lg font-bold transition-all shadow-md ${activeTab === "Personal"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Personal Certificates
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-indigo-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50 text-indigo-900 uppercase text-sm font-black tracking-wider">
                  <th className="px-6 py-4 border-b">
                    {activeTab === "Semester" ? "Semester" : "Certificate Name"}
                  </th>
                  <th className="px-6 py-4 border-b text-center">Received</th>
                  <th className="px-6 py-4 border-b text-center">Not Received</th>
                  {activeTab === "Semester" && (
                    <>
                      <th className="px-6 py-4 border-b">Issue Date</th>
                      <th className="px-6 py-4 border-b">Certificate Number</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentList.map((name) => {
                  const record = getRecord(name, activeTab);
                  return (
                    <tr key={name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-700">{name}</td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="radio"
                          name={`status-${name}`}
                          checked={record.receivedStatus === true}
                          onChange={() => handleStatusChange(name, activeTab, true)}
                          className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="radio"
                          name={`status-${name}`}
                          checked={record.receivedStatus === false}
                          onChange={() => handleStatusChange(name, activeTab, false)}
                          className="w-5 h-5 text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                      </td>
                      {activeTab === "Semester" && (
                        <>
                          <td className="px-6 py-4">
                            {record.receivedStatus && (
                              <input
                                type="date"
                                value={record.issueDate ? new Date(record.issueDate).toISOString().split('T')[0] : ""}
                                onChange={(e) => handleInputChange(name, activeTab, "issueDate", e.target.value)}
                                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {record.receivedStatus && (
                              <input
                                type="text"
                                placeholder="Enter #No"
                                value={record.certificateNumber || ""}
                                onChange={(e) => handleInputChange(name, activeTab, "certificateNumber", e.target.value)}
                                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-6 bg-gray-50 border-t flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                <span>{saving ? "Saving Changes..." : "Save All Records"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMarksheets;
