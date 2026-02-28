import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem("accessToken", data.data.accessToken);
          localStorage.setItem("refreshToken", data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Exercises
export const exercisesApi = {
  list: (params?: Record<string, any>) => api.get("/exercises", { params }),
  get: (id: number) => api.get(`/exercises/${id}`),
  getTemplate: (id: number, lang: string) =>
    api.get(`/exercises/${id}/template/${lang}`),
};

// Submissions
export const submissionsApi = {
  submit: (data: { exerciseId: number; language: string; code: string }) =>
    api.post("/submissions", data),
  list: (params?: Record<string, any>) => api.get("/submissions", { params }),
  get: (id: number) => api.get(`/submissions/${id}`),
};

// Progress
export const progressApi = {
  overview: () => api.get("/progress/overview"),
  stats: () => api.get("/progress/stats"),
  exercise: (exerciseId: number) => api.get(`/progress/exercise/${exerciseId}`),
};

// Daily
export const dailyApi = {
  today: () => api.get("/daily/today"),
  history: () => api.get("/daily/history"),
};
