import express, { Request, Response } from "express";
import { verifyFirebaseToken, getFirebaseUser, setUserClaims } from "../auth";
import { asyncHandler } from "../utils/errorHandler";
import * as logger from "../utils/logger";

const authRouter = express.Router();

/**
 * Login with Firebase token
 * Called by frontend after Firebase Auth login to verify token
 */
authRouter.post("/login", asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ 
      error: true,
      message: "No token provided"
    });
  }
  
  try {
    const decodedToken = await getFirebaseUser(token);
    
    // Return user information
    return res.json({ 
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.emailVerified,
        displayName: decodedToken.displayName,
      }
    });
  } catch (error) {
    logger.error("Token verification failed", error, "auth");
    return res.status(401).json({ 
      authenticated: false,
      message: "Invalid token"
    });
  }
}));

/**
 * Verify authentication status
 * Public endpoint to check if the token is valid
 */
authRouter.get("/verify", asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      authenticated: false,
      message: "No token provided"
    });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decodedToken = await getFirebaseUser(token);
    return res.json({ 
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.emailVerified,
        displayName: decodedToken.displayName,
      }
    });
  } catch (error) {
    logger.error("Token verification failed", error, "auth");
    return res.status(401).json({ 
      authenticated: false,
      message: "Invalid token"
    });
  }
}));

/**
 * Get current user profile
 * Protected endpoint to get detailed user information
 */
authRouter.get("/me", verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
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
    
    // Return user info with appropriate fields
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
    logger.error("Error fetching user profile", error, "auth");
    res.status(500).json({ error: true, message: "Server error" });
  }
}));

/**
 * Sign out (server-side cleanup if needed)
 * This is called by the frontend when user logs out
 */
authRouter.post("/logout", verifyFirebaseToken, (req: Request, res: Response) => {
  // Firebase Auth handles token invalidation client-side
  // This endpoint can be used for server-side cleanup if needed
  res.json({ success: true, message: "Signed out successfully" });
});

export default authRouter; 