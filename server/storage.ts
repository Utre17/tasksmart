import { tasks, type Task, type InsertTask, users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  // User operations (keeping from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  getTasksByCategory(category: string): Promise<Task[]>;
  getTasksByPriority(priority: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number, completed: boolean): Promise<Task | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  currentUserId: number;
  currentTaskId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.currentUserId = 1;
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

  // User methods (keeping from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Task methods
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByCategory(category: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.category === category
    );
  }

  async getTasksByPriority(priority: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.priority === priority
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now 
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async completeTask(id: number, completed: boolean): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = { ...task, completed };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
}

export const storage = new MemStorage();
