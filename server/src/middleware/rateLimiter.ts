import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  // Clean up expired entries
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
  
  // Initialize or get client data
  if (!store[clientId]) {
    store[clientId] = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }
  
  const clientData = store[clientId];
  
  // Reset if window expired
  if (clientData.resetTime < now) {
    clientData.count = 0;
    clientData.resetTime = now + WINDOW_MS;
  }
  
  // Check rate limit
  if (clientData.count >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      }
    });
    return;
  }
  
  // Increment counter
  clientData.count++;
  
  // Add headers
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': (MAX_REQUESTS - clientData.count).toString(),
    'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
  });
  
  next();
};
