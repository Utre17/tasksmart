import axios from "axios";
import { Task, InsertTask, LoginUser, InsertUser } from "@shared/schema";
import { apiCall, ApiResponse, ApiError } from "./errorHandler";

// Create a custom APIError class for consistent error handling
class APIError extends Error {
  status: number;
  data: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Configure axios with enhanced interceptors for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Create standardized error format
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown error occurred';
    const data = error.response?.data || {};
    
    // Authentication specific error handling
    if (status === 401) {
      console.warn("Authentication error:", message);
      
      // Only clear token if it's a genuine auth error (not just missing token)
      const isTokenError = 
        message.includes("token") || 
        message.includes("auth") || 
        message.includes("unauthorized") ||
        message.toLowerCase().includes("invalid");
      
      if (isTokenError) {
        console.log("Clearing invalid auth token");
        localStorage.removeItem("token");
      }
      
      // Only redirect if not on auth page and not a background check
      const isAuthRequest = error.config.url?.includes('/api/auth/');
      const isVerifyRequest = error.config.url?.includes('/verify');
      
      if (window.location.pathname !== "/auth" && !isAuthRequest && !isVerifyRequest) {
        console.log("Redirecting to auth page due to auth error");
        window.location.href = "/auth?reason=session_expired";
      }
    }
    
    return Promise.reject(new APIError(message, status, data));
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
    try {
      const result = await apiCall(axios.post("/api/auth/register", userData));
      if (!result.isSuccess || !result.data) {
        throw result.error;
      }
      
      // Set token if returned
      if (result.data.token) {
        localStorage.setItem("token", result.data.token);
        setAuthHeader();
      }
      return result.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  login: async (credentials: LoginUser): Promise<any> => {
    try {
      const result = await apiCall(axios.post("/api/auth/login", credentials));
      if (!result.isSuccess || !result.data) {
        throw result.error;
      }
      
      // Set token in local storage
      if (result.data.token) {
        localStorage.setItem("token", result.data.token);
        setAuthHeader();
      } else {
        throw new APIError("Login successful but no token returned", 500);
      }
      return result.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Verify Firebase token with backend
  loginWithToken: async (token: string): Promise<any> => {
    try {
      const result = await apiCall(axios.post("/api/auth/login", { token }));
      if (!result.isSuccess) {
        throw result.error;
      }
      return result.data;
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
    try {
      const result = await apiCall(axios.get("/api/tasks"));
      if (!result.isSuccess) {
        throw result.error;
      }
      return result.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  },

  getTaskById: async (id: number): Promise<Task> => {
    try {
      const result = await apiCall(axios.get(`/api/tasks/${id}`));
      if (!result.isSuccess) {
        throw result.error;
      }
      return result.data;
    } catch (error) {
      console.error("Error fetching task:", error);
      throw error;
    }
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
    try {
      const response = await axios.post("/api/tasks/process", { input });
      return response.data;
    } catch (error) {
      console.error("Error processing task with AI:", error);
      
      // Fallback: Create a basic task if the AI processing fails
      const fallbackTask = {
        title: input.length > 50 ? input.substring(0, 47) + '...' : input,
        description: input,
        category: 'Personal',
        priority: 'Medium',
        dueDate: null,
        completed: false
      };
      
      // Log the fallback action
      console.log("Using fallback task creation instead of AI processing");
      
      return fallbackTask as Task;
    }
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
    try {
      const result = await apiCall(axios.post("/api/tasks", task));
      if (!result.isSuccess) {
        throw result.error;
      }
      return result.data;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  updateTask: async (id: number, task: Partial<InsertTask>): Promise<Task> => {
    try {
      const result = await apiCall(axios.patch(`/api/tasks/${id}`, task));
      if (!result.isSuccess) {
        throw result.error;
      }
      return result.data;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
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
