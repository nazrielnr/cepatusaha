/**
 * Main application entry point for Cloudflare Workers
 * 
 * This file initializes the Hono application with all middleware and routes.
 * 
 * @see Requirements 1.1, 1.3, 11.1, 11.2, 11.3
 */
import { Hono } from 'hono';
import type { Bindings } from './bindings';
import type { AuthResult, HonoContext } from './shared/types';

// Middleware
import { corsMiddleware } from './middleware/cors';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { registerRoutes } from './routes';

// Handlers

/**
 * Create and configure the Hono application
 * 
 * @see Requirements 1.1, 1.3, 11.1, 11.2, 11.3
 */
export { RealtimeRoom } from './features/realtime/room';

const app = new Hono<{ Bindings: Bindings; Variables: { auth: AuthResult } }>();

// Apply global middleware
// CORS must be first to handle preflight requests
app.use('*', corsMiddleware());

// Authentication middleware for public health/model endpoints only
app.use('*', async (c, next) => {
  const path = c.req.path;
  
  if (path === '/' || path === '/api/health' || path === '/api/models' || path === '/models' || path.startsWith('/api/assets/object/')) {
    return next();
  }
  
  // Apply authentication middleware
  return authMiddleware(c, next);
});

// Error handling middleware
app.onError(errorHandler);

// Health check endpoint
const healthHandler = (c: HonoContext) => {
  return c.json({ 
    status: 'ok', 
    message: 'CepatUsaha API on Cloudflare Workers',
    version: '1.0.0',
    environment: c.env.NODE_ENV || 'production'
  });
};

app.get('/', healthHandler);
app.get('/api/health', healthHandler);

registerRoutes(app);

// 404 handler for undefined routes
app.notFound((c) => {
  return c.json({
    status: 'error',
    error: {
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`
    }
  }, 404);
});

// Export app as default for Cloudflare Workers
export default app;
