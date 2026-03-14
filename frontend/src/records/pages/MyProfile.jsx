import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaKey, FaSave, FaPlus, FaUser, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import config from "../../config";

const MyProfile = () => {
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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const backendUrl = config.backendUrl;
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (!userId) {
          toast.error("Session expired. Please log in again.");
          navigate("/records/login");
          return;
        }

        const response = await API.get(`/get-user/${userId}`);

        if (response.data.success) {
          setUser({
            username: response.data.user.username,
            email: response.data.user.email,
            role: response.data.user.role,
            profileImage: response.data.user.profileImage
              ? `${backendUrl}${response.data.user.profileImage}`
              : "https://via.placeholder.com/150",
          });
        } else {
          toast.error("Failed to fetch user details.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);

        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
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
      setLoading(false);
      navigate("/records/login");
    }
  }, [userId, navigate]);

  // Handle image selection and preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, or GIF)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setNewImage(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setEditImage(true);
    }
  };

  // Update profile (image & password)
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

    if (!editImage && !editPassword) {
      toast.info("No changes to update!");
      return;
    }

    const formData = new FormData();
    if (newImage) formData.append("image", newImage);
    if (editPassword && newPassword) formData.append("password", newPassword);

    try {
      setUpdating(true);

      if (!userId) {
        toast.error("Session expired. Please login again.");
        navigate("/records/login");
        return;
      }

      const response = await API.put(
        `/update-profile/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setEditImage(false);
        setEditPassword(false);
        setNewPassword("");
        setConfirmPassword("");
        setNewImage(null);
        setPreviewImage("");

        // Update profile image on success
        setUser((prev) => ({
          ...prev,
          profileImage: response.data.profileImage
            ? `${backendUrl}${response.data.profileImage}`
            : prev.profileImage,
        }));
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        navigate("/records/login");
      } else {
        toast.error(error.response?.data?.message || "Failed to update profile.");
      }
    } finally {
      setUpdating(false);
    }
  };

  // Navigate to BioData page
  const handleNavigateToBioData = () => {
    if (user.role?.toLowerCase() === "student") {
      navigate(`/records/student-biodata/${userId}`);
    } else {
      navigate(`/records/staff-biodata/${userId}`);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditImage(false);
    setEditPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setNewImage(null);
    setPreviewImage("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-indigo-600">
        <div className="text-center text-white">
          <FaSpinner className="animate-spin text-5xl mx-auto mb-4" />
          <p className="text-xl font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-600 p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center">

        {/* Profile Image Section */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <img
            src={previewImage || user.profileImage}
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto border-4 border-indigo-200 object-cover"
          />
          <div
            className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-600 transition-colors shadow-lg"
            onClick={() => document.getElementById("fileInput").click()}
            title="Change profile picture"
          >
            <FaPlus className="text-white text-lg" />
          </div>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* User Info */}
        <h2 className="text-2xl font-semibold mb-2">{user.username || "Loading..."}</h2>
        <p className="text-gray-600 mb-2">{user.email || "Loading..."}</p>
        <p className="bg-gray-200 px-4 py-1 rounded-full text-sm text-gray-700 inline-block">
          {user.role || "Loading..."}
        </p>

        {/* Bio Data Button (Visible only for students) */}
        {user.role?.toLowerCase() === "student" && (
          <button
            className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-full mt-4 hover:bg-green-600 transition-colors w-full"
            onClick={handleNavigateToBioData}
          >
            <FaUser className="text-white" />
            <span>View Bio Data</span>
          </button>
        )}

        {/* Password Update Section */}
        <div className="mt-8">
          <button
            className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-600 transition-colors w-full"
            onClick={() => setEditPassword(!editPassword)}
          >
            <FaKey className="text-white" />
            <span>{editPassword ? "Cancel Password Change" : "Change Password"}</span>
          </button>

          {editPassword && (
            <div className="mt-4 space-y-4">
              <input
                type="password"
                placeholder="New Password (min 6 characters)"
                className="border p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="border p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </div>
          )}
        </div>

        {/* Bio Data Button (Visible for staff) */}
        {user.role?.toLowerCase() !== "student" && (
          <button
            className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-full mt-4 hover:bg-green-600 transition-colors w-full"
            onClick={handleNavigateToBioData}
          >
            <FaUser className="text-white" />
            <span>View Bio Data</span>
          </button>
        )}

        {/* Action Buttons (Visible only in editable mode) */}
        {(editImage || editPassword) && (
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleCancelEdit}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
              disabled={updating}
            >
              <span>Cancel</span>
            </button>
            <button
              onClick={handleUpdateProfile}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={updating}
            >
              {updating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;