import type { Context, Next } from 'hono';
import type { Env } from '../types/env';

/**
 * Rate limiting middleware
 * Uses deviceSecret from Authorization header as the rate limit key
 * Returns 429 if rate limit is exceeded
 */
export async function rateLimitMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // Extract deviceSecret from Authorization header
  const authorization = c.req.header('Authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    // If no auth header, use IP address as fallback (for public endpoints)
    const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
    const { success } = await c.env.API_RATE_LIMITER.limit({ key: `ip:${ip}` });
    
    if (!success) {
      return c.json({ 
        error: 'Rate limit exceeded', 
        message: 'Too many requests. Please try again later.' 
      }, 429);
    }
  } else {
    // Use deviceSecret for authenticated requests
    const deviceSecret = authorization.substring(7);
    const { success } = await c.env.API_RATE_LIMITER.limit({ key: deviceSecret });
    
    if (!success) {
      return c.json({ 
        error: 'Rate limit exceeded', 
        message: 'Too many requests. Please try again later.' 
      }, 429);
    }
  }
  
  await next();
}
