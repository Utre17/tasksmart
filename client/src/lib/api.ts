import axios from "axios";
import { Task, InsertTask } from "@shared/schema";

const api = {
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
