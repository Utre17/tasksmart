import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertTaskSchema, naturalLanguageInputSchema } from '@shared/schema';
import { asyncHandler, ApiError } from '../utils/errorHandler';
import * as logger from '../utils/logger';
import { processTaskWithAI, summarizeTask } from '../openrouter';

const tasksRouter = express.Router();

/**
 * Process a task with AI assistance
 */
tasksRouter.post("/process", asyncHandler(async (req: Request, res: Response) => {
  const { input } = req.body;
  
  if (!input || typeof input !== 'string') {
    throw new ApiError("Task input is required", 400);
  }
  
  try {
    // Create a basic task with the input text
    const task = {
      title: input,
      description: '',
      category: 'Personal',
      priority: 'Medium',
      dueDate: null,
    };
    
    // Send response with the basic task
    res.json(task);
  } catch (error) {
    // Log the detailed error for debugging
    logger.error("Task processing error", error, "tasks");
    
    // Send a more specific error message to the client
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError("Failed to process task. Please try again with simpler input.", 500);
    }
  }
}));

/**
 * AI-powered task text summarization
 */
tasksRouter.post('/summarize', asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;
  
  if (!text) {
    throw new ApiError("No text provided for summarization", 400);
  }
  
  try {
    // Use the real OpenRouter AI summarization
    const summary = await summarizeTask(text);
    logger.log(`Text summarized: ${text.substring(0, 50)}...`, "tasks");
    return res.json({ summary });
  } catch (error) {
    logger.error("Error summarizing task", error);
    throw new ApiError("Failed to summarize text", 500);
  }
}));

/**
 * Get all tasks for the authenticated user
 */
tasksRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  
  if (!userId) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  logger.debug(`Fetching tasks for user ${userId}`);
  const tasks = await storage.getTasksByUserId(userId);
  return res.json(tasks);
}));

/**
 * Get task by ID (with ownership check)
 */
tasksRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const id = parseInt(req.params.id, 10);
  
  if (!userId) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  if (isNaN(id)) {
    throw new ApiError("Invalid task ID", 400);
  }

  const task = await storage.getTaskById(id);
  
  if (!task) {
    throw new ApiError("Task not found", 404);
  }

  // Check if the task belongs to the user
  if (task.userId && task.userId !== userId) {
    throw new ApiError("You don't have permission to access this task", 403);
  }

  return res.json(task);
}));

/**
 * Get tasks by category
 */
tasksRouter.get('/category/:category', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const { category } = req.params;
  
  if (!userId) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  logger.debug(`Fetching ${category} tasks for user ${userId}`);
  const tasks = await storage.getTasksByCategory(category, userId);
  return res.json(tasks);
}));

/**
 * Get tasks by priority
 */
tasksRouter.get('/priority/:priority', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const { priority } = req.params;
  
  if (!userId) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  logger.debug(`Fetching ${priority} priority tasks for user ${userId}`);
  const tasks = await storage.getTasksByPriority(priority, userId);
  return res.json(tasks);
}));

/**
 * Create a new task
 */
tasksRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  
  if (!userId) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  try {
    const taskData = { ...req.body, userId };
    const validatedData = insertTaskSchema.parse(taskData);
    const newTask = await storage.createTask(validatedData);
    
    logger.log(`Task created: ${newTask.id} for user ${userId}`, "tasks");
    return res.status(201).json(newTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Task validation error", error.format());
      throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
    }
    throw error;
  }
}));

/**
 * Update an existing task
 */
tasksRouter.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const id = parseInt(req.params.id, 10);
  
  if (!userId) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  if (isNaN(id)) {
    throw new ApiError("Invalid task ID", 400);
  }

  const existingTask = await storage.getTaskById(id);
  
  if (!existingTask) {
    throw new ApiError("Task not found", 404);
  }

  // Check if the task belongs to the user
  if (existingTask.userId && existingTask.userId !== userId) {
    throw new ApiError("You don't have permission to update this task", 403);
  }

  try {
    // Partial validation of update data
    const updateSchema = insertTaskSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    const updatedTask = await storage.updateTask(id, validatedData);
    logger.log(`Task updated: ${id} by user ${userId}`, "tasks");
    return res.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Task validation error", error.format());
      throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
    }
    throw error;
  }
}));

/**
 * Delete a task
 */
tasksRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const id = parseInt(req.params.id, 10);
  
  if (!userId) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  if (isNaN(id)) {
    throw new ApiError("Invalid task ID", 400);
  }

  const existingTask = await storage.getTaskById(id);
  
  if (!existingTask) {
    throw new ApiError("Task not found", 404);
  }

  // Check if the task belongs to the user
  if (existingTask.userId && existingTask.userId !== userId) {
    throw new ApiError("You don't have permission to delete this task", 403);
  }

  const success = await storage.deleteTask(id);
  logger.log(`Task deleted: ${id} by user ${userId}`, "tasks");
  return res.json({ success });
}));

/**
 * Toggle task completion
 */
tasksRouter.patch('/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const id = parseInt(req.params.id, 10);
  
  if (!userId) {
    throw new ApiError("User ID not found in token", 400);
  }
  
  if (isNaN(id)) {
    throw new ApiError("Invalid task ID", 400);
  }

  const existingTask = await storage.getTaskById(id);
  
  if (!existingTask) {
    throw new ApiError("Task not found", 404);
  }

  // Check if the task belongs to the user
  if (existingTask.userId && existingTask.userId !== userId) {
    throw new ApiError("You don't have permission to update this task", 403);
  }

  const { completed } = req.body;
  
  if (typeof completed !== "boolean") {
    throw new ApiError("completed field must be a boolean", 400);
  }

  const updatedTask = await storage.completeTask(id, completed);
  logger.log(`Task ${id} completion status set to ${completed} by user ${userId}`, "tasks");
  return res.json(updatedTask);
}));

export default tasksRouter; 