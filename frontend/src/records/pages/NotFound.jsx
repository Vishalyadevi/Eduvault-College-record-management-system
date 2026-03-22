import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center mx-4">
        <div className="w-24 h-24 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-indigo-600">404</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/records/profile')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Go to Profile
          </button>
          <Link
            to="/records/login"
            className="border-2 border-indigo-600 hover:bg-indigo-600 text-indigo-600 hover:text-white font-medium py-3 px-8 rounded-2xl transition-all duration-200"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

