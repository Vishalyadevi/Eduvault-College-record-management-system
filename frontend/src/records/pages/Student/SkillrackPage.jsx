import React, { useState, useEffect } from "react";
import { FaCode, FaChartBar, FaTrophy, FaMedal, FaRocket, FaExclamationTriangle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSkillRack } from "../../contexts/SkillRackContext";
import { useAuth } from "../auth/AuthContext";


const StudentSkillRackPage = () => {
  const {
    myRecord,
    stats,
    leaderboard,
    loading,
    error,
    fetchMyRecord,
    fetchMyStats,
    fetchLeaderboard,
    clearError
  } = useSkillRack();

  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const userId = user?.userId || user?.id;


  useEffect(() => {
    if (userId) {
      fetchMyRecord(userId);
      fetchMyStats(userId);
    }
  }, [userId, fetchMyRecord, fetchMyStats]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard(50);
    }
  }, [activeTab, fetchLeaderboard]);

  const getLevelColor = (level) => {
    const colors = {
      1: 'bg-indigo-50 border-indigo-300 text-indigo-700',
      2: 'bg-green-50 border-green-300 text-green-700',
      3: 'bg-indigo-50 border-indigo-300 text-indigo-700',
      4: 'bg-orange-50 border-orange-300 text-orange-700',
      5: 'bg-red-50 border-red-300 text-red-700',
      6: 'bg-pink-50 border-pink-300 text-pink-700',
    };
    return colors[level] || 'bg-gray-50 border-gray-300 text-gray-700';
  };

  const getProgressPercentage = (value, max) => {
    if (!max || max === 0) return 0;
    return Math.min((value / max) * 100, 100);
  };

  const levelTargets = {
    level_2: 100,
    level_3: 250,
    level_4: 40,
    level_5: 100,
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
          My SkillRack Progress
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border-2 border-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 p-4 bg-indigo-100 text-indigo-700 rounded-lg text-center">
            Loading...
          </div>
        )}

        {!myRecord && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <FaExclamationTriangle className="text-yellow-600 text-6xl mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">No SkillRack Data Available</p>
            <p className="text-gray-500">Your tutor will upload your SkillRack progress soon</p>
          </div>
        )}

        {myRecord && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: FaRocket },
                { id: 'levels', label: 'Level Progress', icon: FaChartBar },
                { id: 'languages', label: 'Languages', icon: FaCode },
                { id: 'leaderboard', label: 'Leaderboard', icon: FaTrophy },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === tab.id ? 'bg-gradient-to-r from-indigo-600 to-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}>
                  <tab.icon />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <FaCode className="text-4xl opacity-80" />
                      <FaRocket className="text-2xl opacity-60" />
                    </div>
                    <p className="text-sm opacity-90 mb-1">Total Programs Solved</p>
                    <p className="text-5xl font-bold">{stats.totalPrograms}</p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <FaTrophy className="text-4xl opacity-80" />
                      <span className="text-2xl opacity-60">#</span>
                    </div>
                    <p className="text-sm opacity-90 mb-1">SkillRack Rank</p>
                    <p className="text-5xl font-bold">{stats.rank || 'N/A'}</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <FaMedal className="text-4xl opacity-80" />
                    </div>
                    <p className="text-sm opacity-90 mb-1">Bronze Medals</p>
                    <p className="text-5xl font-bold">{stats.medals}</p>
                  </div>
                </div>

                {/* Company Progress */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaRocket className="text-indigo-600" />
                    Company-Wise Programs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">MNC Companies</p>
                      <p className="text-sm text-gray-500 mb-2">(TCS/CTS/WIPRO/INFOSYS)</p>
                      <p className="text-4xl font-bold text-indigo-700">{stats.companyProgress.mnc}</p>
                    </div>
                    <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Product Companies</p>
                      <p className="text-sm text-gray-500 mb-2">(Higher Salary)</p>
                      <p className="text-4xl font-bold text-indigo-700">{stats.companyProgress.product}</p>
                    </div>
                    <div className="p-4 bg-pink-50 border-2 border-pink-300 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Dream Product Companies</p>
                      <p className="text-sm text-gray-500 mb-2">(Very High Salary)</p>
                      <p className="text-4xl font-bold text-pink-700">{stats.companyProgress.dream}</p>
                    </div>
                  </div>
                </div>

                {/* Tests & Tracks */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Tests & Tracks</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-gray-800">{stats.testsAndTracks.codeTests}</p>
                      <p className="text-xs text-gray-600 mt-1">Code Tests</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-gray-800">{stats.testsAndTracks.codeTracks}</p>
                      <p className="text-xs text-gray-600 mt-1">Code Tracks</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-gray-800">{stats.testsAndTracks.codeTutorial}</p>
                      <p className="text-xs text-gray-600 mt-1">Code Tutorial</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-gray-800">{stats.testsAndTracks.dailyChallenge}</p>
                      <p className="text-xs text-gray-600 mt-1">Daily Challenge</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-gray-800">{stats.testsAndTracks.dailyTest}</p>
                      <p className="text-xs text-gray-600 mt-1">Daily Test</p>
                    </div>
                  </div>
                </div>

                {/* Aptitude & DS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Aptitude Test Score</h3>
                    <div className="text-center p-6 bg-green-50 border-2 border-green-300 rounded-lg">
                      <p className="text-5xl font-bold text-green-700">{stats.aptitudeScore}%</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Structures</h3>
                    <div className="text-center p-6 bg-orange-50 border-2 border-orange-300 rounded-lg">
                      <p className="text-5xl font-bold text-orange-700">{stats.dataStructurePrograms}</p>
                      <p className="text-sm text-gray-600 mt-2">Programs Solved</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Levels Tab */}
            {activeTab === 'levels' && stats && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Level-wise Progress</h3>
                  <div className="space-y-4">
                    {Object.entries(stats.levelProgress).map(([level, count]) => {
                      const levelNum = parseInt(level.split('_')[1]);
                      const target = levelTargets[level] || 0;
                      const percentage = target > 0 ? getProgressPercentage(count, target) : 0;
                      const levelNames = {
                        1: 'Learn C, Java, Python, SQL, DS & DC/DT',
                        2: 'KICKSTART for Absolute Beginner',
                        3: 'MNC Companies (TCS/CTS/WIPRO/INFOSYS)',
                        4: 'Data Structures & Algorithms',
                        5: 'Product Companies (Higher Salary)',
                        6: 'Dream Product Companies & Mini Project',
                      };

                      return (
                        <div key={level} className={`p-4 border-2 rounded-lg ${getLevelColor(levelNum)}`}>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-semibold">Level {levelNum}</p>
                              <p className="text-xs opacity-75">{levelNames[levelNum]}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">{count}</p>
                              {target > 0 && <p className="text-xs">/ {target}</p>}
                            </div>
                          </div>
                          {target > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Languages Tab */}
            {activeTab === 'languages' && stats && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Programming Languages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(stats.languageDistribution).map(([lang, count]) => {
                      const langInfo = {
                        c: { name: 'C', color: 'from-indigo-500 to-indigo-600', icon: '🔷' },
                        cpp: { name: 'C++', color: 'from-indigo-500 to-indigo-600', icon: '🟣' },
                        java: { name: 'Java', color: 'from-red-500 to-red-600', icon: '☕' },
                        python: { name: 'Python', color: 'from-yellow-500 to-green-600', icon: '🐍' },
                        sql: { name: 'SQL', color: 'from-orange-500 to-orange-600', icon: '🗄️' },
                      };
                      const info = langInfo[lang];

                      return (
                        <div key={lang} className={`bg-gradient-to-br ${info.color} rounded-lg shadow-lg p-6 text-white`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-4xl">{info.icon}</span>
                          </div>
                          <p className="text-sm opacity-90 mb-1">{info.name}</p>
                          <p className="text-5xl font-bold">{count}</p>
                          <p className="text-xs opacity-75 mt-1">programs solved</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaTrophy className="text-yellow-600" />
                    Top 50 Performers
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left text-indigo-600">Rank</th>
                          <th className="p-3 text-left text-indigo-600">Reg No</th>
                          <th className="p-3 text-left text-indigo-600">Name</th>
                          <th className="p-3 text-right text-indigo-600">Programs</th>
                          <th className="p-3 text-right text-indigo-600">SR Rank</th>
                          <th className="p-3 text-right text-indigo-600">Medals</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((record, index) => (
                          <tr key={record.registerNumber || record.registerNumber} className={`border-b ${index < 3 ? 'bg-yellow-50' : ''}`}>
                            <td className="p-3">
                              {index === 0 && <span className="text-2xl">🥇</span>}
                              {index === 1 && <span className="text-2xl">🥈</span>}
                              {index === 2 && <span className="text-2xl">🥉</span>}
                              {index > 2 && <span className="font-semibold">{record.position}</span>}
                            </td>
                            <td className="p-3 font-mono">{record.registerNumber || record.registerNumber}</td>
                            <td className="p-3">{record.username}</td>
                            <td className="p-3 text-right font-bold">{record.totalPrograms}</td>
                            <td className="p-3 text-right">{record.rank || 'N/A'}</td>
                            <td className="p-3 text-right">{record.medals}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentSkillRackPage;