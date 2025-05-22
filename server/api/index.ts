import express from "express";
import { verifyFirebaseToken } from "../auth";
import tasksRouter from "./tasks";
import userRouter from "./user";
import authRouter from "./auth";
import analyticsRouter from "./analytics";
import * as logger from "../utils/logger";
import { storage } from "../storage";

/**
 * Main API Router
 * Centralizes all API routes and applies authentication middleware
 */
const apiRouter = express.Router();

// Basic health check endpoint
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes - some are public, others are protected internally
apiRouter.use("/auth", authRouter);

// Get the preferences route handler from userRouter
// This is a bit of a hack but allows us to handle the /auth/preferences route
apiRouter.patch("/auth/preferences", verifyFirebaseToken, async (req, res) => {
  const userId = req.user?.uid;
  
  if (!userId) {
    return res.status(400).json({ error: true, message: "User ID not found in token" });
  }
  
  try {
    const preferences = req.body;
    
    // Validate preferences with zod schema
    const validPreferences = storage.validatePreferences(preferences);
    
    // Get current user
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
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
    return res.status(500).json({ error: true, message: "Failed to update preferences" });
  }
});

// Analytics routes - protected by middleware
apiRouter.use("/analytics", verifyFirebaseToken, analyticsRouter);

// Protected routes requiring authentication
apiRouter.use("/tasks", verifyFirebaseToken, tasksRouter);
apiRouter.use("/users", verifyFirebaseToken, userRouter);

// Legacy endpoint - keep for backwards compatibility
apiRouter.get("/verify", verifyFirebaseToken, (req, res) => {
  res.json({ 
    authenticated: true, 
    userId: req.user?.uid,
    email: req.user?.email,
  });
});

// 404 Handler for API routes
apiRouter.use((req, res) => {
  logger.debug(`API 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: true,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}` 
  });
});

export default apiRouter; 