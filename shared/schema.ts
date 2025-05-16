import { pgTable, text, serial, integer, boolean, timestamp, uuid, varchar, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Define user roles
export const userRoles = ["user", "admin"] as const;
export const roleSchema = z.enum(userRoles);

// Define user preferences schema
export const userPreferencesSchema = z.object({
  enableNotifications: z.boolean().default(true),
  enableAIFeatures: z.boolean().default(true),
  darkMode: z.boolean().default(false),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// User schema with enhanced fields for authentication and proper indexing
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  preferences: jsonb("preferences").default({}),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    emailIdx: index("email_idx").on(table.email),
    usernameIdx: index("username_idx").on(table.username),
    roleIdx: index("role_idx").on(table.role)
  };
});

// For authentication - don't include password in select
export const selectUserSchema = createInsertSchema(users).omit({
  password: true,
  createdAt: true,
  updatedAt: true,
});

// For registration
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  firstName: true,
  lastName: true,
});

// For login
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Session storage schema for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => {
  return {
    expireIdx: index("expire_idx").on(table.expire)
  };
});

// User sessions for multiple device login
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  ip: varchar("ip", { length: 50 }),
  device: varchar("device", { length: 255 }),
  lastActive: timestamp("last_active").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => {
  return {
    userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
    tokenIdx: index("user_sessions_token_idx").on(table.token)
  };
});

// AI usage tracking
export const aiUsage = pgTable("ai_usage", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  prompt: text("prompt"),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("ai_usage_user_id_idx").on(table.userId),
    createdAtIdx: index("ai_usage_created_at_idx").on(table.createdAt)
  };
});

// Task schema with user relationship and proper indexing
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  category: text("category").notNull(), // "Personal", "Work", "Important"
  priority: text("priority").notNull(), // "High", "Medium", "Low"
  dueDate: text("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("user_id_idx").on(table.userId),
    categoryIdx: index("category_idx").on(table.category),
    priorityIdx: index("priority_idx").on(table.priority),
    completedIdx: index("completed_idx").on(table.completed),
    userCategoryIdx: index("user_category_idx").on(table.userId, table.category),
    userPriorityIdx: index("user_priority_idx").on(table.userId, table.priority),
    userCompletedIdx: index("user_completed_idx").on(table.userId, table.completed)
  };
});

// Relations setup
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  aiUsage: many(aiUsage),
  sessions: many(userSessions),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  user: one(users, {
    fields: [aiUsage.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const taskCategories = ["Personal", "Work", "Important"] as const;
export const taskPriorities = ["High", "Medium", "Low"] as const;

export const categorySchema = z.enum(taskCategories);
export const prioritySchema = z.enum(taskPriorities);

export const naturalLanguageInputSchema = z.object({
  input: z.string().min(1, "Task description is required"),
});

// Enhanced task suggestions schema
export const taskSuggestionSchema = z.object({
  taskInput: z.string().min(1, "Task description is required"),
  count: z.number().optional().default(3),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UserRole = z.infer<typeof roleSchema>;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type Category = z.infer<typeof categorySchema>;
export type Priority = z.infer<typeof prioritySchema>;
