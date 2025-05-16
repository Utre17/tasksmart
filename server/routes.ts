import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTaskSchema, naturalLanguageInputSchema, taskSuggestionSchema } from "@shared/schema";
import { processTaskWithAI, summarizeTask } from "./openrouter";
import { setupTables } from "./migrations";
import { verifyFirebaseToken, requireAdmin } from "./auth";
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

  // Admin analytics routes (protected)
  const adminRouter = express.Router();
  apiRouter.use("/admin", verifyFirebaseToken, requireAdmin, adminRouter);

  // Get overall system statistics (admin only)
  adminRouter.get("/stats", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const tasks = await storage.getAllTasks();
      
      const tasksByCategory = {
        Personal: tasks.filter(task => task.category === "Personal").length,
        Work: tasks.filter(task => task.category === "Work").length,
        Important: tasks.filter(task => task.category === "Important").length,
      };
      
      const tasksByPriority = {
        High: tasks.filter(task => task.priority === "High").length,
        Medium: tasks.filter(task => task.priority === "Medium").length,
        Low: tasks.filter(task => task.priority === "Low").length,
      };
      
      const completedTasks = tasks.filter(task => task.completed).length;
      const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
      
      return res.json({
        userCount: users.length,
        taskCount: tasks.length,
        completedTasks,
        completionRate: Math.round(completionRate),
        tasksByCategory,
        tasksByPriority
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  // Task routes (protected)
  const tasksRouter = express.Router();
  apiRouter.use("/tasks", tasksRouter);

  // Get all tasks for the current user
  tasksRouter.get("/", verifyFirebaseToken, async (req: any, res: Response) => {
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
  tasksRouter.get("/category/:category", verifyFirebaseToken, async (req: any, res: Response) => {
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
  tasksRouter.get("/priority/:priority", verifyFirebaseToken, async (req: any, res: Response) => {
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
  tasksRouter.get("/:id", verifyFirebaseToken, async (req: any, res: Response) => {
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
  tasksRouter.post("/suggestions", verifyFirebaseToken, async (req: any, res: Response) => {
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
  tasksRouter.post("/process", verifyFirebaseToken, async (req: any, res: Response) => {
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
  tasksRouter.post("/summarize", verifyFirebaseToken, async (req: any, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Text is required" });
      }
      
      try {
        const summary = await summarizeTask(text);
        return res.json({ summary });
      } catch (aiError) {
        console.error("AI summarization error:", aiError);
        // Fallback to basic summarization if AI fails
        const fallbackSummary = text.length > 100 ? text.substring(0, 97) + "..." : text;
        return res.json({ 
          summary: fallbackSummary,
          note: "Used fallback summarization due to AI service error" 
        });
      }
    } catch (error) {
      console.error("Error summarizing text:", error);
      return res.status(500).json({ 
        message: "Failed to summarize text",
        success: false
      });
    }
  });

  // Create task (manual)
  tasksRouter.post("/", verifyFirebaseToken, async (req: any, res: Response) => {
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
  tasksRouter.patch("/:id", verifyFirebaseToken, async (req: any, res: Response) => {
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
  tasksRouter.patch("/:id/complete", verifyFirebaseToken, async (req: any, res: Response) => {
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
  tasksRouter.delete("/:id", verifyFirebaseToken, async (req: any, res: Response) => {
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

  // Clear all completed tasks for the current user
  tasksRouter.delete("/completed", verifyFirebaseToken, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      
      // Get all completed tasks for the user
      const completedTasks = await storage.getTasksByUserId(userId, true);
      
      if (completedTasks.length === 0) {
        return res.json({ success: true, count: 0, message: "No completed tasks to clear" });
      }
      
      // Delete each completed task
      let deletedCount = 0;
      for (const task of completedTasks) {
        const success = await storage.deleteTask(task.id);
        if (success) deletedCount++;
      }
      
      return res.json({ 
        success: true, 
        count: deletedCount,
        message: `Successfully cleared ${deletedCount} completed tasks` 
      });
    } catch (error) {
      console.error("Error clearing completed tasks:", error);
      return res.status(500).json({ message: "Failed to clear completed tasks", success: false });
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
      // Firebase Auth handles password management now
      const user = await storage.createUser({
        email: "test@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User"
      });
      
      return res.status(201).json(user);
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

  // Analytics routes
  apiRouter.get("/analytics/user", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get total tasks
      const totalTasksQuery = await storage.getTotalTasksByUserId(userId);
      
      const totalTasks = parseInt(totalTasksQuery[0].count.toString());
      
      // Get completed tasks
      const completedTasksQuery = await storage.getCompletedTasksByUserId(userId);
      
      const completedTasks = parseInt(completedTasksQuery[0].count.toString());
      
      // Get priority distribution
      const priorityDistQuery = await storage.getTasksByPriorityAndUserId(userId);
      
      const priorityDist = priorityDistQuery.map(item => {
        let color = "#3b82f6"; // Default blue
        if (item.priority === "High") color = "#f97316"; // Orange
        if (item.priority === "Low") color = "#22c55e"; // Green
        
        return {
          name: item.priority,
          value: parseInt(item.count.toString()),
          color
        };
      });
      
      // Get AI usage count
      const aiUsageQuery = await storage.getAIUsageCountByUserId(userId);
      
      const aiUsageCount = parseInt(aiUsageQuery[0]?.count?.toString() || "0");
      
      return res.json({
        totalTasks,
        completedTasks,
        priorityDist,
        aiUsageCount
      });
    } catch (error) {
      console.error("Error getting user analytics:", error);
      return res.status(500).json({ message: "Failed to retrieve analytics data" });
    }
  });

  apiRouter.get("/analytics/tasks/completion", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get completion rate over time
      const completionRateQuery = await storage.getCompletionRateOverTimeByUserId(userId);
      
      return res.json({
        completionRates: completionRateQuery.map(row => ({
          date: new Date(row.day).toISOString().split('T')[0],
          completedCount: parseInt(row.completed_count),
          totalCount: parseInt(row.total_count),
          rate: Math.round((parseInt(row.completed_count) / parseInt(row.total_count)) * 100)
        }))
      });
    } catch (error) {
      console.error("Error getting completion stats:", error);
      return res.status(500).json({ message: "Failed to retrieve completion statistics" });
    }
  });

  apiRouter.get("/analytics/tasks/by-date", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const period = req.query.period as string || "week";
      
      let timeConstraint = storage.getTimeConstraint(period);
      
      // Get tasks completed by date
      const tasksByDateQuery = await storage.getTasksCompletedByDate(userId, timeConstraint);
      
      return res.json({
        completedByDate: tasksByDateQuery.map(row => {
          const date = new Date(row.day);
          const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
          return {
            date: dateStr,
            completed: parseInt(row.completed)
          };
        })
      });
    } catch (error) {
      console.error("Error getting tasks by date:", error);
      return res.status(500).json({ message: "Failed to retrieve tasks by date" });
    }
  });

  apiRouter.get("/analytics/ai-usage", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get total AI usage
      const totalUsageQuery = await storage.getTotalAIUsageByUserId(userId);
      
      const totalUsage = parseInt(totalUsageQuery[0]?.count?.toString() || "0");
      
      // Get AI usage by date
      const usageByDateQuery = await storage.getAIUsageByDate(userId);
      
      return res.json({
        totalUsage,
        usageByDate: usageByDateQuery.map(row => {
          const date = new Date(row.day);
          const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
          return {
            date: dateStr,
            count: parseInt(row.count)
          };
        })
      });
    } catch (error) {
      console.error("Error getting AI usage stats:", error);
      return res.status(500).json({ message: "Failed to retrieve AI usage statistics" });
    }
  });

  // User settings and preferences routes
  apiRouter.post("/auth/password", verifyFirebaseToken, async (req, res) => {
    try {
      // Password changes should be handled through Firebase Auth directly
      return res.status(501).json({ 
        message: "Password changes should be handled through Firebase Auth directly",
        info: "Use firebase.auth().currentUser.updatePassword() from the client" 
      });
    } catch (error) {
      console.error("Error with password route:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/auth/preferences", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const preferences = req.body;
      
      // Validate preferences with zod schema
      const validPreferences = storage.validatePreferences(preferences);
      
      // Get current user
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
      console.error("Error updating preferences:", error);
      return res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  apiRouter.get("/auth/sessions", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user sessions
      const sessions = await storage.getUserSessions(userId);
      
      // Get user last login
      const lastLogin = await storage.getUserLastLogin(userId);
      
      return res.json({
        sessions: sessions.map(session => ({
          id: session.id,
          device: session.device,
          ip: session.ip,
          lastActive: session.lastActive,
          createdAt: session.createdAt
        })),
        lastLogin: lastLogin || null
      });
    } catch (error) {
      console.error("Error getting user sessions:", error);
      return res.status(500).json({ message: "Failed to retrieve session information" });
    }
  });

  apiRouter.delete("/auth/sessions/:sessionId", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId;
      
      // Delete the session
      const result = await storage.deleteUserSession(userId, sessionId);
      
      if (result.length === 0) {
        return res.status(404).json({ message: "Session not found or already deleted" });
      }
      
      return res.json({ success: true, message: "Session revoked successfully" });
    } catch (error) {
      console.error("Error revoking session:", error);
      return res.status(500).json({ message: "Failed to revoke session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
