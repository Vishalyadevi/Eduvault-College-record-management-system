import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import config from "../../config";
import { toast } from "react-toastify";

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    role: "",
    username: "",
    profileImage: "",
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const backendUrl = config.backendUrl || "http://localhost:4000";

  useEffect(() => {
    const fetchCurrentUserDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          setIsLoggedIn(false);
          return;
        }

        setIsLoggedIn(true);

        const response = await axios.get(`${backendUrl}/api/get-user/${userId}`);

        if (response.data.success) {
          setCurrentUser({
            role: response.data.user.role,
            username: response.data.user.username,
            profileImage: response.data.user.profileImage,
          });
        } else {
          toast.error("Failed to fetch user details");
        }
      } catch (error) {
        toast.error("Error fetching user details");
        console.error(error);
      }
    };

    fetchCurrentUserDetails();
  }, []);

  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  if (!isLoggedIn) return null;

  return (
    <div className="fixed top-0 left-0 w-full flex justify-between items-center px-4 sm:px-8 py-3 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <img
          className="w-36 sm:w-40 cursor-pointer hover:opacity-80 transition-opacity"
          src={logo}
          alt="admin-logo"
        />
        <p className="border px-3 py-1 rounded-full border-gray-400 text-gray-600 text-sm font-medium bg-gray-50">
          {currentUser.role || "Loading..."}
        </p>
      </div>

      <div className="relative">
        {(() => {
            const src = currentUser.profileImage
              ? currentUser.profileImage.startsWith("/")
                ? `${backendUrl}${currentUser.profileImage}`
                : currentUser.profileImage
              : "/uploads/default.jpg";
            return (
              <img
                src={src}
                alt="profile"
                className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                onClick={() => setShowDropdown(!showDropdown)}
              />
            );
          })()}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <button
              className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => navigate("/records/profile")}
            >
              My Profile
            </button>
            <button
              className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                toast.success("Logged out successfully");
                setIsLoggedIn(false);
                navigate("/");
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;