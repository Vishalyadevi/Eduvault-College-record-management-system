import React, { useState, useEffect } from 'react';
import { GraduationCap, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/nec1.jpg';
import sideImage from '../assets/nec2.jpg';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null); // For debugging info
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Debug function to check stored token
  const checkToken = () => {
    const token = localStorage.getItem('token');
    console.log('Current token:', token ? 'Present' : 'Not found');
    setDebugInfo({
      tokenExists: !!token,
      tokenPreview: token ? `${token.substring(0, 15)}...` : null,
      timestamp: new Date().toISOString()
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDebugInfo(null);
    
    // Form validation with trimmed values
    const trimmedUsername = username.trim();
    const trimmedPassword = password;
    
    if (!trimmedUsername) {
      setError('Username is required');
      return;
    }
    
    if (!trimmedPassword) {
      setError('Password is required');
      return;
    }
    
    try {
      // Clear localStorage before attempting login
      localStorage.removeItem('token');
      
      console.log('Submitting login form for user:', trimmedUsername); // Debug log
      setLoading(true);
      
      const success = await login(trimmedUsername, trimmedPassword);
      console.log('Login result:', success); // Debug log
      
      // Check token immediately after login attempt
      checkToken();
      
      if (!success) {
        console.log('Login failed - setting error message'); // Debug log
        setError('Invalid username or password. Please try again.');
      } else {
        console.log('Login successful, redirect should occur'); // Debug log
        // Redirect will happen automatically through the useEffect
      }
    } catch (err) {
      console.error('Login error in component:', err);
      setError(`Login failed: ${err.message || 'Unknown error'}`);
      setDebugInfo({
        error: true,
        message: err.message,
        type: err.name
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-500 to-primary-700 p-4" 
         style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl overflow-hidden shadow-xl w-full max-w-4xl flex">
        {/* Left side (image) */}
        <div className="hidden md:block md:w-1/2 bg-cover bg-center" 
          style={{ backgroundImage: `url(${sideImage})` }}>
          {/* Using asset image */}
        </div>
        
        {/* Right side (form) */}
        <div className="w-full md:w-1/2 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4">
              <GraduationCap size={32} className="text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">Faculty Portal</h1>
            <p className="text-white text-opacity-80">Sign in to your account</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="text-gray-500" size={18} />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 w-full p-3 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="text-gray-500" size={18} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 w-full p-3 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              
              <div className="text-center">
                <a href="#" className="text-white hover:underline text-sm">
                  Forgot your password?
                </a>
              </div>
            </div>
          </form>
          
          {debugInfo && (
            <div className="mt-4 p-3 bg-black bg-opacity-50 rounded text-white text-xs">
              <div className="font-bold mb-1">Debug Info:</div>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;