import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaKey, FaSave, FaUser, FaSpinner, FaImage } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import config from "../../config";
import { useAuth } from "./auth/AuthContext";
import StudentBioData from "./Student/StudentBioData";
import StaffBioData from "./StaffPage/StaffBioData";

const MyProfile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState({
    username: "",
    email: "",
    role: "",
    profileImage: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [editImage, setEditImage] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [showBioData, setShowBioData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const backendUrl = config.backendUrl;
  const userId = authUser?.userId || authUser?.id || localStorage.getItem("userId");
  const navigate = useNavigate();

  // Helper to stringify role safely
  const getRoleString = (role) => {
    if (!role) return "";
    if (typeof role === "string") return role;
    if (typeof role === "object") return role.roleName || role.name || JSON.stringify(role);
    return String(role);
  };

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (!userId) {
          console.error("No userId found for profile fetch");
          setLoading(false);
          return;
        }

        const response = await API.get(`/get-user/${userId}`);

        if (response.data.success) {
          const userData = response.data.user;
          const roleStr = getRoleString(userData.role);
          
          setUser({
            username: userData.username || "",
            email: userData.email || "",
            role: roleStr,
            profileImage: userData.profileImage
              ? `${backendUrl}${userData.profileImage}`
              : "https://via.placeholder.com/150",
          });
        } else {
          toast.error("Failed to fetch user details.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          navigate("/records/login");
        } else {
          toast.error("Error fetching user details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetails();
    } else {
      // Don't instantly redirect to dashboard, just mark loaded
      // The ProtectedRoute handles the actual auth redirect
      setLoading(false);
    }
  }, [userId, navigate, backendUrl]);

  // Handle image selection and preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setNewImage(file);
      setPreviewImage(URL.createObjectURL(file));
      setEditImage(true);
    }
  };

  const handleUpdateProfile = async () => {
    if (editPassword) {
      if (!newPassword || !confirmPassword) {
        toast.error("Please fill in both password fields!");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match!");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long!");
        return;
      }
    }

    const formData = new FormData();
    if (newImage) formData.append("image", newImage);
    if (editPassword && newPassword) formData.append("password", newPassword);

    try {
      setUpdating(true);
      const response = await API.put(`/update-profile/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setEditImage(false);
        setEditPassword(false);
        setNewPassword("");
        setConfirmPassword("");
        setNewImage(null);
        setPreviewImage("");
        if (response.data.profileImage) {
          setUser(prev => ({ ...prev, profileImage: `${backendUrl}${response.data.profileImage}` }));
        }
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-indigo-600">
          <FaSpinner className="animate-spin text-5xl mx-auto mb-4" />
          <p className="text-xl font-semibold">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Final safeguarding for role check
  const isStudent = user.role?.toLowerCase()?.includes("student");

  return (
    <div className="flex flex-col items-center py-10 px-4 w-full">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center mb-8 border border-gray-100">
        
        <div className="relative w-32 h-32 mx-auto mb-4 group">
          <img
            src={previewImage || user.profileImage}
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto border-4 border-indigo-50 object-cover shadow-md transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <button
          className="flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-6 py-2.5 rounded-xl mx-auto mb-6 text-sm font-bold transition-all border border-indigo-100 hover:shadow-sm"
          onClick={() => document.getElementById("fileInput").click()}
        >
          <FaImage className="text-lg" />
          <span>Change Profile image</span>
        </button>
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{user.username || "User"}</h2>
          <p className="text-gray-500 font-medium">{user.email}</p>
          <div className="pt-2">
            <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block shadow-sm">
              {user.role || "MEMBER"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className={`flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl transition-all w-full font-bold text-white shadow-md transform active:scale-95 ${
              showBioData ? 'bg-gray-800 hover:bg-gray-900' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Toggling BioData for userId:", userId, "isStudent:", isStudent);
              setShowBioData(!showBioData);
            }}
          >
            <FaUser className="text-white" />
            <span>
              {showBioData ? "Hide Details" : (isStudent ? "Student BIO data" : "Staff BIO data")}
            </span>
          </button>

          <button
            className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3.5 rounded-xl hover:bg-indigo-700 transition-all w-full font-bold shadow-md transform active:scale-95"
            onClick={() => setEditPassword(!editPassword)}
          >
            <FaKey className="text-white" />
            <span>{editPassword ? "Cancel Change" : "Update Password"}</span>
          </button>
        </div>

        {editPassword && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">New Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                className="bg-white border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat password"
                className="bg-white border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        )}

        {(editImage || editPassword) && (
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => { setEditImage(false); setEditPassword(false); setPreviewImage(""); }}
              className="flex-1 bg-gray-100 text-gray-600 font-bold px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateProfile}
              className="flex-1 bg-indigo-600 text-white font-bold px-4 py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={updating}
            >
              {updating ? <FaSpinner className="animate-spin" /> : <FaSave />}
              <span>{updating ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        )}
      </div>

      {showBioData && (
        <div className="w-full max-w-6xl animate-scaleIn mt-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {isStudent ? (
              <StudentBioData userId={userId} />
          ) : (
              <StaffBioData userId={userId} />
          )}
        </div>
      )}
    </div>
  );
};

export default MyProfile;