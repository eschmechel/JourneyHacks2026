import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types/env';
import authRoutes from './auth/register';

// Initialize Hono app with environment bindings
const app = new Hono<{ Bindings: Env }>();

// CORS middleware - allow all origins for hackathon demo
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err);
  return c.json(
    { 
      error: 'Internal server error',
      message: err.message 
    },
    500
  );
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// Mount route handlers
app.route('/auth', authRoutes);
// TODO: Mount additional routes
// app.route('/me', userRoutes);
// app.route('/friends', friendsRoutes);
// app.route('/nearby', locationRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
