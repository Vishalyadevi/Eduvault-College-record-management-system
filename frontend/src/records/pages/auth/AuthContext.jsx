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

      // 2. Get full profile info (using me.userId or me.id)
      const userId = me.userId || me.id;
      if (!userId) {
        throw new Error("User ID missing from authentication response");
      }

      const { data: profileResponse } = await API.get(`/get-user/${userId}`);
      const profile = profileResponse.user || profileResponse;

      const merged = {
        ...me,      // Start with basic info (id, userId, role)
        ...profile, // Add full profile details (username, email, image)
        // Ensure role is normalized to lowercase
        role: me.role ? me.role.toLowerCase() : profile.role?.toLowerCase(),
      };
      const safeUser = sanitizeUser(merged);

      setUser(safeUser);
      setCurrentUser(safeUser);
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
    refresh();
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
