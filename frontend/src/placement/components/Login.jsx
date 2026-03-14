import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Mail, Briefcase } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "../../records/pages/auth/AuthContext";
import API from "../../api";
import "../styles/Login.css";

const InputField = ({ label, type = "text", icon: Icon, value, onChange, placeholder, showPassword, setShowPassword }) => (
    <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />}
            <input
                type={type === "password" && showPassword ? "text" : type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
                className={`w-full ${type === "password" ? "pl-12 pr-12" : "pl-12 pr-4"} py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all bg-gray-50 focus:bg-white`}
            />
            {type === "password" && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            )}
        </div>
    </div>
);

const Login = () => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user, refresh, loading } = useAuth();
    const navigate = useNavigate();

    const handleRedirect = (role) => {
        if (!role) {
            toast.error("No role assigned. Please contact support.");
            navigate("/not-found");
            return;
        }

        const r = role.toLowerCase().trim();

        // Placement Admin
        if (r === "placementadmin") {
            navigate("/placement/admin-recruiters");
            return;
        }

       

        // Staff / Teaching staff / Faculty variants
      

       

        // Fallback for unknown roles
        toast.warn(`Role "${role}" handled by default redirection.`);
        navigate("/");
    };

    useEffect(() => {
        const path = window.location.pathname;
        if (!loading && user && (path === "/placement/login" || path === "/login")) {
            handleRedirect(user.role);
        }
    }, [user, loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data } = await API.post("/auth/login", {
                identifier,
                password
            });

            if (data?.message || data?.user || data?.role || data?.token) {
                await refresh();           // This updates the user in context
                toast.success("Login Successful");
                // No need to call handleRedirect here; useEffect will handle it
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || "Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (resp) => {
        try {
            const { data } = await API.post("/auth/google-login", { token: resp.credential });
            if (!data?.message && !data?.user && !data?.role && !data?.token) {
                throw new Error("Google login failed");
            }
            await refresh();
            toast.success("Google Login Successful");
            // Again; useEffect will redirect based on role
        } catch (err) {
            toast.error(err.response?.data?.msg || "Google Login Failed");
        }
    };

    return (
        <div className="loginpage">
            <div className="center">
                <div className="container">
                    <div className="flex flex-col items-center mb-8">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl mb-4">
                            <Briefcase className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">NEC Placement Portal</h1>
                        <p className="text-gray-600 text-sm mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="text-left space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">UserEmail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Email "
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="text-left space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-12 pr-12 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            type="submit"
                            id="login"
                            className="w-full font-bold shadow-lg"
                        >
                            {isLoading ? "Authenticating..." : "Sign In"}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300/30"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-transparent text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="flex justify-center scale-95 hover:scale-100 transition-transform">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => toast.error("Google login failed")}
                                theme="filled_blue"
                                shape="pill"
                                size="large"
                                text="signin_with"
                                width="100%"
                            />
                        </div>
                    </form>

                    <p className="mt-8 text-sm text-gray-500">
                        Forgot your password? <span className="text-indigo-600 cursor-pointer font-medium hover:underline">Contact Admin</span>
                    </p>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={4000} theme="colored" />
        </div>
    );
};

export default Login;
