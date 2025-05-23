import express, { Request, Response } from "express";
import { verifyFirebaseToken, getFirebaseUser, setUserClaims, handleLogout } from "../auth";
import { asyncHandler } from "../utils/errorHandler";
import * as logger from "../utils/logger";
import { db } from "../db";
import { users } from "../../shared/schema";
import admin from "firebase-admin";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

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
      message: "No token provided",
    });
  }

  try {
    // Verify Firebase ID token
    const decodedIdToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedIdToken.uid;
    const email = decodedIdToken.email;

    if (!email) {
      logger.error("Email not found in Firebase token", { uid: firebaseUid }, "auth-login");
      return res.status(400).json({ error: true, message: "Email not found in token" });
    }

    // Check if user exists in local DB
    const localUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, firebaseUid))
      .limit(1);
    
    let userStatus = "User confirmed";

    if (localUsers.length === 0) {
      // User doesn't exist locally, create them
      const firebaseUserRecord = await admin.auth().getUser(firebaseUid);
      
      const displayName = firebaseUserRecord.displayName || "";
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(' ') || "";

      const newUser = {
        id: firebaseUid,
        email: firebaseUserRecord.email || email, // Prefer email from UserRecord if available
        username: firebaseUserRecord.displayName || firebaseUserRecord.email || `user_${firebaseUid}`, // Fallback username
        password: 'FIREBASE_AUTH_USER_NO_LOCAL_PASSWORD', // Placeholder
        firstName: firstName,
        lastName: lastName,
        role: 'user' as const, // Default role
        profileImageUrl: firebaseUserRecord.photoURL,
        // ensure lastLogin is set, or allow it to be null if schema permits
        lastLogin: new Date(),
      };

      await db.insert(users).values(newUser);
      await setUserClaims(firebaseUid, { role: 'user', username: newUser.username });
      logger.info("New local user created during login", { uid: firebaseUid, email: newUser.email }, "auth-login");
      userStatus = "User provisioned";
    } else {
      // User exists, update lastLogin
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, firebaseUid));
    }

    return res.json({
      authenticated: true,
      status: userStatus,
    });

  } catch (error) {
    logger.error("Login process failed", error, "auth-login");
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ authenticated: false, message: "Firebase ID token has expired." });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ authenticated: false, message: "Invalid Firebase ID token." });
    }
    return res.status(500).json({
      authenticated: false,
      message: "Server error during login",
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
authRouter.post("/logout", verifyFirebaseToken, handleLogout);

/**
 * Register a new user
 */
authRouter.post("/register", asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName, token } = req.body;

  if (!email || !username || !password || !token) {
    return res.status(400).json({
      error: true,
      message: "Email, username, password, and token are required",
    });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.email !== email) {
      return res.status(400).json({
        error: true,
        message: "Token email does not match provided email",
      });
    }
    const firebaseUid = decodedToken.uid;

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Check if user already exists
    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUserByEmail.length > 0) {
      return res.status(409).json({
        error: true,
        message: "User with this email already exists",
      });
    }

    const existingUserByUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (existingUserByUsername.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Username already taken",
      });
    }

    // Create new user object
    const newUser = {
      id: firebaseUid,
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      role: "user" as const, // Default role
    };

    // Insert user into database
    const insertedUser = await db.insert(users).values(newUser).returning();

    // Set custom claims
    await setUserClaims(firebaseUid, { role: "user", username });

    // Return new user data (excluding password)
    const { password: _, ...userWithoutPassword } = insertedUser[0];
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    logger.error("User registration failed", error, "auth-register");
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: true, message: "Firebase ID token has expired." });
    }
    if (error.code === "auth/argument-error") {
      return res.status(401).json({ error: true, message: "Invalid Firebase ID token." });
    }
    return res.status(500).json({
      error: true,
      message: "Server error during registration",
    });
  }
}));

export default authRouter; 