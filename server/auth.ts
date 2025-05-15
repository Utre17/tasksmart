import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { InsertUser, LoginUser, User, SelectUser } from "@shared/schema";

// Secret key for JWT signing
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_in_production";
// Token expiration (1 day)
const TOKEN_EXPIRATION = 60 * 60 * 24;

// Helper to create a token
export function generateToken(user: User): string {
  // Create payload (don't include sensitive data)
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

// Helper to verify a token
export function verifyToken(token: string): { id: string; email: string; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string };
  } catch (error) {
    return null;
  }
}

// Register a new user
export async function registerUser(userData: InsertUser): Promise<{ user: Omit<User, "password">; token: string } | { error: string }> {
  try {
    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      return { error: "Email already in use" };
    }
    
    // Check if username already exists
    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      return { error: "Username already in use" };
    }
    
    // Create user
    const user = await storage.createUser(userData);
    
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

// Login a user
export async function loginUser(credentials: LoginUser): Promise<{ user: Omit<User, "password">; token: string } | { error: string }> {
  try {
    // Find user by email
    const user = await storage.getUserByEmail(credentials.email);
    if (!user) {
      return { error: "Invalid email or password" };
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(credentials.password, user.password);
    if (!passwordMatch) {
      return { error: "Invalid email or password" };
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user without password and token
    const { password, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  } catch (error) {
    console.error("Error logging in user:", error);
    return { error: "Failed to login" };
  }
}

// Middleware to protect routes
export function authenticateToken(req: any, res: any, next: any) {
  // Get token from header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
  
  // Add user to request
  req.user = user;
  next();
}