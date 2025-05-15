import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTaskSchema, naturalLanguageInputSchema, taskSuggestionSchema } from "@shared/schema";
import { processTaskWithAI } from "./openrouter";
import { setupTables } from "./migrations";
import { authenticateToken } from "./auth";
import authRouter from "./auth-routes";
// Import the enhanced AI capabilities
import fs from 'fs';
import path from 'path';

// Fallback mock implementation for AI capabilities
const mockAICapabilities = {
  generateTaskSuggestions: async (taskInput: string, count: number = 3) => {
    return [
      { title: `Follow up on: ${taskInput}`, category: "Important", priority: "Medium" },
      { title: `Prepare materials for: ${taskInput}`, category: "Work", priority: "Low" },
      { title: `Review progress on: ${taskInput}`, category: "Personal", priority: "Low" },
    ];
  },
  summarizeText: async (text: string) => {
    return text.length > 100 ? text.substring(0, 97) + "..." : text;
  },
  generateTaskInsights: async (tasks: any[]) => {
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    
    return {
      summary: "You've been making steady progress on your tasks.",
      suggestion: "Consider prioritizing high-importance tasks first to improve productivity.",
      completionRate: Math.round(completionRate)
    };
  }
};

// Use the mock implementation for now
const enhanceAICapabilities = mockAICapabilities;

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up database tables
  await setupTables();

  // API Routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Auth routes (unprotected)
  apiRouter.use("/auth", authRouter);

  // Task routes (protected)
  const tasksRouter = express.Router();
  apiRouter.use("/tasks", tasksRouter);

  // Get all tasks for the current user
  tasksRouter.get("/", authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const tasks = await storage.getTasksByUserId(userId);
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get tasks by category for the current user
  tasksRouter.get("/category/:category", authenticateToken, async (req: any, res: Response) => {
    try {
      const { category } = req.params;
      const userId = req.user.id;
      const tasks = await storage.getTasksByCategory(category, userId);
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks by category:", error);
      return res.status(500).json({ message: "Failed to fetch tasks by category" });
    }
  });

  // Get tasks by priority for the current user
  tasksRouter.get("/priority/:priority", authenticateToken, async (req: any, res: Response) => {
    try {
      const { priority } = req.params;
      const userId = req.user.id;
      const tasks = await storage.getTasksByPriority(priority, userId);
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks by priority:", error);
      return res.status(500).json({ message: "Failed to fetch tasks by priority" });
    }
  });

  // Get task by ID (check ownership)
  tasksRouter.get("/:id", authenticateToken, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if the task belongs to the user
      if (task.userId && task.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to access this task" });
      }

      return res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      return res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Get AI task suggestions (enhanced)
  tasksRouter.post("/suggestions", authenticateToken, async (req: any, res: Response) => {
    try {
      const validatedData = taskSuggestionSchema.parse(req.body);
      const suggestions = await enhanceAICapabilities.generateTaskSuggestions(
        validatedData.taskInput,
        validatedData.count
      );
      
      return res.json(suggestions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error generating task suggestions:", error);
      return res.status(500).json({ message: "Failed to generate task suggestions" });
    }
  });

  // Create task with natural language processing
  tasksRouter.post("/process", authenticateToken, async (req: any, res: Response) => {
    try {
      const validatedData = naturalLanguageInputSchema.parse(req.body);
      const processedTask = await processTaskWithAI(validatedData.input);
      
      const newTask = await storage.createTask({
        title: processedTask.title,
        category: processedTask.category,
        priority: processedTask.priority,
        dueDate: processedTask.dueDate,
        notes: processedTask.notes,
        completed: false,
        userId: req.user.id
      });

      return res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error processing task:", error);
      return res.status(500).json({ message: "Failed to process task" });
    }
  });

  // Summarize task description (AI enhancement)
  tasksRouter.post("/summarize", authenticateToken, async (req: any, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const summary = await enhanceAICapabilities.summarizeText(text);
      return res.json({ summary });
    } catch (error) {
      console.error("Error summarizing text:", error);
      return res.status(500).json({ message: "Failed to summarize text" });
    }
  });

  // Create task (manual)
  tasksRouter.post("/", authenticateToken, async (req: any, res: Response) => {
    try {
      const taskData = { ...req.body, userId: req.user.id };
      const validatedData = insertTaskSchema.parse(taskData);
      const newTask = await storage.createTask(validatedData);
      return res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating task:", error);
      return res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Update task (check ownership)
  tasksRouter.patch("/:id", authenticateToken, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const existingTask = await storage.getTaskById(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if the task belongs to the user
      if (existingTask.userId && existingTask.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this task" });
      }

      // Partial validation of update data
      const updateSchema = insertTaskSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedTask = await storage.updateTask(id, validatedData);
      return res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating task:", error);
      return res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Toggle task completion (check ownership)
  tasksRouter.patch("/:id/complete", authenticateToken, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const existingTask = await storage.getTaskById(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if the task belongs to the user
      if (existingTask.userId && existingTask.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this task" });
      }

      const { completed } = req.body;
      if (typeof completed !== "boolean") {
        return res.status(400).json({ message: "completed field must be a boolean" });
      }

      const updatedTask = await storage.completeTask(id, completed);
      return res.json(updatedTask);
    } catch (error) {
      console.error("Error completing task:", error);
      return res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // Delete task (check ownership)
  tasksRouter.delete("/:id", authenticateToken, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const existingTask = await storage.getTaskById(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if the task belongs to the user
      if (existingTask.userId && existingTask.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this task" });
      }

      const success = await storage.deleteTask(id);
      return res.json({ success });
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Temporary development endpoints (will be removed in production)
  // Get all tasks for development
  apiRouter.get("/dev/tasks", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getAllTasks();
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      return res.status(500).json({ message: "Failed to fetch all tasks" });
    }
  });
  
  // Create a development user for testing
  apiRouter.post("/dev/create-user", async (req: Request, res: Response) => {
    try {
      // Hash the password just like we would in registration
      const password = await bcrypt.hash("password123", 10);
      
      const user = await storage.createUser({
        email: "test@example.com",
        username: "testuser",
        password,
        firstName: "Test",
        lastName: "User"
      });
      
      // Return user without password
      const { password: pwd, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating test user:", error);
      return res.status(500).json({ message: "Failed to create test user" });
    }
  });
  
  // Create sample tasks for development
  apiRouter.post("/dev/create-sample-tasks", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const sampleTasks = [
        {
          title: "Call mom tomorrow at 5 PM",
          completed: false,
          category: "Personal",
          priority: "Medium",
          dueDate: "Tomorrow, 5:00 PM",
          userId
        },
        {
          title: "Prepare quarterly report for management review",
          completed: false,
          category: "Work",
          priority: "High",
          dueDate: "Oct 15, 2023",
          notes: "Include sales figures, customer feedback, and projections for Q4",
          userId
        },
        {
          title: "Book dentist appointment for next week",
          completed: false,
          category: "Personal",
          priority: "Low",
          dueDate: "Next Week",
          userId
        },
        {
          title: "Submit proposal for the new client project",
          completed: false,
          category: "Work",
          priority: "High",
          dueDate: "Oct 10, 2023",
          userId
        },
        {
          title: "Order groceries for the week",
          completed: true,
          category: "Personal",
          priority: "Medium",
          dueDate: "",
          userId
        }
      ];
      
      const createdTasks = [];
      for (const task of sampleTasks) {
        const newTask = await storage.createTask(task);
        createdTasks.push(newTask);
      }
      
      return res.status(201).json(createdTasks);
    } catch (error) {
      console.error("Error creating sample tasks:", error);
      return res.status(500).json({ message: "Failed to create sample tasks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
