import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";

// CSRF Token storage (will be a Map in memory for simplicity)
// In production, this should be in Redis or another distributed store
const csrfTokens = new Map<string, { created: Date }>();

// Clean up expired tokens every hour (tokens older than 24 hours)
setInterval(() => {
  const now = new Date();
  for (const [token, data] of csrfTokens.entries()) {
    if (now.getTime() - data.created.getTime() > 24 * 60 * 60 * 1000) {
      csrfTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);

// CSRF Protection Middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip for GET, HEAD, OPTIONS requests as they should be idempotent
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Only check CSRF for authenticated routes
  if (!req.user) {
    return next();
  }
  
  // Check CSRF token in headers
  const token = req.headers['x-csrf-token'] as string;
  
  if (!token || !csrfTokens.has(token)) {
    return res.status(403).json({
      message: "Invalid or missing CSRF token"
    });
  }
  
  // Valid token, proceed
  next();
}

// Generate a CSRF token for a client
export function generateCsrfToken(req: Request, res: Response) {
  // Create new token
  const token = randomBytes(32).toString('hex');
  
  // Store token with creation time
  csrfTokens.set(token, { created: new Date() });
  
  // Return token to client
  return res.json({ token });
}

// Additional security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  // Content Security Policy enhancements - don't override the helmet CSP in development
  if (!isDevelopment) {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https://www.google-analytics.com; " +
      "connect-src 'self' https://www.google-analytics.com https://firebase.googleapis.com; " +
      "frame-src 'self' https://accounts.google.com; " +
      "font-src 'self' data:; " +
      "form-action 'self'; " +
      "upgrade-insecure-requests;"
    );
  }
  
  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Disable browser MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HTTP Strict Transport Security
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Permissions Policy to disable certain browser features
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  next();
} 