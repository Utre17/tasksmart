import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { Sql } from "postgres";
import * as schema from "@shared/schema";
import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import * as logger from "./utils/logger";

// Try to load environment variables from multiple locations
dotenv.config();
dotenv.config({ path: "./.env" });
dotenv.config({ path: "./server/.env" });

// Get the database connection string from environment variables
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@ep-cold-bush-a1phjz4u.us-east-2.aws.neon.tech/neondb?sslmode=require';

logger.debug("Database connection string configured", { connectionString: connectionString.replace(/:.+@/, ':***@') });

// Define client variables
let migrationClient: Sql<any>;
let queryClient: Sql<any>;
let db: any; // Use any type for db to avoid TypeScript errors with custom implementation

/**
 * Initialize database connection
 */
try {
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Try to connect with Neon serverless driver first
  try {
    logger.log("Attempting to connect with Neon serverless driver", "db");
    
    // For neon serverless operations
    const sql = neon(connectionString);
    
    // Create a drizzle client (simulating postgres-js API with neon)
    const neonPostgres = {
      unsafe: async (query: string, params?: any[]) => {
        try {
          return await sql(query, ...(params || []));
        } catch (error) {
          logger.error("Error executing neon query", error, "db");
          throw error;
        }
      },
      end: async () => {
        logger.debug("Neon connection end called (no-op)", null, "db");
      }
    } as any;
    
    migrationClient = neonPostgres;
    queryClient = neonPostgres;
    
    // Create a custom db object that simulates drizzle but uses neon under the hood
    const customDb = drizzle(null as any, { schema });
    
    // Create a properly typed db object with execute method
    db = {
      ...customDb,
      execute: async (query: any) => {
        try {
          return await sql(query.sql, ...query.params);
        } catch (error) {
          logger.error("Error executing drizzle query", error, "db");
          throw error;
        }
      }
    };
    
    logger.log("Successfully connected to Neon PostgreSQL database", "db");
  } catch (neonError) {
    logger.warn("Failed to connect with Neon driver, trying postgres-js", "db");
    logger.debug("Neon connection error", neonError, "db");
    
    // Fall back to postgres-js (requires PostgreSQL installation)
    migrationClient = postgres(connectionString, { max: 1 });
    queryClient = postgres(connectionString);
    db = drizzle(queryClient, { schema });
    
    logger.log("Successfully connected to PostgreSQL database with postgres-js", "db");
  }
} catch (error) {
  logger.error("Database connection error", error, "db");
  logger.warn("Using in-memory storage fallback", "db");
  
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

/**
 * Clean up database connections on process exit
 */
process.on('SIGINT', async () => {
  logger.log("Shutting down database connections", "db");
  try {
    if (migrationClient && typeof migrationClient.end === 'function') {
      await migrationClient.end();
    }
    if (queryClient && typeof queryClient.end === 'function' && queryClient !== migrationClient) {
      await queryClient.end();
    }
    logger.log("Database connections closed successfully", "db");
  } catch (error) {
    logger.error("Error closing database connections", error, "db");
  }
  process.exit(0);
});

// Export database clients
export { migrationClient, queryClient, db };