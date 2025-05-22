import express, { Request, Response } from 'express';
import { requireAdmin, getFirebaseUser, setUserClaims } from '../auth';
import { asyncHandler, ApiError } from '../utils/errorHandler';
import * as logger from '../utils/logger';
import { storage } from '../storage';

const usersRouter = express.Router();

/**
 * Get user profile from Firebase Auth
 */
usersRouter.get('/me', asyncHandler(async (req: Request, res: Response) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      throw new ApiError("User ID not found in token", 400);
    }
    
    // Get additional user details from Firebase Auth
    const userRecord = await getFirebaseUser(uid);
    
    if (!userRecord) {
      throw new ApiError("User not found", 404);
    }
    
    // Return user info from the token and Firebase Auth
    res.json({
      uid: req.user?.uid,
      email: req.user?.email,
      emailVerified: req.user?.email_verified,
      displayName: req.user?.name || userRecord.displayName,
      photoURL: req.user?.picture || userRecord.photoURL,
      role: req.user?.role || 'user',
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error("Error fetching user profile", error);
    throw new ApiError("Server error", 500);
  }
}));

/**
 * Update user role (admin only)
 * Note: Still requires verifyFirebaseToken middleware and admin check
 */
usersRouter.patch('/:uid/role', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { uid } = req.params;
  const { role } = req.body;
  
  if (!uid) {
    throw new ApiError("User ID is required", 400);
  }
  
  if (!role || typeof role !== 'string') {
    throw new ApiError("Valid role is required", 400);
  }
  
  const allowedRoles = ['user', 'admin', 'manager'];
  
  if (!allowedRoles.includes(role)) {
    throw new ApiError(`Invalid role. Allowed roles: ${allowedRoles.join(', ')}`, 400);
  }
  
  try {
    // Get the user to verify they exist
    const userRecord = await getFirebaseUser(uid);
    
    if (!userRecord) {
      throw new ApiError("User not found", 404);
    }
    
    // Set custom claims with the new role
    const success = await setUserClaims(uid, { role });
    
    if (!success) {
      throw new ApiError("Failed to update user role", 500);
    }
    
    logger.log(`User ${uid} role updated to ${role}`, "users");
    return res.json({ 
      success: true,
      message: `User role updated to ${role}`,
      uid,
      role
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Failed to update role for user ${uid}`, error);
    throw new ApiError("Server error", 500);
  }
}));

/**
 * List all users (admin only) - with pagination
 */
usersRouter.get('/all', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get pagination parameters
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const pageToken = req.query.pageToken as string;
    
    // For Firebase, we would need to list users through Admin SDK
    // Example: const listUsersResult = await admin.auth().listUsers(1000, pageToken);
    
    logger.debug(`Admin requesting user list (pageSize: ${pageSize}, pageToken: ${pageToken || 'none'})`);
    
    // Return a placeholder response
    return res.json({
      message: "User list with pagination",
      pageSize,
      pageToken,
      users: [] // In a real app, this would be populated with user data
    });
  } catch (error) {
    logger.error("Error listing users", error);
    throw new ApiError("Failed to list users", 500);
  }
}));

/**
 * Update user settings
 */
usersRouter.put('/settings', asyncHandler(async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  if (!uid) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  const { theme, notifications, preferences } = req.body;
  
  // Here you would update the user settings in your database
  // Example: await db.updateUserSettings(uid, { theme, notifications, preferences });
  logger.log(`User ${uid} updated settings`, "users");
  
  // Return success response
  return res.json({
    success: true,
    message: "User settings updated successfully",
    settings: { theme, notifications, preferences }
  });
}));

/**
 * Delete user account (self)
 */
usersRouter.delete('/account', asyncHandler(async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  if (!uid) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  try {
    // In a real app, you would implement account deletion here
    // Example: await admin.auth().deleteUser(uid);
    logger.log(`User ${uid} deleted their account`, "users");
    
    return res.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    logger.error(`Failed to delete account for user ${uid}`, error);
    throw new ApiError("Failed to delete account", 500);
  }
}));

/**
 * Update user preferences
 * PATCH /api/auth/preferences
 */
usersRouter.patch("/preferences", asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  
  if (!userId) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  try {
    const preferences = req.body;
    
    // Validate preferences with zod schema
    const validPreferences = storage.validatePreferences(preferences);
    
    // Get current user
    const user = await storage.getUserById(userId);
    
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    
    // Merge with existing preferences
    const currentPreferences = user.preferences || {};
    const updatedPreferences = { ...currentPreferences, ...validPreferences };
    
    // Update preferences
    await storage.updateUserPreferences(userId, updatedPreferences);
    
    return res.json({ 
      success: true, 
      preferences: updatedPreferences
    });
  } catch (error) {
    logger.error("Error updating preferences", error, "user");
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to update preferences", 500);
  }
}));

export default usersRouter; 