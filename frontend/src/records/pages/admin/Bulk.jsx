import React, { useState } from "react";
import axios from "axios";
import { FaCloudUploadAlt } from "react-icons/fa";
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

      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-blue-800 mb-6 text-center">
          Bulk User Upload
        </h2>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Upload an Excel/CSV file with user data. The file should include:
          </p>
          <ul className="text-sm text-gray-600 list-disc pl-5 mb-4">
            <li>username</li>
            <li>email</li>
            <li>role (Student/Staff)</li>
            <li>staffId (for both Students and Staff)</li>
            <li>For Students: registerNumber, departmentId, batch</li>
          </ul>
          <p className="text-xs text-gray-500">
            Max file size: 5MB. Duplicate emails will be skipped.
          </p>
        </div>

        {/* File Upload Section */}
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50 transition mb-4">
          <FaCloudUploadAlt className="text-indigo-600 text-4xl mb-3" />
          <span className="text-indigo-600 text-sm">
            {file ? file.name : "Click to upload file (CSV/XLSX)"}
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
          disabled={loading}
          className={`w-full mt-4 py-3 text-white rounded-lg transition ${loading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-indigo-500 hover:from-indigo-600 hover:to-indigo-600"
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            "Upload File"
          )}
        </button>
      </div>
    </div>
  );
};

export default Bulk;