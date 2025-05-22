// All manual authentication code removed. Use Firebase Auth instead.
// This file is now a placeholder for future server-side Firebase token verification if needed.

import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";
import { fileURLToPath } from 'url';
import path from "path";
import fs from "fs";
import * as logger from "./utils/logger";
import { ApiError } from "./utils/errorHandler";
import NodeCache from "node-cache";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

// Initialize Firebase Admin
(function initializeFirebase() {
  try {
    // Set up __dirname equivalent for ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const serviceAccountPath = path.join(__dirname, "config", "firebase-service-account.json");
    
    // Check if the service account file exists
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      logger.log("Firebase Admin SDK initialized successfully", "auth");
    } else {
      logger.warn(
        `Firebase service account file not found at: ${serviceAccountPath}. Falling back to environment credentials.`,
        "auth"
      );
      
      // Initialize with GOOGLE_APPLICATION_CREDENTIALS environment variable if set
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
        logger.log("Firebase Admin SDK initialized with environment credentials", "auth");
      } else {
        logger.error("Firebase Admin SDK not initialized - authentication middleware will fail", null, "auth");
      }
    }
  } catch (error) {
    logger.error("Error initializing Firebase Admin SDK", error, "auth");
  }
})();

// Create cache with 15-minute TTL
const tokenCache = new NodeCache({ stdTTL: 15 * 60 });

/**
 * Middleware to verify Firebase ID tokens in HTTP requests.
 * 
 * This middleware decodes the token provided in the Authorization header,
 * and sets the resulting decoded token on the req.user property.
 */
export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }
    
    const token = authHeader.split("Bearer ")[1];
    
    // Check cache first
    const cachedUser = tokenCache.get(token);
    if (cachedUser) {
      req.user = cachedUser as any;
      return next();
    }
    
    // Not in cache, verify with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token, true);
    req.user = decodedToken;
    
    // Cache the validated token
    tokenCache.set(token, decodedToken);
    
    next();
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: "Token expired" });
    }
    
    return res.status(401).json({ message: "Invalid authentication token" });
  }
}

/**
 * Middleware to check if a user has admin role.
 * This should be used after verifyFirebaseToken middleware.
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError("Unauthorized: Authentication required", 401);
  }
  
  try {
    // Check a custom claim in the Firebase token
    if (req.user.admin === true || req.user.role === 'admin') {
      return next();
    }
    
    throw new ApiError("Forbidden: Admin access required", 403);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error("Error checking admin status", error, "auth");
    throw new ApiError("Server error", 500);
  }
};

/**
 * Generates Firebase custom claims for a user
 * This can be used to add roles or other attributes to users
 */
export const setUserClaims = async (uid: string, claims: object): Promise<boolean> => {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    logger.log(`Custom claims set for user ${uid}: ${JSON.stringify(claims)}`, "auth");
    return true;
  } catch (error) {
    logger.error(`Error setting claims for user ${uid}`, error, "auth");
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
      logger.debug("Input is not a valid token, trying as UID", null, "auth");
    }
    
    // Treat as UID if token verification failed
    return await admin.auth().getUser(uidOrToken);
  } catch (error) {
    logger.error(`Error getting Firebase user for ${uidOrToken}`, error, "auth");
    return null;
  }
};

// Add function to clear cache entries
export function clearTokenCache(token: string) {
  tokenCache.del(token);
}

// Update logout endpoint to invalidate cached token
export async function handleLogout(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      clearTokenCache(token);
    }
    
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
}