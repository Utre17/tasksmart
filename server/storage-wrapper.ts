import { IStorage } from './storage';
import { v5 as uuidv5 } from 'uuid';
import * as logger from './utils/logger';

// Use a stable namespace for converting Firebase UIDs to UUIDs
const FIREBASE_NAMESPACE = '9c9abbad-42f0-4a9b-ba38-9d5990c2b7a6';

/**
 * Wrapper for storage interface that converts Firebase UIDs to PostgreSQL UUIDs
 */
export class StorageWrapper implements IStorage {
  private storage: IStorage;
  
  constructor(storage: IStorage) {
    this.storage = storage;
  }
  
  /**
   * Convert Firebase UID to UUID compatible with PostgreSQL
   */
  private convertToUuid(firebaseUid: string): string {
    try {
      // Check if it's already a valid UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firebaseUid)) {
        return firebaseUid;
      }
      
      // Convert Firebase UID to a UUID v5 using namespace
      const uuid = uuidv5(firebaseUid, FIREBASE_NAMESPACE);
      logger.debug(`Converted Firebase UID ${firebaseUid} to UUID ${uuid}`);
      return uuid;
    } catch (error) {
      logger.error('Error converting Firebase UID to UUID', error);
      // Return the original, but this might cause database errors
      return firebaseUid;
    }
  }
  
  // User operations
  async getUser(id: string): Promise<any> {
    return this.storage.getUser(this.convertToUuid(id));
  }
  
  async getUserByUsername(username: string): Promise<any> {
    return this.storage.getUserByUsername(username);
  }
  
  async getUserByEmail(email: string): Promise<any> {
    return this.storage.getUserByEmail(email);
  }
  
  async createUser(user: any): Promise<any> {
    // If user has an ID, convert it
    if (user.id) {
      user.id = this.convertToUuid(user.id);
    }
    return this.storage.createUser(user);
  }
  
  async updateUser(id: string, userData: any): Promise<any> {
    return this.storage.updateUser(this.convertToUuid(id), userData);
  }
  
  async getAllUsers(): Promise<any[]> {
    return this.storage.getAllUsers();
  }
  
  // Task operations
  async getAllTasks(): Promise<any[]> {
    return this.storage.getAllTasks();
  }
  
  async getTasksByUserId(userId: string, completed?: boolean): Promise<any[]> {
    return this.storage.getTasksByUserId(this.convertToUuid(userId), completed);
  }
  
  async getTaskById(id: number): Promise<any> {
    return this.storage.getTaskById(id);
  }
  
  async getTasksByCategory(category: string, userId?: string): Promise<any[]> {
    return this.storage.getTasksByCategory(
      category, 
      userId ? this.convertToUuid(userId) : undefined
    );
  }
  
  async getTasksByPriority(priority: string, userId?: string): Promise<any[]> {
    return this.storage.getTasksByPriority(
      priority, 
      userId ? this.convertToUuid(userId) : undefined
    );
  }
  
  async createTask(task: any): Promise<any> {
    // Convert userId to UUID if it exists
    if (task.userId) {
      task.userId = this.convertToUuid(task.userId);
    }
    return this.storage.createTask(task);
  }
  
  async updateTask(id: number, task: any): Promise<any> {
    // Convert userId to UUID if it exists
    if (task.userId) {
      task.userId = this.convertToUuid(task.userId);
    }
    return this.storage.updateTask(id, task);
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.storage.deleteTask(id);
  }
  
  async completeTask(id: number, completed: boolean): Promise<any> {
    return this.storage.completeTask(id, completed);
  }
  
  // Analytics operations
  async getTotalTasksByUserId(userId: string): Promise<any[]> {
    return this.storage.getTotalTasksByUserId(this.convertToUuid(userId));
  }
  
  async getCompletedTasksByUserId(userId: string): Promise<any[]> {
    return this.storage.getCompletedTasksByUserId(this.convertToUuid(userId));
  }
  
  async getTasksByPriorityAndUserId(userId: string): Promise<any[]> {
    return this.storage.getTasksByPriorityAndUserId(this.convertToUuid(userId));
  }
  
  async getAIUsageCountByUserId(userId: string): Promise<any[]> {
    return this.storage.getAIUsageCountByUserId(this.convertToUuid(userId));
  }
  
  async getCompletionRateOverTimeByUserId(userId: string): Promise<any[]> {
    return this.storage.getCompletionRateOverTimeByUserId(this.convertToUuid(userId));
  }
  
  getTimeConstraint(period: string): string {
    return this.storage.getTimeConstraint(period);
  }
  
  async getTasksCompletedByDate(userId: string, timeConstraint: string): Promise<any[]> {
    return this.storage.getTasksCompletedByDate(this.convertToUuid(userId), timeConstraint);
  }
  
  async getTotalAIUsageByUserId(userId: string): Promise<any[]> {
    return this.storage.getTotalAIUsageByUserId(this.convertToUuid(userId));
  }
  
  async getAIUsageByDate(userId: string): Promise<any[]> {
    return this.storage.getAIUsageByDate(this.convertToUuid(userId));
  }
  
  // User settings operations
  async getUserById(userId: string): Promise<any> {
    return this.storage.getUserById(this.convertToUuid(userId));
  }
  
  async updateUserPassword(userId: string, hashedPassword: string): Promise<any[]> {
    return this.storage.updateUserPassword(this.convertToUuid(userId), hashedPassword);
  }
  
  validatePreferences(preferences: any): any {
    return this.storage.validatePreferences(preferences);
  }
  
  async updateUserPreferences(userId: string, preferences: any): Promise<any[]> {
    return this.storage.updateUserPreferences(this.convertToUuid(userId), preferences);
  }
  
  async getUserSessions(userId: string): Promise<any[]> {
    return this.storage.getUserSessions(this.convertToUuid(userId));
  }
  
  async getUserLastLogin(userId: string): Promise<Date | null> {
    return this.storage.getUserLastLogin(this.convertToUuid(userId));
  }
  
  async deleteUserSession(userId: string, sessionId: string): Promise<any[]> {
    return this.storage.deleteUserSession(this.convertToUuid(userId), sessionId);
  }
} 