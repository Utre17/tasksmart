import axios from "axios";
import { Task, InsertTask, LoginUser, InsertUser } from "@shared/schema";

// Configure axios with interceptors for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login page if not already on the auth page
      localStorage.removeItem("token");
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

// Configure axios with auth token
const setAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

// Set auth header on initial load
setAuthHeader();

// Check if we're on the auth page
const isAuthPage = () => {
  return window.location.pathname === "/auth";
};

const api = {
  // Auth utils
  setAuthHeader,

  // Authentication
  register: async (userData: Omit<InsertUser, "id">): Promise<any> => {
    const response = await axios.post("/api/auth/register", userData);
    // Set token if returned
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      setAuthHeader();
    }
    return response.data;
  },

  login: async (credentials: LoginUser): Promise<any> => {
    const response = await axios.post("/api/auth/login", credentials);
    // Set token in local storage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      setAuthHeader();
    }
    return response.data;
  },

  // Verify Firebase token with backend
  loginWithToken: async (token: string): Promise<any> => {
    try {
      const response = await axios.post("/api/auth/login", { token });
      return response.data;
    } catch (error) {
      console.error("Error verifying token with backend:", error);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<any> => {
    // Skip authentication check on auth page
    if (isAuthPage()) {
      throw new Error("Not authenticated");
    }
    
    try {
      setAuthHeader(); // Make sure token is set before making request
      
      // First verify the token is valid
      await axios.get("/api/auth/verify");
      
      // Then get the user data
      const response = await axios.get("/api/auth/me");
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Call the backend to log out (if needed)
      await axios.post("/api/auth/logout");
    } catch (error) {
      // Even if server-side logout fails, clear local storage
      console.error("Error during logout:", error);
    } finally {
      localStorage.removeItem("token");
      setAuthHeader();
    }
  },

  // User Management (Admin)
  getAllUsers: async (): Promise<any[]> => {
    const response = await axios.get("/api/auth/users");
    return response.data;
  },

  getUserById: async (userId: string): Promise<any> => {
    const response = await axios.get(`/api/auth/users/${userId}`);
    return response.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<any> => {
    const response = await axios.patch(`/api/auth/users/${userId}/role`, { role });
    return response.data;
  },

  // Admin Analytics
  getAdminStats: async (): Promise<any> => {
    const response = await axios.get("/api/admin/stats");
    return response.data;
  },

  // User Analytics
  getUserAnalytics: async (): Promise<any> => {
    const response = await axios.get("/api/analytics/user");
    return response.data;
  },
  
  getTaskCompletionStats: async (): Promise<any> => {
    const response = await axios.get("/api/analytics/tasks/completion");
    return response.data;
  },
  
  getTasksByDate: async (period: string = "month"): Promise<any> => {
    const response = await axios.get(`/api/analytics/tasks/by-date?period=${period}`);
    return response.data;
  },
  
  getAIUsageStats: async (): Promise<any> => {
    const response = await axios.get("/api/analytics/ai-usage");
    return response.data;
  },

  // User Settings
  updateUserPassword: async (oldPassword: string, newPassword: string): Promise<any> => {
    const response = await axios.post("/api/auth/password", { oldPassword, newPassword });
    return response.data;
  },
  
  resetPassword: async (email: string, oldPassword: string, newPassword: string): Promise<any> => {
    const response = await axios.post("/api/auth/reset-password", { email, oldPassword, newPassword });
    return response.data;
  },
  
  simpleResetPassword: async (email: string, newPassword: string): Promise<any> => {
    const response = await axios.post("/api/auth/simple-reset-password", { email, newPassword });
    return response.data;
  },
  
  updateUserPreferences: async (preferences: any): Promise<any> => {
    const response = await axios.patch("/api/auth/preferences", preferences);
    return response.data;
  },
  
  getUserSessions: async (): Promise<any> => {
    const response = await axios.get("/api/auth/sessions");
    return response.data;
  },
  
  revokeSession: async (sessionId: string): Promise<any> => {
    const response = await axios.delete(`/api/auth/sessions/${sessionId}`);
    return response.data;
  },

  // Task CRUD operations
  getAllTasks: async (): Promise<Task[]> => {
    // Skip task fetching on auth page
    if (isAuthPage()) {
      return [];
    }
    const response = await axios.get("/api/tasks");
    return response.data;
  },

  getTaskById: async (id: number): Promise<Task> => {
    const response = await axios.get(`/api/tasks/${id}`);
    return response.data;
  },

  getTasksByCategory: async (category: string): Promise<Task[]> => {
    const response = await axios.get(`/api/tasks/category/${category}`);
    return response.data;
  },

  getTasksByPriority: async (priority: string): Promise<Task[]> => {
    const response = await axios.get(`/api/tasks/priority/${priority}`);
    return response.data;
  },

  processTask: async (input: string): Promise<Task> => {
    const response = await axios.post("/api/tasks/process", { input });
    return response.data;
  },

  summarizeTask: async (text: string): Promise<{ summary: string; note?: string }> => {
    try {
      const response = await axios.post("/api/tasks/summarize", { text });
      return response.data;
    } catch (error) {
      console.error("Error summarizing task:", error);
      return { 
        summary: text, 
        note: "Failed to generate summary" 
      };
    }
  },

  createTask: async (task: Partial<InsertTask>): Promise<Task> => {
    const response = await axios.post("/api/tasks", task);
    return response.data;
  },

  updateTask: async (id: number, task: Partial<InsertTask>): Promise<Task> => {
    const response = await axios.patch(`/api/tasks/${id}`, task);
    return response.data;
  },

  completeTask: async (id: number, completed: boolean): Promise<Task> => {
    const response = await axios.patch(`/api/tasks/${id}/complete`, { completed });
    return response.data;
  },

  deleteTask: async (id: number): Promise<{ success: boolean }> => {
    const response = await axios.delete(`/api/tasks/${id}`);
    return response.data;
  },

  clearCompletedTasks: async (): Promise<{ success: boolean; count: number }> => {
    const response = await axios.delete("/api/tasks/completed");
    return response.data;
  },
};

export default api;
