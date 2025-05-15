import { 
  tasks, 
  type Task, 
  type InsertTask, 
  type User, 
  type InsertUser,
  type SelectUser
} from "@shared/schema";
import { dbStorage } from "./db-storage";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTasksByUserId(userId: string): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  getTasksByCategory(category: string, userId?: string): Promise<Task[]>;
  getTasksByPriority(priority: string, userId?: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number, completed: boolean): Promise<Task | undefined>;
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
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Task methods
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId
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
}

// Determine which storage to use
// For now, use in-memory storage to ensure the app works while we develop the database integration
const memStorage = new MemStorage();
export const storage = memStorage;
