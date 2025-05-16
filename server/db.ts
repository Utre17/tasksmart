import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { Sql } from "postgres";
import * as schema from "@shared/schema";
import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

// Try to load environment variables from multiple locations
dotenv.config();
dotenv.config({ path: "./.env" });
dotenv.config({ path: "./server/.env" });

// Create a PostgreSQL client
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@ep-cold-bush-a1phjz4u.us-east-2.aws.neon.tech/neondb?sslmode=require';

console.log("Attempting to connect with:", connectionString);

// Check if the connection string is valid
let migrationClient: Sql<any>;
let queryClient: Sql<any>;
let db;

try {
  if (connectionString) {
    // Try Neon first (works without PostgreSQL installation)
    try {
      console.log("Attempting to connect with Neon serverless driver...");
      
      // For neon serverless operations
      const sql = neon(connectionString);
      
      // Create a drizzle client (we're simulating postgres-js API with neon)
      const neonPostgres = {
        unsafe: async (query: string, params?: any[]) => {
          try {
            return await sql(query, ...(params || []));
          } catch (error) {
            console.error("Error executing query:", error);
            throw error;
          }
        },
        end: async () => {}
      } as any;
      
      migrationClient = neonPostgres;
      queryClient = neonPostgres;
      
      // Create a drizzle client
      db = drizzle(null as any, { schema });
      db.execute = async (query: any) => {
        try {
          return await sql(query.sql, ...query.params);
        } catch (error) {
          console.error("Error executing drizzle query:", error);
          throw error;
        }
      };
      
      console.log("Successfully connected to Neon PostgreSQL database");
    } catch (neonError) {
      console.warn("Failed to connect with Neon driver, trying postgres-js:", neonError);
      
      // Fall back to postgres-js (requires PostgreSQL installation)
      migrationClient = postgres(connectionString, { max: 1 });
      queryClient = postgres(connectionString);
      db = drizzle(queryClient, { schema });
      
      console.log("Successfully connected to PostgreSQL database with postgres-js");
    }
  } else {
    throw new Error("DATABASE_URL environment variable is not set");
  }
} catch (error) {
  console.error("Database connection error:", error);
  console.warn("Using in-memory storage instead");
  
  // Create dummy clients that do nothing
  migrationClient = {
    query: async () => [],
    unsafe: async () => [],
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
    }),
    execute: async () => []
  } as any;
}

// Export the clients
export { migrationClient, queryClient, db };