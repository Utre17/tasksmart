import { migrationClient } from "./db";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "@shared/schema";
import type { Sql } from "postgres";

// Function to run database migrations
export async function runMigrations() {
  try {
    const db = drizzle(migrationClient, { schema });
    
    console.log("Running migrations...");
    
    // Run migrations
    await migrate(db, { migrationsFolder: "./drizzle" });
    
    console.log("Migrations completed successfully");
    
    return true;
  } catch (error) {
    console.error("Migration error:", error);
    return false;
  } finally {
    await migrationClient.end();
  }
}

// Create tables manually if migrations don't work
export async function setupTables() {
  const client: Sql<any> = migrationClient;
  try {
    console.log("Setting up database tables...");
    
    // Check if users table exists
    const userTableExists = await tableExists(client, "users");
    if (!userTableExists) {
      console.log("Creating users table...");
      await client.unsafe(
        `CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          username VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          profile_image_url VARCHAR(255),
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          preferences JSONB DEFAULT '{}',
          last_login TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );`
      );
    } else {
      // Check if role column exists and add it if it doesn't
      await addRoleColumnIfNotExists(client);
      // Check if preferences column exists and add it if it doesn't
      await addPreferencesColumnIfNotExists(client);
      // Check if last_login column exists and add it if it doesn't
      await addLastLoginColumnIfNotExists(client);
    }
    
    // Check if sessions table exists
    const sessionTableExists = await tableExists(client, "sessions");
    if (!sessionTableExists) {
      console.log("Creating sessions table...");
      await client.unsafe(
        `CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR PRIMARY KEY,
          sess TEXT NOT NULL,
          expire TIMESTAMP NOT NULL
        );`
      );
    }
    
    // Check if tasks table exists
    const tasksTableExists = await tableExists(client, "tasks");
    if (!tasksTableExists) {
      console.log("Creating tasks table...");
      await client.unsafe(
        `CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          category TEXT NOT NULL,
          priority TEXT NOT NULL,
          due_date TEXT,
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );`
      );
    }
    
    // Check if user_sessions table exists
    const userSessionsTableExists = await tableExists(client, "user_sessions");
    if (!userSessionsTableExists) {
      console.log("Creating user_sessions table...");
      await client.unsafe(
        `CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          token TEXT NOT NULL UNIQUE,
          ip VARCHAR(50),
          device VARCHAR(255),
          last_active TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMP NOT NULL
        );`
      );
    }
    
    // Check if ai_usage table exists
    const aiUsageTableExists = await tableExists(client, "ai_usage");
    if (!aiUsageTableExists) {
      console.log("Creating ai_usage table...");
      await client.unsafe(
        `CREATE TABLE IF NOT EXISTS ai_usage (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          model VARCHAR(100) NOT NULL,
          prompt TEXT,
          tokens_used INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );`
      );
    }
    
    console.log("Database setup completed successfully");
    return true;
  } catch (error) {
    console.error("Database setup error:", error);
    return false;
  } finally {
    await client.end();
  }
}

// Helper function to check if a table exists
async function tableExists(client: any, tableName: string): Promise<boolean> {
  const result = await client.unsafe(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );`,
    [tableName]
  );
  return result[0]?.exists || false;
}

// Helper function to add role column if it doesn't exist
async function addRoleColumnIfNotExists(client: any): Promise<void> {
  try {
    const roleColumnExists = await columnExists(client, 'users', 'role');
    
    if (!roleColumnExists) {
      console.log("Adding role column to users table...");
      await client.unsafe(
        `ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';`
      );
      console.log("Role column added successfully");
    }
  } catch (error) {
    console.error("Error adding role column:", error);
  }
}

// Helper function to add preferences column if it doesn't exist
async function addPreferencesColumnIfNotExists(client: any): Promise<void> {
  try {
    const preferencesExists = await columnExists(client, 'users', 'preferences');
    
    if (!preferencesExists) {
      console.log("Adding preferences column to users table...");
      await client.unsafe(
        `ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';`
      );
      console.log("Preferences column added successfully");
    }
  } catch (error) {
    console.error("Error adding preferences column:", error);
  }
}

// Helper function to add last_login column if it doesn't exist
async function addLastLoginColumnIfNotExists(client: any): Promise<void> {
  try {
    const lastLoginExists = await columnExists(client, 'users', 'last_login');
    
    if (!lastLoginExists) {
      console.log("Adding last_login column to users table...");
      await client.unsafe(
        `ALTER TABLE users ADD COLUMN last_login TIMESTAMP;`
      );
      console.log("Last login column added successfully");
    }
  } catch (error) {
    console.error("Error adding last_login column:", error);
  }
}

// Helper function to check if a column exists
async function columnExists(client: any, tableName: string, columnName: string): Promise<boolean> {
  const result = await client.unsafe(
    `SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      AND column_name = $2
    );`,
    [tableName, columnName]
  );
  return result[0]?.exists || false;
}