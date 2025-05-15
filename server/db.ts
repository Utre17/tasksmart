import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Create a PostgreSQL client
const connectionString = process.env.DATABASE_URL as string;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 });

// Create a connection pool
const queryClient = postgres(connectionString);

// Create a drizzle client
export const db = drizzle(queryClient, { schema });