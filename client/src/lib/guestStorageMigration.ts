import * as oldGuestStorage from './guestStorage';
import * as enhancedGuestStorage from './enhancedGuestStorage';
import { Task } from '@shared/schema';

/**
 * Migrates data from the old guest storage system to the new enhanced one
 * @returns Object with migration statistics
 */
export function migrateGuestStorage(): { 
  success: boolean;
  tasksMigrated: number;
  errors: string[];
} {
  const result = {
    success: false,
    tasksMigrated: 0,
    errors: [] as string[]
  };
  
  try {
    // Check if there's data to migrate
    if (!oldGuestStorage.isGuestMode()) {
      result.success = true;
      return result;
    }
    
    // Get the old guest ID
    const oldGuestId = oldGuestStorage.getGuestId();
    
    // Get tasks from old storage
    const tasksToMigrate = oldGuestStorage.getGuestTasksForTransfer();
    
    // Activate enhanced guest mode
    enhancedGuestStorage.activateGuestMode();
    
    // Migrate each task
    for (const task of tasksToMigrate) {
      try {
        enhancedGuestStorage.addGuestTask(task);
        result.tasksMigrated++;
      } catch (error) {
        result.errors.push(`Failed to migrate task: ${error}`);
      }
    }
    
    // Clear old storage
    if (result.tasksMigrated === tasksToMigrate.length) {
      oldGuestStorage.clearGuestMode();
      result.success = true;
    }
    
    console.log(`Migrated guest data from ${oldGuestId} to ${enhancedGuestStorage.getGuestId()}`);
    
    return result;
  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

/**
 * Check if migration is needed
 * @returns true if old guest storage is active
 */
export function needsMigration(): boolean {
  return oldGuestStorage.isGuestMode() && !enhancedGuestStorage.isGuestMode();
} 