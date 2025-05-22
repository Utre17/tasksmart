import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import helmet from "helmet";
import cors from "cors";
import { setupVite, serveStatic } from "./vite";
import { errorHandler } from "./utils/errorHandler";
import * as logger from "./utils/logger";
import { securityHeaders } from "./utils/security";
import { configureDevSecurity } from "./utils/skipSecurityInDev";

// Import centralized API router
import apiRouter from "./api";

// Initialize Express app
const app = express();

// Determine environment
const isDevelopment = process.env.NODE_ENV !== "production";

// Add this right after the application is initialized, before any security middleware

// Define a completely open CSP middleware that will apply to all requests
app.use((req, res, next) => {
  // Completely remove CSP headers to prevent any restrictions
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  
  // Set a completely permissive CSP header
  // The asterisk (*) wildcard allows everything from any origin
  res.setHeader('Content-Security-Policy', 
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "script-src * 'unsafe-inline' 'unsafe-eval'; " + 
    "connect-src * 'unsafe-inline'; " + 
    "img-src * data: blob:; " + 
    "frame-src *; " + 
    "style-src * 'unsafe-inline'; " +
    "font-src * data:;"
  );
  
  // Allow all origins for CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  console.log("🔓 No security restrictions applied - development mode only");
  next();
});

// Add a temporary middleware to disable CSP entirely for development
// Place this code right after the if (isDevelopment) check, before configureDevSecurity

if (isDevelopment) {
  // Completely disable CSP in development for troubleshooting
  app.use((req, res, next) => {
    // Clear any CSP headers that might be set
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
    
    console.log("🔓 CSP completely disabled for development");
    next();
  });
  
  // Then apply the rest of the development security configuration
  configureDevSecurity(app);
} else {
  // Use full security configuration in production
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          // Default security policy
          defaultSrc: ["'self'"],
          
          // Script sources
          scriptSrc: [
            "'self'",
            // Allow specific external script sources
            "https://www.googletagmanager.com",
            "https://www.google-analytics.com",
            "https://apis.google.com",
            "https://accounts.google.com",
          ].filter(Boolean),
          
          // Connection sources (XHR/fetch/WebSockets)
          connectSrc: [
            "'self'",
            "https://www.google-analytics.com",
            "https://firebase.googleapis.com",
            "https://*.firebaseio.com",
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
          ].filter(Boolean),
          
          // Image sources
          imgSrc: [
            "'self'", 
            "data:", 
            "blob:", 
            "https://www.google-analytics.com",
            "https://lh3.googleusercontent.com",
            "https://*.googleusercontent.com"
          ],
          
          // Style sources
          styleSrc: ["'self'", "'unsafe-inline'"].filter(Boolean),
          
          // Font sources
          fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
          
          // Frame sources
          frameSrc: [
            "'self'", 
            "https://accounts.google.com",
            "https://apis.google.com"
          ],
          
          // Allow web workers
          workerSrc: ["'self'", "blob:"],
        },
      },
      // Other security headers
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
      noSniff: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );
  
  // Apply additional security headers in production
  app.use(securityHeaders);
}

// Enable JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5000', 'http://localhost:5001', 'https://accounts.google.com', 'https://*.firebaseapp.com'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || isDevelopment) return callback(null, true);
    
    // Check if the origin is allowed or matches one of our patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === origin) return true;
      if (allowedOrigin.includes('*') && origin.endsWith(allowedOrigin.replace('*', ''))) return true;
      return false;
    });
    
    if (!isAllowed) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-CSRF-Token'],
  maxAge: 86400, // 24 hours
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  // Don't log complete responses for security and performance
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`, "http");
    }
  });

  next();
});

// Mount API Router (all API endpoints are now handled through the centralized router)
app.use("/api", apiRouter);

// Global 404 handler for all non-API routes that aren't handled by Vite/static files
app.use((req, res, next) => {
  // Skip if it's an API route (already handled by API router)
  if (req.path.startsWith("/api")) {
    return next();
  }
  
  // Let Vite handle client routes in development
  if (isDevelopment) {
    return next();
  }
  
  // For production, 404 for any unmatched routes
  res.status(404).json({ 
    error: true,
    message: "Route not found" 
  });
});

// Global error handler
app.use(errorHandler);

// Start server
(async () => {
  // Create HTTP server
  const server = createServer(app);
  
  // Setup Vite in development or serve static files in production
  if (isDevelopment) {
    logger.log("Starting server in development mode", "server");
    await setupVite(app, server);
  } else {
    logger.log("Starting server in production mode", "server");
    serveStatic(app);
  }

  // Set port with fallback and alternative ports
  const ports = [5000, 5001, 3000, 3001, 8080];
  let currentPortIndex = 0;

  // Function to start server with port fallback
  const startServer = () => {
    const port = ports[currentPortIndex];
    
    server.listen(port)
      .on('listening', () => {
        logger.log(`Server running on port ${port} in ${process.env.NODE_ENV || "development"} mode`, "server");
      })
      .on('error', (err: any) => {
        if (err.code === 'EADDRINUSE' && currentPortIndex < ports.length - 1) {
          // Port is in use, try next port
          logger.warn(`Port ${port} is in use, trying port ${ports[++currentPortIndex]}`, "server");
          server.close();
          startServer();
        } else {
          logger.error("Failed to start server", err);
          process.exit(1);
        }
      });
  };

  // Start the server
  startServer();
})().catch(err => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
