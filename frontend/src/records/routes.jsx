import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./pages/auth/AuthContext";

// Import pages
import LoginPage from "./pages/LoginPage";
import Login from "./pages/Login";
import MyProfile from "./pages/MyProfile";
import StaffBioData from "./pages/StaffPage/StaffBioData";
import StudentBioData from "./pages/Student/StudentBioData";
import ResetPassword from "./pages/ResetPassword";
import ForgetPassword from "./pages/ForgetPassword";

// Import layouts/components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import NotFound from "./pages/NotFound"; // Create if missing

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/records/login" replace />;
  }

  const userRole = user.role?.toLowerCase() || '';
  const isAllowed = allowedRoles.length === 0 || allowedRoles.some(role => 
    userRole.includes(role.toLowerCase())
  );

  if (!isAllowed) {
    return <Navigate to="/records/login" replace />;
  }

  return children;
};

// Main Layout
const MainLayout = ({ children }) => (
  <div className="flex h-screen bg-gray-100">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
        {children}
      </main>
    </div>
  </div>
);

const RecordsRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/records/login" element={<LoginPage />} />
      <Route path="/records/forget-password" element={<ForgetPassword />} />
      <Route path="/records/reset-password/:token" element={<ResetPassword />} />

      {/* Protected Profile Routes */}
      <Route 
        path="/records/profile" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyProfile />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/records/student-biodata/:userId" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentBioData />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/records/staff-biodata/:userId" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'faculty']}>
            <MainLayout>
              <MainLayout>
                <StaffBioData />
              </MainLayout>
            </ProtectedRoute>
          </ProtectedRoute>
        } 
      />

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RecordsRoutes;

