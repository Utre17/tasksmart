import axios from "axios";
import { Task, InsertTask, LoginUser, InsertUser } from "@shared/schema";

// Configure axios with interceptors for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login page on unauthorized
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

const api = {
  // Authentication
  register: async (userData: Omit<InsertUser, "id">): Promise<any> => {
    const response = await axios.post("/api/auth/register", userData);
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

  getCurrentUser: async (): Promise<any> => {
    const response = await axios.get("/api/auth/me");
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem("token");
    setAuthHeader();
  },

  // Task CRUD operations
  getAllTasks: async (): Promise<Task[]> => {
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
};

export default api;
