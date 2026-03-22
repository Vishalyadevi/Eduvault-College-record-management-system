import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Request Logger
API.interceptors.request.use((config) => {
  console.log(
    `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
    config.data || ""
  );
  return config;
});

let refreshPromise = null;

const isAuthPath = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/google-login") ||
  url.includes("/auth/me") ||
  url.includes("/auth/refresh") ||
  url.includes("/auth/logout") ||
  url.includes("/auth/forgot-password") ||
  url.includes("/auth/reset-password");

API.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`,
      response.status
    );
    return response;
  },
  async (error) => {
    console.error(
      `❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      error.message,
      error.response?.data
    );

    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (
      status !== 401 ||
      originalRequest._retry ||
      isAuthPath(originalRequest.url || "")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const pathname = window.location.pathname;

    const isPlacement = pathname.startsWith("/placement");
    const isRecords = pathname.startsWith("/records");
    const isAcadamic =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/student");

    const isPublicPath =
      pathname === "/" ||
      pathname === "/placement" ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/records/login") ||
      pathname.startsWith("/placement/login") ||
      pathname.startsWith("/records/forgot-password") ||
      pathname.startsWith("/records/reset-password") ||
      (!isPlacement && !isRecords && !isAcadamic);

    if (isPublicPath) {
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = API.post("/auth/refresh", {}).finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      return API(originalRequest);
    } catch (refreshError) {
      if (!isPublicPath) {
        if (isPlacement) {
          window.location.href = "/placement/login";
        } else if (isRecords) {
          window.location.href = "/records/login";
        } else if (isAcadamic) {
          window.location.href = "/records/login";
        }
      }

      return Promise.reject(refreshError);
    }
  }
);

export default API;