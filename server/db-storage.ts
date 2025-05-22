import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { db } from "./db";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  tasks,
  users,
  aiUsage,
  userSessions,
  userPreferencesSchema,
  type Task,
  type InsertTask,
  type User,
  type InsertUser,
  type SelectUser,
  type UserPreferences
} from "@shared/schema";
import { IStorage } from "./storage";
import * as schema from "@shared/schema";

// Type assertion to fix the implicit any type
// Using Record<string, any> to bridge the type gap between our custom db implementation and PostgresJsDatabase
const typedDb = db as unknown as PostgresJsDatabase<typeof schema>;

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await typedDb.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await typedDb.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await typedDb.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await typedDb.select().from(users);
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Firebase Auth handles password, so we don't need to hash it
    const [user] = await typedDb.insert(users).values({
      ...userData
    }).returning();

    console.log("User created in DB:", user);

    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    // Firebase Auth handles passwords now
    const [updatedUser] = await typedDb
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return await typedDb.select().from(tasks);
  }

  async getTasksByUserId(userId: string, completed?: boolean): Promise<Task[]> {
    if (completed !== undefined) {
      return await typedDb.select().from(tasks).where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.completed, completed)
        )
      );
    }
    return await typedDb.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await typedDb.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByCategory(category: string, userId?: string): Promise<Task[]> {
    if (userId) {
      return await typedDb.select().from(tasks).where(
        and(
          eq(tasks.category, category),
          eq(tasks.userId, userId)
        )
      );
    }
    return await typedDb.select().from(tasks).where(eq(tasks.category, category));
  }

  async getTasksByPriority(priority: string, userId?: string): Promise<Task[]> {
    if (userId) {
      return await typedDb.select().from(tasks).where(
        and(
          eq(tasks.priority, priority),
          eq(tasks.userId, userId)
        )
      );
    }
    return await typedDb.select().from(tasks).where(eq(tasks.priority, priority));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await typedDb.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await typedDb
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
    const [deletedTask] = await typedDb
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    
    return !!deletedTask;
  }

  async completeTask(id: number, completed: boolean): Promise<Task | undefined> {
    const [updatedTask] = await typedDb
      .update(tasks)
      .set({
        completed,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    
    return updatedTask;
  }

  // Analytics methods
  async getTotalTasksByUserId(userId: string): Promise<any[]> {
    try {
      const result = await typedDb
        .select({ count: sql`count(*)` })
        .from(tasks)
        .where(eq(tasks.userId, userId));
        
      return result;
    } catch (error) {
      console.error("Error getting total tasks count:", error);
      return [{ count: "0" }];
    }
  }
  
  async getCompletedTasksByUserId(userId: string): Promise<any[]> {
    try {
      const result = await typedDb
        .select({ count: sql`count(*)` })
        .from(tasks)
        .where(and(
          eq(tasks.userId, userId),
          eq(tasks.completed, true)
        ));
        
      return result;
    } catch (error) {
      console.error("Error getting completed tasks count:", error);
      return [{ count: "0" }];
    }
  }
  
  async getTasksByPriorityAndUserId(userId: string): Promise<any[]> {
    try {
      const result = await typedDb
        .select({
          priority: tasks.priority,
          count: sql`count(*)`,
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .groupBy(tasks.priority);
        
      return result;
    } catch (error) {
      console.error("Error getting tasks by priority:", error);
      return [];
    }
  }
  
  async getAIUsageCountByUserId(userId: string): Promise<any[]> {
    try {
      const result = await typedDb
        .select({ count: sql`count(*)` })
        .from(aiUsage)
        .where(eq(aiUsage.userId, userId));
        
      return result;
    } catch (error) {
      console.error("Error getting AI usage count:", error);
      return [{ count: "0" }];
    }
  }
  
  async getCompletionRateOverTimeByUserId(userId: string): Promise<any[]> {
    try {
      const result = await typedDb.execute(sql`
        SELECT date_trunc('day', created_at) as day, 
          COUNT(*) FILTER (WHERE completed = true) as completed_count,
          COUNT(*) as total_count
        FROM tasks
        WHERE user_id = ${userId}
        GROUP BY day
        ORDER BY day DESC
        LIMIT 30
      `);
      
      return result;
    } catch (error) {
      console.error("Error getting completion rate over time:", error);
      return [];
    }
  }
  
  getTimeConstraint(period: string): string {
    let constraint = "created_at > now() - interval '7 days'";
    if (period === "month") {
      constraint = "created_at > now() - interval '30 days'";
    } else if (period === "year") {
      constraint = "created_at > now() - interval '365 days'";
    }
    return constraint;
  }
  
  async getTasksCompletedByDate(userId: string, timeConstraint: string): Promise<any[]> {
    try {
      const result = await typedDb.execute(sql`
        SELECT date_trunc('day', created_at) as day, 
          COUNT(*) FILTER (WHERE completed = true) as completed
        FROM tasks
        WHERE user_id = ${userId} AND ${sql.raw(timeConstraint)}
        GROUP BY day
        ORDER BY day ASC
      `);
      
      return result;
    } catch (error) {
      console.error("Error getting tasks completed by date:", error);
      return [];
    }
  }
  
  async getTotalAIUsageByUserId(userId: string): Promise<any[]> {
    try {
      const result = await typedDb
        .select({ count: sql`count(*)` })
        .from(aiUsage)
        .where(eq(aiUsage.userId, userId));
        
      return result;
    } catch (error) {
      console.error("Error getting total AI usage:", error);
      return [{ count: "0" }];
    }
  }
  
  async getAIUsageByDate(userId: string): Promise<any[]> {
    try {
      const result = await typedDb.execute(sql`
        SELECT date_trunc('day', created_at) as day, COUNT(*) as count
        FROM ai_usage
        WHERE user_id = ${userId} AND created_at > now() - interval '7 days'
        GROUP BY day
        ORDER BY day ASC
      `);
      
      return result;
    } catch (error) {
      console.error("Error getting AI usage by date:", error);
      return [];
    }
  }
  
  // User settings methods
  async getUserById(userId: string): Promise<User | null> {
    try {
      const [user] = await typedDb
        .select()
        .from(users)
        .where(eq(users.id, userId));
        
      return user || null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }
  
  async updateUserPassword(userId: string, hashedPassword: string): Promise<any[]> {
    try {
      // Firebase Auth now handles passwords - this method is deprecated
      console.warn("updateUserPassword is deprecated: Firebase Auth handles password updates");
      const result = await typedDb
        .update(users)
        .set({ 
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
        
      return result;
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
    }
  }
  
  validatePreferences(preferences: Partial<UserPreferences>): Partial<UserPreferences> {
    try {
      return userPreferencesSchema.partial().parse(preferences);
    } catch (error) {
      console.error("Invalid preferences:", error);
      throw new Error("Invalid preferences format");
    }
  }
  
  async updateUserPreferences(userId: string, preferences: any): Promise<any[]> {
    try {
      const result = await typedDb
        .update(users)
        .set({ 
          preferences,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
        
      return result;
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }
  }
  
  async getUserSessions(userId: string): Promise<any[]> {
    try {
      const result = await typedDb
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, userId))
        .orderBy(desc(userSessions.lastActive));
        
      return result;
    } catch (error) {
      console.error("Error getting user sessions:", error);
      return [];
    }
  }
  
  async getUserLastLogin(userId: string): Promise<Date | null> {
    try {
      const result = await typedDb
        .select({ lastLogin: users.lastLogin })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
        
      return result[0]?.lastLogin || null;
    } catch (error) {
      console.error("Error getting user last login:", error);
      return null;
    }
  }
  
  async deleteUserSession(userId: string, sessionId: string): Promise<any[]> {
    try {
      const result = await typedDb
        .delete(userSessions)
        .where(and(
          eq(userSessions.userId, userId),
          eq(userSessions.id, sessionId)
        ))
        .returning();
        
      return result;
    } catch (error) {
      console.error("Error deleting user session:", error);
      return [];
    }
  }

  // DEBUG ONLY - Remove in production
  async createTestAdmin(): Promise<User | undefined> {
    try {
      // Since we're using Firebase Auth, we don't need to store passwords
      const adminUser: InsertUser = {
        email: "admin@test.com",
        username: "testadmin",
        password: "firebase-auth-handles-passwords", // Required by schema but not used
        firstName: "Test",
        lastName: "Admin"
      };
      
      // Check if test admin already exists
      const existingAdmin = await this.getUserByEmail("admin@test.com");
      if (existingAdmin) {
        console.log("[DEBUG] Test admin already exists");
        const [updatedUser] = await typedDb
          .update(users)
          .set({
            updatedAt: new Date()
          })
          .where(eq(users.id, existingAdmin.id))
          .returning();
        
        return updatedUser;
      }
      
      // Create new test admin
      const [createdUser] = await typedDb.insert(users).values({
        ...adminUser,
        role: "admin"
      }).returning();
      
      console.log("[DEBUG] Created test admin account:", { 
        email: createdUser.email,
        username: createdUser.username
      });
      
      return createdUser;
    } catch (error) {
      console.error("[DEBUG] Error creating test admin:", error);
      return undefined;
    }
  }
}

export const dbStorage = new DatabaseStorage();