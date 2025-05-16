import { Task, InsertTask } from "@shared/schema";
import { QueryClient } from "@tanstack/react-query";

const GUEST_ID_KEY = "guest_id";
const GUEST_TASKS_KEY = "guest_tasks";

// Generate a random guest ID
export const generateGuestId = (): string => {
  const randomId = Math.floor(100000 + Math.random() * 900000);
  return `Guest${randomId}`;
};

// Get the current guest ID or create a new one
export const getGuestId = (): string => {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
};

// Check if the user is in guest mode
export const isGuestMode = (): boolean => {
  return localStorage.getItem(GUEST_ID_KEY) !== null;
};

// Clear guest mode data
export const clearGuestMode = (): void => {
  localStorage.removeItem(GUEST_ID_KEY);
  localStorage.removeItem(GUEST_TASKS_KEY);
};

// Parse a string date to a Date object safely
const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  try {
    return new Date(dateStr);
  } catch (e) {
    return new Date();
  }
};

// Get all guest tasks
export const getGuestTasks = (): Task[] => {
  const tasksJson = localStorage.getItem(GUEST_TASKS_KEY);
  if (!tasksJson) return [];
  
  try {
    // Parse and ensure properties have the right types
    const parsedTasks = JSON.parse(tasksJson);
    return parsedTasks.map((task: any) => ({
      ...task,
      createdAt: parseDate(task.createdAt),
      updatedAt: parseDate(task.updatedAt)
    }));
  } catch (e) {
    console.error("Error parsing guest tasks:", e);
    return [];
  }
};

// Save a new guest task
export const saveGuestTask = (task: Partial<InsertTask>, queryClient?: QueryClient): Task => {
  const tasks = getGuestTasks();
  
  // Generate a temporary ID for the task (negative to avoid conflicts with server IDs)
  const newId = -(tasks.length + 1);
  const now = new Date();
  
  // Create a task object that matches the schema
  const newTask: Task = {
    id: newId,
    userId: "guest",
    title: task.title || "",
    completed: task.completed || false,
    category: task.category || "Uncategorized",
    priority: task.priority || "Medium",
    dueDate: task.dueDate || null,
    notes: task.notes || null,
    createdAt: now,
    updatedAt: now
  };
  
  // For storage in localStorage, convert Date objects to strings
  const storageTasks = [...tasks, newTask].map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString()
  }));
  
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(storageTasks));
  
  // If queryClient is provided, update cache to instantly show the new task
  if (queryClient) {
    const existingTasks = queryClient.getQueryData<Task[]>(["/api/tasks"]) || [];
    queryClient.setQueryData(["/api/tasks"], [...existingTasks, newTask]);
  }
  
  return newTask;
};

// Update a guest task
export const updateGuestTask = (id: number, updates: Partial<InsertTask>, queryClient?: QueryClient): Task | null => {
  const tasks = getGuestTasks();
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) return null;
  
  const now = new Date();
  
  const updatedTask: Task = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: now
  };
  
  // Update in memory array
  tasks[taskIndex] = updatedTask;
  
  // For storage, convert Date objects to strings
  const storageTasks = tasks.map(t => ({
    ...t,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt
  }));
  
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(storageTasks));
  
  // If queryClient is provided, update cache to instantly show the updated task
  if (queryClient) {
    const existingTasks = queryClient.getQueryData<Task[]>(["/api/tasks"]) || [];
    const updatedTasks = existingTasks.map(t => t.id === id ? updatedTask : t);
    queryClient.setQueryData(["/api/tasks"], updatedTasks);
  }
  
  return updatedTask;
};

// Delete a guest task
export const deleteGuestTask = (id: number, queryClient?: QueryClient): boolean => {
  const tasks = getGuestTasks();
  const newTasks = tasks.filter(t => t.id !== id);
  
  if (newTasks.length === tasks.length) return false;
  
  // For storage, convert Date objects to strings
  const storageTasks = newTasks.map(t => ({
    ...t,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt
  }));
  
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(storageTasks));
  
  // If queryClient is provided, update cache to instantly reflect the deleted task
  if (queryClient) {
    const existingTasks = queryClient.getQueryData<Task[]>(["/api/tasks"]) || [];
    const updatedTasks = existingTasks.filter(t => t.id !== id);
    queryClient.setQueryData(["/api/tasks"], updatedTasks);
  }
  
  return true;
};

// Mark a guest task as complete or incomplete
export const completeGuestTask = (id: number, completed: boolean, queryClient?: QueryClient): Task | null => {
  return updateGuestTask(id, { completed }, queryClient);
};

// Clear all completed guest tasks
export const clearCompletedGuestTasks = (queryClient?: QueryClient): number => {
  const tasks = getGuestTasks();
  const incompleteTasks = tasks.filter(t => !t.completed);
  const clearedCount = tasks.length - incompleteTasks.length;
  
  // For storage, convert Date objects to strings
  const storageTasks = incompleteTasks.map(t => ({
    ...t,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt
  }));
  
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(storageTasks));
  
  // If queryClient is provided, update cache to instantly reflect the cleared tasks
  if (queryClient) {
    const existingTasks = queryClient.getQueryData<Task[]>(["/api/tasks"]) || [];
    const updatedTasks = existingTasks.filter(t => !t.completed);
    queryClient.setQueryData(["/api/tasks"], updatedTasks);
  }
  
  return clearedCount;
};

// Get all guest tasks to transfer to a new account
export const getGuestTasksForTransfer = (): Partial<InsertTask>[] => {
  const tasks = getGuestTasks();
  // Strip out the id and userId as these will be assigned by the server
  return tasks.map(({ id, userId, createdAt, updatedAt, ...rest }) => rest);
}; 