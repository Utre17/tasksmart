import express, { Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { authenticateToken, loginUser, registerUser } from "./auth";
import { insertUserSchema, loginUserSchema } from "@shared/schema";

const authRouter = express.Router();

// Register a new user
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validatedData = insertUserSchema.parse(req.body);
    
    // Register user
    const result = await registerUser(validatedData);
    
    if ("error" in result) {
      return res.status(400).json({ message: result.error });
    }
    
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Failed to register user" });
  }
});

// Login a user
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validatedData = loginUserSchema.parse(req.body);
    
    // Login user
    const result = await loginUser(validatedData);
    
    if ("error" in result) {
      return res.status(401).json({ message: result.error });
    }
    
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Failed to login" });
  }
});

// Get current user
authRouter.get("/me", authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    
    return res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

export default authRouter;