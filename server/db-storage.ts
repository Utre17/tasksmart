import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { db } from "./db";
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Firebase Auth handles password, so we don't need to hash it
    const [user] = await db.insert(users).values({
      ...userData
    }).returning();

    console.log("User created in DB:", user);

    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    // Firebase Auth handles passwords now
    const [updatedUser] = await db
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
    return await db.select().from(tasks);
  }

  async getTasksByUserId(userId: string, completed?: boolean): Promise<Task[]> {
    if (completed !== undefined) {
      return await db.select().from(tasks).where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.completed, completed)
        )
      );
    }
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

  // Analytics methods
  async getTotalTasksByUserId(userId: string): Promise<any[]> {
    try {
      const result = await db
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
      const result = await db
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
      const result = await db
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
      const result = await db
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
      const result = await db.execute(sql`
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
      const result = await db.execute(sql`
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
      const result = await db
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
      const result = await db.execute(sql`
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
      const [user] = await db
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
      const result = await db
        .update(users)
        .set({ 
          password: hashedPassword,
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
      const result = await db
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
      const result = await db
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
      const result = await db
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
      const result = await db
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
      // Use a pre-generated hash instead of generating a new one each time
      // This is a known hash for "Admin123!"
      const knownPasswordHash = "$2b$10$C/QSnpSR7S7K7EVVFDxWc.qctmtP1XQmhEOZcyS1KgNkykJsXSoEC";
      
      // Check if test admin already exists
      const existingAdmin = await this.getUserByEmail("admin@test.com");
      if (existingAdmin) {
        console.log("[DEBUG] Test admin already exists");
        // Use the known hash directly
        const [updatedUser] = await db
          .update(users)
          .set({
            password: knownPasswordHash,
            updatedAt: new Date()
          })
          .where(eq(users.id, existingAdmin.id))
          .returning();
        
        return updatedUser;
      }
      
      // Create new test admin
      const adminUser: InsertUser = {
        email: "admin@test.com",
        username: "testadmin",
        password: "not-used", // This will be replaced with knownPasswordHash
        firstName: "Test",
        lastName: "Admin"
      };
      
      // Insert with the known hash
      const [createdUser] = await db.insert(users).values({
        ...adminUser,
        password: knownPasswordHash,
        role: "admin"
      }).returning();
      
      console.log("[DEBUG] Created test admin account:", { 
        email: createdUser.email,
        username: createdUser.username,
        password: "Admin123!" // The password corresponding to the hash
      });
      
      return createdUser;
    } catch (error) {
      console.error("[DEBUG] Error creating test admin:", error);
      return undefined;
    }
  }
}

export const dbStorage = new DatabaseStorage();