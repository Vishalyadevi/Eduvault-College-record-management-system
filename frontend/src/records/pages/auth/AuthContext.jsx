import { createContext, useContext, useEffect, useState } from "react";
import API from "../../../api";
import { setCurrentUser } from "../../services/authService";

const AuthContext = createContext(null);

const sanitizeUser = (user = {}) => ({
  userId: user.userId ?? user.id ?? null,
  id: user.id ?? user.userId ?? null,
  username: user.username ?? user.userName ?? null,
  userName: user.userName ?? user.username ?? null,
  staffId: user.staffId ?? null,
  departmentId: user.departmentId ?? null,
  role: typeof user.role === "string" ? user.role : null,
  profileImage: user.profileImage ?? user.profileimage ?? user.profile_image ?? null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      // 1. Get basic info from /auth/me
      const { data } = await API.get("/auth/me");
      const me = data.user || data;

      // 2. Safely fetch profile info if userId exists
      const userId = me.userId || me.id;
      let profile = {};
      if (userId) {
        try {
          const { data: profileResponse } = await API.get(`/auth/get-user/${userId}`);
          profile = profileResponse.user || profileResponse;
        } catch (profileErr) {
          console.warn("Profile detail fetch warning (using basic info):", profileErr.message);
        }
      }

      const merged = {
        ...me,      // Start with basic info (id, userId, role)
        ...profile, // Add full profile details (username, email, image)
        role: me.role ? String(me.role) : (profile.role ? String(profile.role) : null),
      };
      const safeUser = sanitizeUser(merged);

      setUser(safeUser);
      setCurrentUser(safeUser);
      if (safeUser && (safeUser.userId || safeUser.id)) {
        localStorage.setItem('user', JSON.stringify(safeUser));
        localStorage.setItem('token', 'session_active');
      }
      return safeUser;
    } catch (error) {
      console.error("Auth Refresh Error:", error);
      setUser(null);
      setCurrentUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const path = window.location.pathname;
    const isPublicAuthPath =
      path === "/login" ||
      path.startsWith("/records/login") ||
      path.startsWith("/placement/login") ||
      path.startsWith("/records/forgot-password") ||
      path.startsWith("/records/reset-password");

    if (!isPublicAuthPath) {
      refresh();
    } else {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.warn("Logout error (ignored):", error.message);
    } finally {
      localStorage.clear();
      setUser(null);
      setCurrentUser(null);
      window.location.href = "/records/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refresh, setUser, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
