import express, { Request, Response } from "express";
import { verifyFirebaseToken, requireAdmin, getFirebaseUser } from "./auth";
// All manual authentication routes removed. Use Firebase Auth instead.
// This file is now a placeholder for future user profile or preferences routes if needed.

const authRouter = express.Router();

// Public routes (no authentication required)
authRouter.get("/status", (req: Request, res: Response) => {
  res.json({ status: "Auth service is running" });
});

// Simple test endpoint for debugging
authRouter.get("/test", (req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      message: "API is working",
      timestamp: new Date().toISOString(),
      headers: req.headers.authorization ? "Auth header present" : "No auth header"
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

// Handle Firebase login/token exchange
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    
    // We manually verify the token here and return a success response
    // The actual Firebase auth happened on the client already
    const decodedToken = await getFirebaseUser(token);
    
    if (!decodedToken) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token. User not found." 
      });
    }
    
    // Return a simplified user object
    return res.status(200).json({
      success: true,
      message: "Login successful",
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.emailVerified,
      displayName: decodedToken.displayName
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(401).json({ 
      success: false,
      message: "Invalid token. Please try logging in again." 
    });
  }
});

// Protected routes (Firebase authentication required)
authRouter.get("/me", verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    // The req.user has been populated by the verifyFirebaseToken middleware
    // It contains the decoded Firebase token claims
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    
    // Optionally get additional user details from Firebase Auth
    const userRecord = await getFirebaseUser(uid);
    
    if (!userRecord) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return user info from the token and Firebase Auth
    res.json({
      uid: req.user?.uid,
      email: req.user?.email,
      emailVerified: req.user?.email_verified,
      displayName: req.user?.name,
      // Include other token claims
      claims: req.user,
      // Include data from Firebase Auth userRecord as needed
      providerData: userRecord.providerData,
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Example admin-only route
authRouter.get("/admin/users", verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    // This route is only accessible to users with admin claim
    // Typically you would fetch users from your database here
    
    // For example purposes, just return success
    res.json({ 
      message: "Admin access successful", 
      admin: req.user?.admin,
      // You would include a list of users here from your database
    });
  } catch (error) {
    console.error("Error in admin route:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Example route to verify a token without providing data (useful for checking auth status)
authRouter.get("/verify", verifyFirebaseToken, (req: Request, res: Response) => {
  res.json({ 
    authenticated: true, 
    userId: req.user?.uid,
    email: req.user?.email,
  });
});

// Example: You can add user profile or preferences routes here in the future

export default authRouter;