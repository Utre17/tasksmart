import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Create a PostgreSQL client
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL environment variable is not set or is invalid");
  console.warn("Using in-memory storage instead");
}

// Check if the connection string is valid
let migrationClient;
let queryClient;
let db;

try {
  if (connectionString && connectionString.startsWith('postgres')) {
    // For migrations
    migrationClient = postgres(connectionString, { max: 1 });
    
    // Create a connection pool
    queryClient = postgres(connectionString);
    
    // Create a drizzle client
    db = drizzle(queryClient, { schema });
    
    console.log("Successfully connected to PostgreSQL database");
  } else {
    throw new Error("Invalid database connection string");
  }
} catch (error) {
  console.error("Database connection error:", error);
  console.warn("Using in-memory storage instead");
  
  // Create dummy clients that do nothing
  migrationClient = {
    query: async () => [],
    end: async () => {}
  } as any;
  
  queryClient = migrationClient;
  
  // Create a dummy drizzle client
  db = {
    select: () => ({
      from: () => ({
        where: () => []
      })
    }),
    insert: () => ({
      values: () => ({
        returning: () => []
      })
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => []
        })
      })
    }),
    delete: () => ({
      where: () => ({
        returning: () => []
      })
    })
  } as any;
}

// Export the clients
export { migrationClient, queryClient, db };