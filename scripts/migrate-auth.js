// Script to migrate from Replit Auth to local JWT authentication
// This allows the project to run locally without Replit's authentication system

import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

async function migrateAuth() {
  try {
    console.log('Starting authentication migration...');
    
    // Check if DATABASE_URL is defined
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    // Connect to the database
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    
    console.log('Connected to database. Checking server/auth.ts file...');
    
    const serverDir = path.join(process.cwd(), 'server');
    const authPath = path.join(serverDir, 'auth.ts');
    const replitAuthPath = path.join(serverDir, 'replitAuth.ts');
    
    // Check if traditional auth.ts exists and replitAuth.ts doesn't
    if (fs.existsSync(authPath) && !fs.existsSync(replitAuthPath)) {
      console.log('✅ Standard auth.ts already exists. No migration needed.');
      process.exit(0);
    }
    
    // Rename the existing auth file if needed
    if (fs.existsSync(authPath)) {
      fs.renameSync(authPath, replitAuthPath);
      console.log('Renamed existing auth.ts to replitAuth.ts for backup');
    }
    
    // Create a new auth.ts file with JWT authentication
    const authContent = `// JWT Authentication for local development
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { users, type User, type InsertUser } from '@shared/schema';
import { storage } from './storage';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret';

/**
 * Generate a JWT token for a user
 * @param user User object
 * @returns JWT token string
 */
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

/**
 * Verify a JWT token
 * @param token JWT token string
 * @returns User payload or null if invalid
 */
export function verifyToken(token: string): { id: string; email: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Register a new user
 * @param userData User registration data
 * @returns User object and token, or error
 */
export async function registerUser(userData: InsertUser): Promise<{ user: Omit<User, "password">; token: string } | { error: string }> {
  try {
    // Check if user with this email already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return { error: "User with this email already exists" };
    }
    
    // Check if username is taken
    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      return { error: "Username already taken" };
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create user with a UUID
    const userId = crypto.randomUUID();
    const user = await storage.createUser({
      ...userData,
      id: userId,
      password: hashedPassword,
    });
    
    // Generate token
    const token = generateToken(user);
    
    // Return user without password and token
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  } catch (error) {
    console.error("Error registering user:", error);
    return { error: "Failed to register user" };
  }
}

/**
 * Login a user
 * @param credentials Login credentials (email and password)
 * @returns User object and token, or error
 */
export async function loginUser(credentials: { email: string; password: string }): Promise<{ user: Omit<User, "password">; token: string } | { error: string }> {
  try {
    // Find user by email
    const user = await storage.getUserByEmail(credentials.email);
    if (!user) {
      return { error: "Invalid email or password" };
    }
    
    // Check password
    const passwordMatches = await bcrypt.compare(credentials.password, user.password);
    if (!passwordMatches) {
      return { error: "Invalid email or password" };
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user without password and token
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  } catch (error) {
    console.error("Error logging in:", error);
    return { error: "Failed to login" };
  }
}

/**
 * Authentication middleware
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
  
  req.user = user;
  next();
}
`;
    
    // Write the new auth.ts file
    fs.writeFileSync(authPath, authContent);
    console.log('✅ Created new auth.ts file with JWT authentication');
    
    // Create the migrations directory if it doesn't exist
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('✅ Created migrations directory');
    }
    
    console.log('✅ Authentication migration complete!');
    console.log('NOTE: Make sure to set JWT_SECRET in your .env file for production.');
    process.exit(0);
    
  } catch (err) {
    console.error('Authentication migration failed:', err);
    process.exit(1);
  }
}

migrateAuth();