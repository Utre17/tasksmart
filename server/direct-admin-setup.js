/**
 * Direct admin setup script using Neon serverless PostgreSQL
 * 
 * This script directly uses Neon's serverless driver to create an admin user
 * without requiring a local PostgreSQL installation.
 */

import { hash } from 'bcrypt';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// Set up connection to Neon Serverless PostgreSQL
const NEON_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:postgres@ep-cold-bush-a1phjz4u.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function hashPassword(password) {
  return await hash(password, 10);
}

async function setupAdminUser() {
  try {
    console.log('Connecting to Neon PostgreSQL database...');
    const sql = neon(NEON_CONNECTION_STRING);
    
    // Check if users table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `;
    
    if (!tableExists[0]?.exists) {
      console.log('Creating users table...');
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE,
          password TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
    }
    
    // Check if admin user exists
    const adminExists = await sql`
      SELECT EXISTS (
        SELECT FROM users 
        WHERE role = 'admin'
      );
    `;
    
    if (!adminExists[0]?.exists) {
      console.log('Creating admin user...');
      
      // Default admin credentials
      const email = 'admin@tasksmart.com';
      const password = 'Admin123!';
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create a UUID for the user
      const id = crypto.randomUUID();
      
      // Insert admin user
      await sql`
        INSERT INTO users (
          id, email, username, password, first_name, last_name, role
        ) VALUES (
          ${id}, ${email}, 'admin', ${hashedPassword}, 'Admin', 'User', 'admin'
        )
      `;
      
      console.log('Admin user created successfully:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Admin setup complete');
  } catch (error) {
    console.error('Error setting up admin user:', error);
  }
}

// Run the setup
setupAdminUser(); 