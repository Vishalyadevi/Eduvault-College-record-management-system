import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Users, Mail, Lock } from 'lucide-react';

function Login() {
  const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center" style={{ backgroundImage: "url('https://lms.nec.edu.in/pluginfile.php/1/theme_academi/slide2image/1739862648/Trone-Photo-copy-e1688730856904.jpg')" }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl relative z-10">

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-2 shadow-inner">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('student')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === 'student'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-transparent text-blue-600 hover:bg-blue-50'
                }`}
              >
                <GraduationCap size={20} />
                <span>Student</span>
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === 'staff'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-transparent text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Users size={20} />
                <span>Staff</span>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={tabVariants}
            transition={{ duration: 0.3 }}
          >
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">
                  {activeTab === 'student' ? 'Student Email' : 'Staff Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={20} />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-blue-200"
                    placeholder={`Enter your ${activeTab} email`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={20} />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-blue-200"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white text-blue-600 font-semibold py-3 rounded-lg shadow-lg hover:bg-blue-50 transition-colors duration-300"
              >
                Login
              </motion.button>

              <div className="text-center">
                <a href="#" className="text-sm text-white/80 hover:text-white transition-colors duration-300">
                  Forgot password?
                </a>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Login;
