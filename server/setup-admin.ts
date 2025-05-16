import { migrationClient } from "./db";
import { hashPassword } from "./auth";
import crypto from "crypto";
import { MemStorage } from "./storage";
import * as dotenv from "dotenv";

// Try to load environment variables from multiple locations
dotenv.config();
dotenv.config({ path: "./.env" });
dotenv.config({ path: "./server/.env" });

// Create a memory storage instance for fallback
const memStorage = new MemStorage();

// Function to create the admin user if it doesn't exist
export async function setupAdminUser(email: string, password: string) {
  // Check if we have a valid database connection
  const isDatabaseAvailable = !!process.env.DATABASE_URL;
  
  try {
    console.log("Checking for admin user...");
    
    if (isDatabaseAvailable) {
      const client = migrationClient;
      try {
        // Check if admin user exists
        const adminExists = await client.unsafe(
          `SELECT EXISTS (
            SELECT FROM users 
            WHERE role = 'admin'
          );`
        );
        
        if (!adminExists[0]?.exists) {
          console.log("Creating admin user in database...");
          
          // Hash the password
          const hashedPassword = await hashPassword(password);
          
          // Create a UUID for the user
          const id = crypto.randomUUID();
          
          // Insert admin user
          await client.unsafe(
            `INSERT INTO users (
              id, email, username, password, first_name, last_name, role, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
            )`,
            [id, email, 'admin', hashedPassword, 'Admin', 'User', 'admin']
          );
          
          console.log("Admin user created successfully in database");
        } else {
          console.log("Admin user already exists in database");
        }
      } finally {
        await client.end();
      }
    } else {
      // Fallback to memory storage
      console.log("Using in-memory storage for admin setup");
      console.log("To use PostgreSQL, set the DATABASE_URL environment variable.");
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the admin user using memory storage
      const user = await memStorage.createUser({
        email,
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User'
      });
      
      // Set the role to admin (since MemStorage defaults to 'user')
      await memStorage.updateUser(user.id, { role: 'admin' });
      
      console.log("Admin user created successfully in memory storage");
      console.log("NOTE: This user will be lost when the server restarts.");
      console.log("To persist users, please set up a PostgreSQL database.");
      console.log(`Admin credentials: ${email} / ${password}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error setting up admin user:", error);
    return false;
  }
}

// Default admin credentials - in production, these should come from environment variables
const adminEmail = process.env.ADMIN_EMAIL || 'admin@tasksmart.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

// Display setup information
console.log("Setting up admin user with:");
console.log(`Email: ${adminEmail}`);
console.log(`Password: ${adminPassword}`);
console.log(`Database URL: ${process.env.DATABASE_URL || 'Not set - using in-memory storage'}`);

// Always run the setup when this module is imported
setupAdminUser(adminEmail, adminPassword)
  .then(() => {
    console.log('Admin setup complete');
    // Don't exit process here if this is imported as a module
  })
  .catch(err => {
    console.error('Admin setup failed:', err);
    // Don't exit process here if this is imported as a module
  }); 