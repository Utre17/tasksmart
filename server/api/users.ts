import express, { Request, Response } from 'express';
import { verifyFirebaseToken, requireAdmin, getFirebaseUser, setUserClaims } from '../auth';
import { asyncHandler } from '../utils/errorHandler';

const usersRouter = express.Router();

/**
 * Get user profile from Firebase Auth
 */
usersRouter.get('/me', verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(400).json({ error: true, message: "User ID not found in token" });
    }
    
    // Get additional user details from Firebase Auth
    const userRecord = await getFirebaseUser(uid);
    
    if (!userRecord) {
      return res.status(404).json({ error: true, message: "User not found" });
    }
    
    // Return user info from the token and Firebase Auth
    res.json({
      uid: req.user?.uid,
      email: req.user?.email,
      emailVerified: req.user?.email_verified,
      displayName: req.user?.name,
      role: req.user?.role || 'user',
      // Include other token claims
      claims: req.user,
      // Include data from Firebase Auth userRecord as needed
      providerData: userRecord.providerData,
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: true, message: "Server error" });
  }
}));

/**
 * Update user role (admin only)
 */
usersRouter.patch('/:uid/role', verifyFirebaseToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { uid } = req.params;
  const { role } = req.body;
  
  if (!uid) {
    return res.status(400).json({ error: true, message: "User ID is required" });
  }
  
  if (!role || typeof role !== 'string') {
    return res.status(400).json({ error: true, message: "Valid role is required" });
  }
  
  const allowedRoles = ['user', 'admin', 'manager'];
  
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ 
      error: true, 
      message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` 
    });
  }
  
  // Get the user to verify they exist
  const userRecord = await getFirebaseUser(uid);
  
  if (!userRecord) {
    return res.status(404).json({ error: true, message: "User not found" });
  }
  
  // Set custom claims with the new role
  const success = await setUserClaims(uid, { role });
  
  if (!success) {
    return res.status(500).json({ error: true, message: "Failed to update user role" });
  }
  
  return res.json({ 
    success: true,
    message: `User role updated to ${role}`,
    uid,
    role
  });
}));

/**
 * List all users (admin only)
 */
usersRouter.get('/', verifyFirebaseToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    // For Firebase, we would need to list users through Admin SDK
    // This is a simplified example - in a real app you'd implement pagination
    // Firebase Admin SDK doesn't have a direct "list all users" method that returns everything at once
    
    // Return a placeholder response
    return res.json({
      message: "This endpoint would return user list with pagination",
      notImplemented: "In a real application, implement this with Firebase Admin SDK listUsers method with pagination"
    });
  } catch (error) {
    console.error("Error listing users:", error);
    return res.status(500).json({ error: true, message: "Failed to list users" });
  }
}));

/**
 * Verify auth token status
 */
usersRouter.get('/verify', verifyFirebaseToken, (req: Request, res: Response) => {
  res.json({ 
    authenticated: true, 
    userId: req.user?.uid,
    email: req.user?.email,
  });
});

export default usersRouter; 