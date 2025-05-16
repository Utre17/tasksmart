import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import cors from "cors";
import tasksRouter from "./api/tasks";
import usersRouter from "./api/users";
import { errorHandler } from "./utils/errorHandler";

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// Enable JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Remove express session - we're using Firebase Auth tokens instead

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  // Don't log complete responses for security and performance
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// API Routes
const apiRouter = express.Router();
app.use("/api", apiRouter);

// Mount API routers
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/users", usersRouter);

// Basic health check endpoint
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 Handler for API routes
apiRouter.use((req, res) => {
  res.status(404).json({ 
    error: true,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}` 
  });
});

// Global error handler
app.use(errorHandler);

(async () => {
  // Create HTTP server
  const http = require('http');
  const server = http.createServer(app);
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen(port, "127.0.0.1", () => {
    log(`Server running on port ${port} in ${app.get("env")} mode`);
  });
})();
