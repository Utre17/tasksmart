import { migrationClient } from "./db";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "@shared/schema";

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
  const client = migrationClient;
  try {
    console.log("Setting up database tables...");
    
    // Check if users table exists
    const userTableExists = await tableExists(client, "users");
    if (!userTableExists) {
      console.log("Creating users table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          username VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          profile_image_url VARCHAR(255),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
    }
    
    // Check if sessions table exists
    const sessionTableExists = await tableExists(client, "sessions");
    if (!sessionTableExists) {
      console.log("Creating sessions table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR PRIMARY KEY,
          sess TEXT NOT NULL,
          expire TIMESTAMP NOT NULL
        );
      `);
    }
    
    // Check if tasks table exists
    const tasksTableExists = await tableExists(client, "tasks");
    if (!tasksTableExists) {
      console.log("Creating tasks table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
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
        );
      `);
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
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  
  return result[0]?.exists || false;
}