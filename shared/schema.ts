import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Task schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  category: text("category").notNull(), // "Personal", "Work", "Important"
  priority: text("priority").notNull(), // "High", "Medium", "Low"
  dueDate: text("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const taskCategories = ["Personal", "Work", "Important"] as const;
export const taskPriorities = ["High", "Medium", "Low"] as const;

export const categorySchema = z.enum(taskCategories);
export const prioritySchema = z.enum(taskPriorities);

export const naturalLanguageInputSchema = z.object({
  input: z.string().min(1, "Task description is required"),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type Category = z.infer<typeof categorySchema>;
export type Priority = z.infer<typeof prioritySchema>;
