import { 
  tasks, 
  type Task, 
  type InsertTask, 
  type User, 
  type InsertUser,
  type SelectUser,
  type UserPreferences
} from "@shared/schema";
import { dbStorage } from "./db-storage";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTasksByUserId(userId: string, completed?: boolean): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  getTasksByCategory(category: string, userId?: string): Promise<Task[]>;
  getTasksByPriority(priority: string, userId?: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number, completed: boolean): Promise<Task | undefined>;
  
  // Analytics operations
  getTotalTasksByUserId(userId: string): Promise<any[]>;
  getCompletedTasksByUserId(userId: string): Promise<any[]>;
  getTasksByPriorityAndUserId(userId: string): Promise<any[]>;
  getAIUsageCountByUserId(userId: string): Promise<any[]>;
  getCompletionRateOverTimeByUserId(userId: string): Promise<any[]>;
  getTimeConstraint(period: string): string;
  getTasksCompletedByDate(userId: string, timeConstraint: string): Promise<any[]>;
  getTotalAIUsageByUserId(userId: string): Promise<any[]>;
  getAIUsageByDate(userId: string): Promise<any[]>;
  
  // User settings operations
  getUserById(userId: string): Promise<User | null>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<any[]>;
  validatePreferences(preferences: Partial<UserPreferences>): Partial<UserPreferences>;
  updateUserPreferences(userId: string, preferences: any): Promise<any[]>;
  getUserSessions(userId: string): Promise<any[]>;
  getUserLastLogin(userId: string): Promise<Date | null>;
  deleteUserSession(userId: string, sessionId: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tasks: Map<number, Task>;
  currentTaskId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.currentTaskId = 1;

    // Initialize with some sample tasks
    const initialTasks: InsertTask[] = [
      {
        title: "Call mom tomorrow at 5 PM",
        completed: false,
        category: "Personal",
        priority: "Medium",
        dueDate: "Tomorrow, 5:00 PM",
      },
      {
        title: "Prepare quarterly report for management review",
        completed: false,
        category: "Work",
        priority: "High",
        dueDate: "Oct 15, 2023",
        notes: "Include sales figures, customer feedback, and projections for Q4"
      },
      {
        title: "Book dentist appointment for next week",
        completed: false,
        category: "Personal",
        priority: "Low",
        dueDate: "Next Week",
      },
      {
        title: "Submit proposal for the new client project",
        completed: false,
        category: "Work",
        priority: "High",
        dueDate: "Oct 10, 2023",
      },
      {
        title: "Order groceries for the week",
        completed: true,
        category: "Personal",
        priority: "Medium",
        dueDate: "",
      }
    ];

    initialTasks.forEach(task => this.createTask(task));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // In a real application, we should hash the password
    // This is already handled in the registerUser function in auth.ts
    // but we need to handle it here for our dev endpoints
    
    const id = crypto.randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: null,
      role: "user", // Default role
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { 
      ...user, 
      ...userData,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Task methods
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByUserId(userId: string, completed?: boolean): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId && (completed === undefined || task.completed === completed)
    );
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByCategory(category: string, userId?: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => {
        if (userId) {
          return task.category === category && task.userId === userId;
        }
        return task.category === category;
      }
    );
  }

  async getTasksByPriority(priority: string, userId?: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => {
        if (userId) {
          return task.priority === priority && task.userId === userId;
        }
        return task.priority === priority;
      }
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      userId: insertTask.userId || null,
      completed: insertTask.completed || false,
      dueDate: insertTask.dueDate || null,
      notes: insertTask.notes || null,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = { 
      ...task, 
      ...taskUpdate,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async completeTask(id: number, completed: boolean): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = { 
      ...task, 
      completed,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Analytics methods - stub implementations for in-memory storage
  async getTotalTasksByUserId(userId: string): Promise<any[]> {
    const tasks = await this.getTasksByUserId(userId);
    return [{ count: tasks.length.toString() }];
  }

  async getCompletedTasksByUserId(userId: string): Promise<any[]> {
    const tasks = await this.getTasksByUserId(userId, true);
    return [{ count: tasks.length.toString() }];
  }

  async getTasksByPriorityAndUserId(userId: string): Promise<any[]> {
    const tasks = await this.getTasksByUserId(userId);
    const priorityCounts = new Map<string, number>();
    
    tasks.forEach(task => {
      const count = priorityCounts.get(task.priority) || 0;
      priorityCounts.set(task.priority, count + 1);
    });
    
    return Array.from(priorityCounts.entries()).map(([priority, count]) => ({
      priority,
      count: count.toString()
    }));
  }

  async getAIUsageCountByUserId(userId: string): Promise<any[]> {
    return [{ count: "0" }]; // Mock implementation
  }

  async getCompletionRateOverTimeByUserId(userId: string): Promise<any[]> {
    return []; // Mock implementation
  }

  getTimeConstraint(period: string): string {
    return ""; // Mock implementation
  }

  async getTasksCompletedByDate(userId: string, timeConstraint: string): Promise<any[]> {
    return []; // Mock implementation
  }

  async getTotalAIUsageByUserId(userId: string): Promise<any[]> {
    return [{ count: "0" }]; // Mock implementation
  }

  async getAIUsageByDate(userId: string): Promise<any[]> {
    return []; // Mock implementation
  }

  // User settings methods - stub implementations for in-memory storage
  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<any[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    user.password = hashedPassword;
    user.updatedAt = new Date();
    
    return [user];
  }

  validatePreferences(preferences: Partial<UserPreferences>): Partial<UserPreferences> {
    return preferences; // Simple pass-through for in-memory
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<any[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    user.preferences = { ...user.preferences, ...preferences };
    user.updatedAt = new Date();
    
    return [user];
  }

  async getUserSessions(userId: string): Promise<any[]> {
    return []; // Mock implementation
  }

  async getUserLastLogin(userId: string): Promise<Date | null> {
    const user = this.users.get(userId);
    return user?.lastLogin || null;
  }

  async deleteUserSession(userId: string, sessionId: string): Promise<any[]> {
    return []; // Mock implementation
  }
}

// Determine which storage to use
// For now, use in-memory storage to ensure the app works while we develop the database integration
const memStorage = new MemStorage();
export const storage = dbStorage;
