import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { Lock, Mail, ChevronRight, AlertCircle, Loader2 } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useUser();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (!email || !password) {
                throw new Error("Please enter both email and password");
            }

            const response = await login(email, password);

            if (response && response.success) {
                const role = response.user?.role?.roleName?.toLowerCase() || 
                             localStorage.getItem('userRole')?.toLowerCase() || '';
                
                if (role === 'admin' || role === 'superadmin' || role === 'deptadmin') {
                    navigate('/records/admin');
                }
                else if (role === 'acadamicadmin') {
                    navigate('/admin/dashboard');
                } else if (role === 'staff' || role === 'faculty') {
                    navigate('/records/staff-dashboard');
                } else if (role === 'student') {
                    navigate('/records/student');
                } else {
                    navigate('/records/student');
                }
            }
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.response?.data?.details || err.response?.data?.message || err.message || "Failed to login. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-md w-full px-6 relative z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl p-10 rounded-3xl border border-slate-700/50 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 mb-6 shadow-lg shadow-indigo-500/20">
                            <Lock className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">EduVault</h1>
                        <p className="text-slate-400 font-medium">College Record Management System</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-3 text-red-400 text-sm">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="group">
                                <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl block pl-11 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                        placeholder="name@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <label className="text-sm font-semibold text-slate-300" htmlFor="password">
                                        Password
                                    </label>
                                    <Link
                                        to="/records/forget-password"
                                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl block pl-11 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In to Dashboard</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                    
                    <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
                        &copy; {new Date().getFullYear()} EduVault Systems. All Secure Access.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
