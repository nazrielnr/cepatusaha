/**
 * Super Admin Authorization Middleware for Cloudflare Workers
 * 
 * Verifies that authenticated users have super admin privileges before
 * allowing access to admin endpoints. Checks both Clerk metadata and
 * the super_admin_roles database table.
 * 
 * @see Requirements 4.1, 4.2, 4.3
 */
import { warnLog, errorLog } from '../shared/logger';

import type { Context, Next } from 'hono';
import { verifyToken } from '@clerk/backend';
import type { Bindings } from '../bindings';
import type { AuthResult } from '../shared/types';
import { isSuperAdmin as hasSuperAdminRole } from '../features/admin/service';

/**
 * Extended Hono context with auth variable
 */
type SuperAdminContext = Context<{ Bindings: Bindings; Variables: { auth: AuthResult } }>;

/**
 * Super Admin Role from database
 */
/**
 * Super Admin Authorization Middleware
 * 
 * This middleware must be applied AFTER the authentication middleware.
 * It verifies that the authenticated user has super admin privileges by:
 * 1. Checking Clerk JWT metadata for 'super_admin' role
 * 2. Falling back to super_admin_roles table if not in metadata
 * 3. Returning 403 Forbidden if user is not a super admin
 * 
 * @param c - Hono context with Bindings and auth variable
 * @param next - Next middleware function
 * @returns Response with 403 if not authorized, otherwise continues
 * 
 * @example
 * ```typescript
 * // Apply to admin routes
 * app.use('/api/admin/*', authMiddleware);
 * app.use('/api/admin/*', superAdminMiddleware);
 * ```
 */
export async function superAdminMiddleware(
  c: SuperAdminContext,
  next: Next
): Promise<Response | void> {
  try {
    // Get auth result from previous middleware
    const auth = c.get('auth');
    
    if (!auth || !auth.userId) {
      return c.json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401);
    }

    // Extract token for metadata check
    const authHeader = c.req.header('Authorization');
    let token = '';

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const clerkToken = c.req.header('X-Clerk-Token');
      if (clerkToken && clerkToken.trim().length > 0) {
        token = clerkToken.trim();
      }
    }

    let isSuperAdmin = false;

    // First, check Clerk metadata for super_admin role
    if (token) {
      try {
        const payload = await verifyToken(token, {
          secretKey: c.env.CLERK_SECRET_KEY
        });

        // Check if user has super_admin role in metadata
        const metadataPayload = payload as { public_metadata?: { role?: unknown }; role?: unknown };
        const publicMetadata = metadataPayload.public_metadata || {};
        const role = publicMetadata.role || metadataPayload.role;
        
        if (role === 'super_admin') {
          isSuperAdmin = true;
        }
      } catch (error) {
        errorLog(undefined, '[superAdminMiddleware] Error checking Clerk metadata:', error);
        // Continue to database check
      }
    }

    // Fallback: Check super_admin_roles table
    if (!isSuperAdmin) {
      try {
        isSuperAdmin = await hasSuperAdminRole(c.env, auth.userId);
      } catch (error) {
        errorLog(undefined, '[superAdminMiddleware] Error checking database:', error);
        
        return c.json({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to verify admin privileges'
          }
        }, 500);
      }
    }

    // Deny access if not super admin
    if (!isSuperAdmin) {
      warnLog(undefined, '[superAdminMiddleware] Access denied for user:', auth.userId);
      
      return c.json({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'Super admin privileges required'
        }
      }, 403);
    }

    // User is super admin, continue to handler
    await next();
  } catch (error) {
    errorLog(undefined, '[superAdminMiddleware] Unexpected error:', error);
    
    return c.json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Authorization check failed'
      }
    }, 500);
  }
}
