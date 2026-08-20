import React, { useState } from "react";
import axios from "axios";
import { FaCloudUploadAlt, FaDownload } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Bulk = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      toast.error("No file selected.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File is too large! Please upload a file smaller than 5MB.");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:4000/api/bulk/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Show success message
      toast.success(response.data.message);

      // If there are duplicates in the file itself
      if (response.data.duplicates) {
        toast.warning(
          <div>
            <p>Duplicate emails found within the file:</p>
            <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {response.data.duplicates.map((email, index) => (
                <li key={index}>{email}</li>
              ))}
            </ul>
          </div>,
          { autoClose: 15000 } // Keep this toast open longer
        );
      }
    } catch (error) {
      if (error.response) {
        // Handle server response errors
        if (error.response.data.error) {
          if (error.response.data.duplicates) {
            // Show duplicates in a special toast
            toast.error(
              <div>
                <p>{error.response.data.error}</p>
                <p>Duplicate emails found:</p>
                <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {error.response.data.duplicates.map((email, index) => (
                    <li key={index}>{email}</li>
                  ))}
                </ul>
              </div>,
              { autoClose: 15000 }
            );
          } else {
            toast.error(error.response.data.error);
          }
        } else {
          toast.error("Upload failed. Please try again.");
        }
      } else if (error.request) {
        toast.error("No response received from server. Please try again.");
      } else {
        toast.error("Upload failed. Please try again.");
      }
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = (type) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let headers = "";
    let rowData = "";

    if (type === "staff") {
      headers = "userName,userMail,userNumber,role,departmentId\n";
      rowData = "John Doe,johndoe@college.edu,STF001,Staff,1\nJane Smith,janesmith@college.edu,STF002,Staff,2";
    } else if (type === "student") {
      headers = "userName,userMail,userNumber,role,departmentId,tutorNumber,batch,semester\n";
      rowData = "Alice Brown,alice@college.edu,REG1001,Student,1,STF001,2026,3\nBob White,bob@college.edu,REG1002,Student,2,STF002,2025,5";
    }

    csvContent += headers + rowData;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sample_${type}_upload.csv`);
    document.body.appendChild(link); // Required for Firefox
    link.click();
    link.remove();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-50 to-indigo-50 p-6">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ width: "500px" }}
      />

      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl flex flex-col items-center">
        <h2 className="text-3xl font-extrabold text-indigo-900 mb-6 text-center">
          Bulk User Upload
        </h2>

        <div className="w-full bg-indigo-50/50 rounded-xl p-6 border border-indigo-100 mb-8">
          <p className="text-indigo-900 font-semibold mb-3">
            Download Sample Excel/CSV Templates
          </p>
          <p className="text-sm text-indigo-700/80 mb-4">
            To ensure successful upload, please use one of our provided templates with the exact required columns before uploading below. 
            The columns match exactly what you see in the "Add User" form.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button 
              onClick={() => downloadSample('staff')}
              className="flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 py-2 px-4 rounded-lg font-medium transition-colors w-full shadow-sm"
            >
              <FaDownload /> Sample Staff CSV
            </button>
            <button 
              onClick={() => downloadSample('student')}
              className="flex items-center justify-center gap-2 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 py-2 px-4 rounded-lg font-medium transition-colors w-full shadow-sm"
            >
              <FaDownload /> Sample Student CSV
            </button>
          </div>
          
          <div className="text-sm text-gray-700">
            <strong>Key Requirements:</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>userName, userMail, userNumber, role</strong> are required for everyone.</li>
              <li><strong>role</strong> must be strictly <span className="text-pink-600 font-semibold">'Staff'</span> or <span className="text-pink-600 font-semibold">'Student'</span>.</li>
              <li><strong>tutorNumber, batch, semester</strong> are required only for Students.</li>
              <li><strong>tutorNumber</strong> must match an existing Staff's userNumber.</li>
            </ul>
          </div>
        </div>

        {/* File Upload Section */}
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-indigo-300 bg-indigo-50/30 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors mb-6 group">
          <div className="p-4 bg-indigo-100/50 rounded-full group-hover:bg-indigo-200/50 transition-colors mb-3">
            <FaCloudUploadAlt className="text-indigo-600 text-5xl" />
          </div>
          <span className="text-indigo-800 font-medium text-lg mb-1">
            {file ? file.name : "Select to upload file"}
          </span>
          <span className="text-sm text-indigo-500">
            CSV, XLSX, or XLS (Max 5MB)
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-md ${loading || !file
              ? "bg-slate-300 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:-translate-y-0.5"
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Upload...
            </span>
          ) : (
            "Upload Users"
          )}
        </button>
      </div>
    </div>
  );
};

export default Bulk;