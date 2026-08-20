import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../../records/components/Sidebar';
import { useAuth } from '../pages/auth/AuthContext';

const StudentLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if ((user?.role || '').toLowerCase() !== 'student') {
    return <Navigate to="/records/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen p-8">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
