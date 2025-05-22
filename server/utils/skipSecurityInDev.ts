import { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";

/**
 * This utility applies a minimal set of security headers for development mode
 * and configures Content Security Policy to allow Firebase authentication.
 * 
 * IMPORTANT: Set this to true to completely disable CSP in development if you
 * continue to have authentication problems.
 */
const DISABLE_CSP_COMPLETELY = true;

/**
 * This utility applies a minimal set of security headers for development mode
 * and configures Content Security Policy to allow Firebase authentication.
 */
export function configureDevSecurity(app: Express): void {
  // In development, use a relaxed security configuration
  console.log("Applying development security configuration...");
  
  if (DISABLE_CSP_COMPLETELY) {
    console.log("⚠️ WARNING: Content Security Policy is COMPLETELY DISABLED in development mode");
    console.log("This is less secure but will resolve authentication issues");
    
    app.use(
      helmet({
        contentSecurityPolicy: false,
        
        // Keep other security headers
        xssFilter: true,
        noSniff: true,
        
        // Disable HSTS in development
        hsts: false,
        
        // Allow frames for auth
        frameguard: false
      })
    );
  } else {
    // Use relaxed but still present CSP
    app.use(
      helmet({
        // Use a custom CSP that allows Firebase authentication and development resources
        contentSecurityPolicy: {
          useDefaults: false,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'", 
              "'unsafe-inline'", 
              "'unsafe-eval'", 
              "https://apis.google.com", 
              "https://*.firebaseio.com", 
              "https://*.firebase.com", 
              "https://*.firebaseapp.com", 
              "https://*.gstatic.com", 
              "https://*.googleapis.com", 
              "https://www.googletagmanager.com", 
              "https://www.google-analytics.com", 
              "https://accounts.google.com", 
              "https://securetoken.googleapis.com", 
              "https://identitytoolkit.googleapis.com", 
              "https://replit.com", 
              "*.replit.com"
            ],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: [
              "'self'", 
              "data:", 
              "blob:", 
              "https://*.googleusercontent.com", 
              "https://www.gstatic.com", 
              "https://*.firebase.com", 
              "https://*.firebaseapp.com", 
              "https://www.google-analytics.com", 
              "https://lh3.googleusercontent.com"
            ],
            connectSrc: [
              "'self'", 
              "wss://*", 
              "https://*.firebase.com", 
              "https://*.firebaseio.com", 
              "https://*.firebaseapp.com", 
              "https://www.googleapis.com", 
              "https://*.google.com", 
              "https://securetoken.googleapis.com", 
              "https://identitytoolkit.googleapis.com", 
              "https://firestore.googleapis.com", 
              "https://www.google-analytics.com", 
              "https://accounts.google.com",
              "*"
            ],
            fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
            frameSrc: [
              "'self'", 
              "https://*.firebaseapp.com", 
              "https://accounts.google.com", 
              "https://apis.google.com", 
              "https://*.firebase.com", 
              "https://tasksheet-*.firebaseapp.com",
              "https://tasksmart-73c97.firebaseapp.com"
            ],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            manifestSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"],
            formAction: [
              "'self'", 
              "https://accounts.google.com", 
              "https://identitytoolkit.googleapis.com",
              "https://securetoken.googleapis.com"
            ],
            baseUri: ["'self'"]
          }
        },
        
        // Keep other security headers
        xssFilter: true,
        noSniff: true,
        
        // Disable HSTS in development
        hsts: false,
        
        // Allow frames for auth
        frameguard: false // Disable frameguard in development to allow auth popups
      })
    );
  }
  
  // Add development-specific CORS headers for Firebase
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Control referrer information
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    
    // Allow credentials
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Less restrictive frame options for auth flows
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    next();
  });
} 