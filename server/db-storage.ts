import { eq, and, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  tasks,
  users,
  type Task,
  type InsertTask,
  type User,
  type InsertUser,
  type SelectUser
} from "@shared/schema";
import { IStorage } from "./storage";
import bcrypt from "bcrypt";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword
    }).returning();
    
    return user;
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByCategory(category: string, userId?: string): Promise<Task[]> {
    if (userId) {
      return await db.select().from(tasks).where(
        and(
          eq(tasks.category, category),
          eq(tasks.userId, userId)
        )
      );
    }
    return await db.select().from(tasks).where(eq(tasks.category, category));
  }

  async getTasksByPriority(priority: string, userId?: string): Promise<Task[]> {
    if (userId) {
      return await db.select().from(tasks).where(
        and(
          eq(tasks.priority, priority),
          eq(tasks.userId, userId)
        )
      );
    }
    return await db.select().from(tasks).where(eq(tasks.priority, priority));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...taskUpdate,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const [deletedTask] = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    
    return !!deletedTask;
  }

  async completeTask(id: number, completed: boolean): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        completed,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    
    return updatedTask;
  }
}

export const dbStorage = new DatabaseStorage();