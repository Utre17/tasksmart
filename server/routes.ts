import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTaskSchema, naturalLanguageInputSchema } from "@shared/schema";
import { processTaskWithAI } from "./openrouter";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Get all tasks
  apiRouter.get("/tasks", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getAllTasks();
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get tasks by category
  apiRouter.get("/tasks/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const tasks = await storage.getTasksByCategory(category);
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks by category:", error);
      return res.status(500).json({ message: "Failed to fetch tasks by category" });
    }
  });

  // Get tasks by priority
  apiRouter.get("/tasks/priority/:priority", async (req: Request, res: Response) => {
    try {
      const { priority } = req.params;
      const tasks = await storage.getTasksByPriority(priority);
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks by priority:", error);
      return res.status(500).json({ message: "Failed to fetch tasks by priority" });
    }
  });

  // Get task by ID
  apiRouter.get("/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      return res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Create task with natural language processing
  apiRouter.post("/tasks/process", async (req: Request, res: Response) => {
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

  // Create task (manual)
  apiRouter.post("/tasks", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
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

  // Update task
  apiRouter.patch("/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const existingTask = await storage.getTaskById(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
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

  // Toggle task completion
  apiRouter.patch("/tasks/:id/complete", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const { completed } = req.body;
      if (typeof completed !== "boolean") {
        return res.status(400).json({ message: "completed field must be a boolean" });
      }

      const updatedTask = await storage.completeTask(id, completed);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.json(updatedTask);
    } catch (error) {
      console.error("Error completing task:", error);
      return res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // Delete task
  apiRouter.delete("/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ message: "Failed to delete task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
