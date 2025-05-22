import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { aiUsage } from "@shared/schema";
import { desc, sql } from "drizzle-orm";

// Configure limits
const RATE_LIMITS = {
  hour: 10,   // 10 requests per hour
  day: 50     // 50 requests per day
};

// Rate limiting middleware for AI endpoints
export async function aiRateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ 
        message: "Unauthorized - Authentication required for AI features" 
      });
    }
    
    // Check hourly usage
    const hourlyUsage = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsage)
      .where(sql`user_id = ${userId} AND created_at > NOW() - INTERVAL '1 hour'`);
    
    if (hourlyUsage[0]?.count >= RATE_LIMITS.hour) {
      return res.status(429).json({
        message: "Rate limit exceeded for AI operations. Try again later.",
        reset: "Try again in 1 hour",
        limit: RATE_LIMITS.hour
      });
    }
    
    // Check daily usage
    const dailyUsage = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsage)
      .where(sql`user_id = ${userId} AND created_at > NOW() - INTERVAL '1 day'`);
    
    if (dailyUsage[0]?.count >= RATE_LIMITS.day) {
      return res.status(429).json({
        message: "Daily rate limit exceeded for AI operations.",
        reset: "Try again tomorrow",
        limit: RATE_LIMITS.day
      });
    }
    
    // Continue to AI endpoint
    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    next(); // Fail open to avoid blocking legitimate requests
  }
}

// Track AI usage after successful API call
export async function trackAiUsage(userId: string, model: string, prompt: string, tokensUsed: number = 0) {
  try {
    await db.insert(aiUsage).values({
      userId,
      model,
      prompt,
      tokensUsed,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Error tracking AI usage:", error);
  }
} 