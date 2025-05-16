// All manual authentication code removed. Use Firebase Auth instead.
// This file is now a placeholder for future server-side Firebase token verification if needed.

import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";
import { fileURLToPath } from 'url';
import path from "path";
import fs from "fs";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.join(__dirname, "config", "firebase-service-account.json");
  
  // Check if the service account file exists
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("Firebase Admin SDK initialized successfully");
  } else {
    console.warn(
      "Firebase service account file not found at:", 
      serviceAccountPath, 
      "\nPlease follow the instructions in the file to set up your credentials."
    );
    
    // Initialize with GOOGLE_APPLICATION_CREDENTIALS environment variable if set
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
      console.log("Firebase Admin SDK initialized with environment credentials");
    } else {
      console.warn("Firebase Admin SDK not initialized - authentication middleware will fail");
    }
  }
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
}

/**
 * Middleware to verify Firebase ID tokens in HTTP requests.
 * 
 * This middleware decodes the token provided in the Authorization header,
 * and sets the resulting decoded token on the req.user property.
 */
export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

/**
 * Middleware to check if a user has admin role.
 * This should be used after verifyFirebaseToken middleware.
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: Authentication required" });
  }
  
  try {
    // You can implement your admin check here
    // Option 1: Check a custom claim in the Firebase token
    if (req.user.admin === true) {
      return next();
    }
    
    // Option 2: Check against your database
    // const user = await yourDB.getUser(req.user.uid);
    // if (user.role === 'admin') {
    //   return next();
    // }
    
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Generates Firebase custom claims for a user
 * This can be used to add roles or other attributes to users
 */
export const setUserClaims = async (uid: string, claims: object) => {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error("Error setting user claims:", error);
    return false;
  }
};

/**
 * Gets a user from Firebase Auth by UID or verifies a token
 * @param uidOrToken A Firebase UID or ID token
 */
export const getFirebaseUser = async (uidOrToken: string) => {
  try {
    // Check if this is a token by attempting to verify it
    try {
      const decodedToken = await admin.auth().verifyIdToken(uidOrToken);
      if (decodedToken) {
        // If successful, it's a token, so return the user
        return await admin.auth().getUser(decodedToken.uid);
      }
    } catch (tokenError) {
      // If verification fails, it might be a UID, so continue
      console.log("Input is not a valid token, trying as UID");
    }
    
    // Treat as UID if token verification failed
    return await admin.auth().getUser(uidOrToken);
  } catch (error) {
    console.error("Error getting Firebase user:", error);
    return null;
  }
};