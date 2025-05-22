import { v4 as uuidv4 } from 'uuid';
import { Task } from '@shared/schema';

// Constants
const GUEST_ID_KEY = 'tasksmart_guest_id';
const GUEST_TASKS_KEY = 'tasksmart_guest_tasks';
const GUEST_SETTINGS_KEY = 'tasksmart_guest_settings';
const GUEST_MODE_KEY = 'tasksmart_guest_mode';

// Guest user settings
interface GuestSettings {
  theme: 'light' | 'dark' | 'system';
  preferences: {
    enableNotifications: boolean;
    enableAIFeatures: boolean;
    defaultCategory: string;
    defaultPriority: string;
  };
  lastActive: string; // ISO date string
}

// Default settings
const DEFAULT_SETTINGS: GuestSettings = {
  theme: 'system',
  preferences: {
    enableNotifications: true,
    enableAIFeatures: true,
    defaultCategory: 'Personal',
    defaultPriority: 'Medium'
  },
  lastActive: new Date().toISOString()
};

/**
 * Get or create a unique ID for the guest user
 */
export function getGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  
  if (!guestId) {
    guestId = `guest-${uuidv4().substring(0, 8)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  
  return guestId;
}

/**
 * Check if the user is in guest mode
 */
export function isGuestMode(): boolean {
  return localStorage.getItem(GUEST_MODE_KEY) === 'true';
}

/**
 * Activate guest mode
 */
export function activateGuestMode(): void {
  localStorage.setItem(GUEST_MODE_KEY, 'true');
  
  // Initialize guest data if not present
  getGuestId();
  
  if (!localStorage.getItem(GUEST_SETTINGS_KEY)) {
    localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }
  
  if (!localStorage.getItem(GUEST_TASKS_KEY)) {
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify([]));
  }
  
  // Update last active timestamp
  updateLastActive();
}

/**
 * Deactivate guest mode (but keep data for later)
 */
export function deactivateGuestMode(): void {
  localStorage.setItem(GUEST_MODE_KEY, 'false');
}

/**
 * Clear all guest data and deactivate guest mode
 */
export function clearGuestMode(): void {
  localStorage.removeItem(GUEST_MODE_KEY);
  localStorage.removeItem(GUEST_TASKS_KEY);
  localStorage.removeItem(GUEST_SETTINGS_KEY);
  // Keep the guest ID for potential future use
}

/**
 * Update last active timestamp
 */
export function updateLastActive(): void {
  const settings = getGuestSettings();
  settings.lastActive = new Date().toISOString();
  localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Get guest settings
 */
export function getGuestSettings(): GuestSettings {
  const settingsJson = localStorage.getItem(GUEST_SETTINGS_KEY);
  
  if (!settingsJson) {
    return DEFAULT_SETTINGS;
  }
  
  try {
    return JSON.parse(settingsJson) as GuestSettings;
  } catch (error) {
    console.error('Error parsing guest settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update guest settings
 */
export function updateGuestSettings(updatedSettings: Partial<GuestSettings>): GuestSettings {
  const currentSettings = getGuestSettings();
  const newSettings = {
    ...currentSettings,
    ...updatedSettings,
    preferences: {
      ...currentSettings.preferences,
      ...(updatedSettings.preferences || {})
    }
  };
  
  localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(newSettings));
  return newSettings;
}

/**
 * Get all guest tasks
 */
export function getGuestTasks(): Task[] {
  const tasksJson = localStorage.getItem(GUEST_TASKS_KEY);
  
  if (!tasksJson) {
    return [];
  }
  
  try {
    return JSON.parse(tasksJson) as Task[];
  } catch (error) {
    console.error('Error parsing guest tasks:', error);
    return [];
  }
}

/**
 * Add a task to guest storage
 */
export function addGuestTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
  const tasks = getGuestTasks();
  
  // Generate client-side IDs for guest tasks
  const newTask: Task = {
    ...task,
    id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    createdAt: new Date().toISOString() as any,
    updatedAt: new Date().toISOString() as any,
  };
  
  tasks.push(newTask);
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(tasks));
  
  return newTask;
}

/**
 * Update a guest task
 */
export function updateGuestTask(id: number, updates: Partial<Task>): Task | null {
  const tasks = getGuestTasks();
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return null;
  }
  
  const updatedTask = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: new Date().toISOString() as any
  };
  
  tasks[taskIndex] = updatedTask;
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(tasks));
  
  return updatedTask;
}

/**
 * Delete a guest task
 */
export function deleteGuestTask(id: number): boolean {
  const tasks = getGuestTasks();
  const filteredTasks = tasks.filter(t => t.id !== id);
  
  if (filteredTasks.length === tasks.length) {
    return false;
  }
  
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(filteredTasks));
  return true;
}

/**
 * Get tasks for transfer to authenticated user
 */
export function getGuestTasksForTransfer(): Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] {
  const tasks = getGuestTasks();
  
  // Strip client-side IDs and timestamps for server assignment
  return tasks.map(({ id, createdAt, updatedAt, ...rest }) => rest);
}

/**
 * Get guest storage usage statistics
 */
export function getGuestStorageStats(): { taskCount: number, storageUsed: string } {
  const tasks = getGuestTasks();
  const settings = getGuestSettings();
  
  // Calculate approximate storage usage
  const tasksJson = JSON.stringify(tasks);
  const settingsJson = JSON.stringify(settings);
  const idSize = (localStorage.getItem(GUEST_ID_KEY) || '').length;
  
  const totalBytes = tasksJson.length + settingsJson.length + idSize + 
    GUEST_TASKS_KEY.length + GUEST_SETTINGS_KEY.length + GUEST_ID_KEY.length;
  
  // Format the storage size
  let storageUsed: string;
  if (totalBytes < 1024) {
    storageUsed = `${totalBytes} bytes`;
  } else if (totalBytes < 1024 * 1024) {
    storageUsed = `${(totalBytes / 1024).toFixed(2)} KB`;
  } else {
    storageUsed = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  
  return {
    taskCount: tasks.length,
    storageUsed
  };
} 