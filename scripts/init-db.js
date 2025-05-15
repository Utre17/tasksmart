// Database initialization script for TaskSmart
// This script creates the necessary database tables and adds a test user

import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { users, sessions, tasks } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Check if DATABASE_URL is defined
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    // Connect to the database
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    
    console.log('Connected to database. Creating tables...');
    
    // Create tables
    try {
      // Users table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          username TEXT UNIQUE,
          password TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          profile_image_url TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Users table created');
      
      // Sessions table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid TEXT PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        );
      `);
      console.log('✅ Sessions table created');
      
      // Tasks table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          notes TEXT,
          category TEXT NOT NULL,
          priority TEXT NOT NULL,
          due_date TEXT,
          completed BOOLEAN DEFAULT FALSE,
          user_id TEXT REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Tasks table created');
      
      // Create index on sessions expiry
      await db.execute(`
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
      `);
      console.log('✅ Session index created');
      
    } catch (err) {
      console.error('Error creating tables:', err);
      process.exit(1);
    }
    
    // Create test user if requested
    if (process.argv.includes('--create-test-user')) {
      try {
        // Hash the password
        const password = await bcrypt.hash('password123', 10);
        
        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, 'test@example.com'));
        
        if (existingUser.length === 0) {
          // Create test user
          const userId = crypto.randomUUID();
          await db.insert(users).values({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            password: password,
            firstName: 'Test',
            lastName: 'User',
            profileImageUrl: null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log('✅ Test user created (email: test@example.com, password: password123)');
          
          // Create sample tasks for the test user
          const sampleTasks = [
            {
              title: 'Call mom tomorrow at 5 PM',
              completed: false,
              category: 'Personal',
              priority: 'Medium',
              dueDate: 'Tomorrow, 5:00 PM',
              userId: userId,
              notes: null
            },
            {
              title: 'Prepare quarterly report for management review',
              completed: false,
              category: 'Work',
              priority: 'High',
              dueDate: 'Oct 15, 2023',
              notes: 'Include sales figures, customer feedback, and projections for Q4',
              userId: userId
            },
            {
              title: 'Book dentist appointment for next week',
              completed: false,
              category: 'Personal',
              priority: 'Low',
              dueDate: 'Next Week',
              userId: userId,
              notes: null
            }
          ];
          
          for (const task of sampleTasks) {
            await db.insert(tasks).values({
              ...task, 
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          console.log('✅ Sample tasks created for test user');
        } else {
          console.log('ℹ️ Test user already exists');
        }
      } catch (err) {
        console.error('Error creating test user:', err);
      }
    }
    
    console.log('✅ Database initialization complete!');
    process.exit(0);
    
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
}

initializeDatabase();