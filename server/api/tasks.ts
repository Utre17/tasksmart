import express, { Request, Response } from 'express';
import { verifyFirebaseToken } from '../auth';
import { storage } from '../storage';
import { z } from 'zod';
import { insertTaskSchema } from '@shared/schema';
import { asyncHandler } from '../utils/errorHandler';

const tasksRouter = express.Router();

/**
 * Get all tasks for the authenticated user
 */
tasksRouter.get('/', verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  
  if (!userId) {
    return res.status(400).json({ error: true, message: "User ID not found in token" });
  }
  
  const tasks = await storage.getTasksByUserId(userId);
  return res.json(tasks);
}));

/**
 * Get task by ID (with ownership check)
 */
tasksRouter.get('/:id', verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const id = parseInt(req.params.id, 10);
  
  if (!userId) {
    return res.status(400).json({ error: true, message: "User ID not found in token" });
  }
  
  if (isNaN(id)) {
    return res.status(400).json({ error: true, message: "Invalid task ID" });
  }

  const task = await storage.getTaskById(id);
  
  if (!task) {
    return res.status(404).json({ error: true, message: "Task not found" });
  }

  // Check if the task belongs to the user
  if (task.userId && task.userId !== userId) {
    return res.status(403).json({ error: true, message: "You don't have permission to access this task" });
  }

  return res.json(task);
}));

/**
 * Get tasks by category
 */
tasksRouter.get('/category/:category', verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const { category } = req.params;
  
  if (!userId) {
    return res.status(400).json({ error: true, message: "User ID not found in token" });
  }
  
  const tasks = await storage.getTasksByCategory(category, userId);
  return res.json(tasks);
}));

/**
 * Get tasks by priority
 */
tasksRouter.get('/priority/:priority', verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const { priority } = req.params;
  
  if (!userId) {
    return res.status(400).json({ error: true, message: "User ID not found in token" });
  }
  
  const tasks = await storage.getTasksByPriority(priority, userId);
  return res.json(tasks);
}));

/**
 * Create a new task
 */
tasksRouter.post('/', verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  
  if (!userId) {
    return res.status(400).json({ error: true, message: "User ID not found in token" });
  }
  
  const taskData = { ...req.body, userId };
  const validatedData = insertTaskSchema.parse(taskData);
  const newTask = await storage.createTask(validatedData);
  
  return res.status(201).json(newTask);
}));

/**
 * Update an existing task
 */
tasksRouter.put('/:id', verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const id = parseInt(req.params.id, 10);
  
  if (!userId) {
    return res.status(400).json({ error: true, message: "User ID not found in token" });
  }
  
  if (isNaN(id)) {
    return res.status(400).json({ error: true, message: "Invalid task ID" });
  }

  const existingTask = await storage.getTaskById(id);
  
  if (!existingTask) {
    return res.status(404).json({ error: true, message: "Task not found" });
  }

  // Check if the task belongs to the user
  if (existingTask.userId && existingTask.userId !== userId) {
    return res.status(403).json({ error: true, message: "You don't have permission to update this task" });
  }

  // Partial validation of update data
  const updateSchema = insertTaskSchema.partial();
  const validatedData = updateSchema.parse(req.body);
  
  const updatedTask = await storage.updateTask(id, validatedData);
  return res.json(updatedTask);
}));

/**
 * Delete a task
 */
tasksRouter.delete('/:id', verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const id = parseInt(req.params.id, 10);
  
  if (!userId) {
    return res.status(400).json({ error: true, message: "User ID not found in token" });
  }
  
  if (isNaN(id)) {
    return res.status(400).json({ error: true, message: "Invalid task ID" });
  }

  const existingTask = await storage.getTaskById(id);
  
  if (!existingTask) {
    return res.status(404).json({ error: true, message: "Task not found" });
  }

  // Check if the task belongs to the user
  if (existingTask.userId && existingTask.userId !== userId) {
    return res.status(403).json({ error: true, message: "You don't have permission to delete this task" });
  }

  const success = await storage.deleteTask(id);
  return res.json({ success });
}));

/**
 * Toggle task completion
 */
tasksRouter.patch('/:id/complete', verifyFirebaseToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const id = parseInt(req.params.id, 10);
  
  if (!userId) {
    return res.status(400).json({ error: true, message: "User ID not found in token" });
  }
  
  if (isNaN(id)) {
    return res.status(400).json({ error: true, message: "Invalid task ID" });
  }

  const existingTask = await storage.getTaskById(id);
  
  if (!existingTask) {
    return res.status(404).json({ error: true, message: "Task not found" });
  }

  // Check if the task belongs to the user
  if (existingTask.userId && existingTask.userId !== userId) {
    return res.status(403).json({ error: true, message: "You don't have permission to update this task" });
  }

  const { completed } = req.body;
  
  if (typeof completed !== "boolean") {
    return res.status(400).json({ error: true, message: "completed field must be a boolean" });
  }

  const updatedTask = await storage.completeTask(id, completed);
  return res.json(updatedTask);
}));

export default tasksRouter; 