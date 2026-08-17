import type { Hono } from 'hono';
import type { AuthResult } from './shared/types';
import type { Bindings } from './bindings';
import { superAdminMiddleware } from './middleware/super-admin';
import { chatHandlerStream } from './features/chat/stream';
import { stopChatStream } from './features/chat/stop';
import { 
  listSessions, 
  createSession, 
  updateSession, 
  deleteSession 
} from './features/sessions/routes';
import { getProfile, updateProfile } from './features/profile/routes';
import { getSessionMessages, postSessionMessages, deleteCheckpointIndicators } from './features/sessions/messages.routes';
import { listPublications, publishSite, deletePublication } from './features/publications/routes';
import { getAnalytics } from './features/analytics/routes';
import { getModels } from './features/models/routes';
import { getProjectFilesHandler } from './features/files/project-files.routes';
import { 
  updateFileHandler, 
  deleteFileHandler, 
  readFileHandler, 
  listFilesHandler, 
  searchFilesHandler 
} from './features/files/routes';
import { getAsset, uploadAsset, uploadImage } from './features/assets/routes';
import { adminModelHealth, adminModels, adminNotImplemented } from './features/admin/routes';

export function registerRoutes(app: Hono<{ Bindings: Bindings; Variables: { auth: AuthResult } }>) {
  // Chat endpoint
  app.post('/api/chat/stream', chatHandlerStream);
  app.post('/api/chat/stop', stopChatStream);

  // Session endpoints
  app.get('/api/sessions', listSessions);
  app.post('/api/sessions', createSession);
  app.put('/api/sessions', updateSession);
  app.delete('/api/sessions', deleteSession);

  // Session messages endpoints
  app.get('/api/session-messages', getSessionMessages);
  app.post('/api/session-messages', postSessionMessages);
  app.delete('/api/session-messages/checkpoint-indicators', deleteCheckpointIndicators);

  // Profile endpoints
  app.get('/api/profile', getProfile);
  app.put('/api/profile', updateProfile);

  // Publication endpoints
  app.get('/api/list-publications', listPublications);
  app.post('/api/publish-site', publishSite);
  app.delete('/api/delete-publication', deletePublication);

  // Analytics endpoint
  app.get('/api/get-analytics', getAnalytics);

  // Project files endpoint
  app.get('/api/projects/:projectId/files', getProjectFilesHandler);

  // File operation endpoints (for inspect panel edits and AI tool calls)
  app.post('/api/files/update', updateFileHandler);
  app.post('/api/files/delete', deleteFileHandler);
  app.post('/api/files/read', readFileHandler);
  app.post('/api/files/list', listFilesHandler);
  app.post('/api/files/search', searchFilesHandler);

  app.post('/api/assets/upload', uploadAsset);
  app.post('/api/images/upload', uploadImage);
  app.get('/api/assets/object/*', getAsset);
  app.get('/api/realtime/:room', (c) => {
    const id = c.env.REALTIME_ROOM.idFromName(c.req.param('room'));
    return c.env.REALTIME_ROOM.get(id).fetch(c.req.raw);
  });

  // Models endpoint (public, no auth required)
  app.get('/api/models', getModels);
  app.get('/models', getModels);

  // Admin routes - require both authentication and super admin authorization
  // Apply super admin middleware to all /api/admin/* routes
  app.use('/api/admin/*', async (c, next) => {
    // Ensure authentication happens first
    const auth = c.get('auth');
    if (!auth) {
      return c.json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401);
    }

    // Apply super admin authorization
    return superAdminMiddleware(c, next);
  });

  // Admin model configuration endpoints
  app.get('/api/admin/models/health', adminModelHealth);
  app.get('/api/admin/models', adminModels);
  app.post('/api/admin/models', adminModels);
  app.put('/api/admin/models/:id', adminModels);
  app.delete('/api/admin/models/:id', adminModels);

  // Admin statistics endpoints
  app.get('/api/admin/statistics', adminNotImplemented);
  app.get('/api/admin/statistics/users', adminNotImplemented);
  app.get('/api/admin/statistics/projects', adminNotImplemented);

  // Admin system health endpoints
  app.get('/api/admin/health', adminNotImplemented);
  app.get('/api/admin/health/errors', adminNotImplemented);

  // Admin function execution endpoints
  app.get('/api/admin/functions', adminNotImplemented);
  app.get('/api/admin/functions/stats', adminNotImplemented);

  // Admin storage management endpoints
  app.get('/api/admin/storage', adminNotImplemented);
  app.get('/api/admin/storage/assets', adminNotImplemented);
  app.delete('/api/admin/storage/assets', adminNotImplemented);

  // Admin publication analytics endpoints
  app.get('/api/admin/publications', adminNotImplemented);
  app.get('/api/admin/publications/stats', adminNotImplemented);

  // Admin dependency insights endpoints
  app.get('/api/admin/dependencies', adminNotImplemented);
  app.get('/api/admin/dependencies/stats', adminNotImplemented);

  // Admin token usage endpoints
  app.get('/api/admin/tokens', adminNotImplemented);
  app.get('/api/admin/tokens/user/:userId', adminNotImplemented);
  app.get('/api/admin/tokens/session/:sessionId', adminNotImplemented);

  // Admin chat monitoring endpoints
  app.get('/api/admin/chats', adminNotImplemented);
  app.get('/api/admin/chats/:sessionId', adminNotImplemented);
  app.delete('/api/admin/chats/:sessionId', adminNotImplemented);

  // Admin user management endpoints
  app.get('/api/admin/users', adminNotImplemented);
  app.get('/api/admin/users/:id', adminNotImplemented);
  app.delete('/api/admin/users/:userId', adminNotImplemented);

  // Admin user analytics endpoints
  app.get('/api/admin/analytics/users', adminNotImplemented);
  app.get('/api/admin/analytics/users/:userId/timeline', adminNotImplemented);

  // Admin data export endpoints
  app.get('/api/admin/export/statistics', adminNotImplemented);
  app.get('/api/admin/export/chats', adminNotImplemented);

  // Admin audit logs endpoints
  app.get('/api/admin/audit-logs', adminNotImplemented);
  app.get('/api/admin/audit-logs/stats', adminNotImplemented);

}
