import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../../api";
import { toast } from "react-toastify";
import { useAuth } from "../pages/auth/AuthContext";

const CertificateContext = createContext();

export const CertificateProvider = ({ children }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  const fetchCertificates = useCallback(async () => {
    if (!UserId) return;

    try {
      const response = await API.get("/student-certificate/list");

      console.log("Certificates Response:", response.data);
      setCertificates(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError(err.message);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  const uploadCertificate = useCallback(async (file, certificateType, certificateName) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("certificate", file);
      formData.append("certificate_type", certificateType);
      formData.append("certificate_name", certificateName || file.name);

      const response = await API.post("/student-certificate/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload response:", response.data);
      setCertificates((prev) => [...prev, response.data]);
      toast.success("Certificate uploaded successfully!");
      return response.data;
    } catch (err) {
      console.error("Error uploading certificate:", err);
      setError(err.message);
      toast.error("Failed to upload certificate.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCertificate = useCallback(async (id) => {
    setLoading(true);

    try {
      await API.delete(`/student-certificate/delete/${id}`);

      setCertificates((prev) => prev.filter((cert) => cert.id !== id));
      toast.success("Certificate deleted successfully!");
    } catch (err) {
      console.error("Error deleting certificate:", err);
      setError(err.message);
      toast.error("Failed to delete certificate.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (UserId) {
      fetchCertificates();
    }
  }, [fetchCertificates, UserId]);

  return (
    <CertificateContext.Provider
      value={{
        certificates,
        loading,
        error,
        fetchCertificates,
        uploadCertificate,
        deleteCertificate,
      }}
    >
      {children}
    </CertificateContext.Provider>
  );
};

export const useCertificateContext = () => useContext(CertificateContext);