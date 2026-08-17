/**
 * Authentication middleware for Cloudflare Workers
 * 
 * Validates Clerk JWT tokens and attaches authentication result to Hono context.
 * Supports token extraction from both Authorization and X-Clerk-Token headers.
 * 
 * @see Requirements 2.1, 2.2, 2.3, 2.5
 */
import { warnLog, errorLog } from '../shared/logger';

import type { Context, Next } from 'hono';
import { verifyToken } from '@clerk/backend';
import type { Bindings } from '../bindings';
import type { AuthResult } from '../shared/types';

// Re-export AuthResult for convenience
export type { AuthResult };
import { AuthenticationError } from '../shared/types';

/**
 * Extended Hono context with auth variable
 */
type AuthContext = Context<{ Bindings: Bindings; Variables: { auth: AuthResult } }>;

/**
 * Authentication middleware for Hono
 * 
 * Validates JWT tokens from Clerk and attaches AuthResult to context.
 * Supports two header formats:
 * - Authorization: Bearer <token>
 * - X-Clerk-Token: <token>
 * 
 * @param c - Hono context with Bindings
 * @param next - Next middleware function
 * @returns Response with 401 if authentication fails, otherwise continues to next middleware
 * 
 * @example
 * ```typescript
 * app.use('*', authMiddleware);
 * 
 * // In handler:
 * const auth = c.get('auth') as AuthResult;
 * console.log(auth.userId);
 * ```
 */
export async function authMiddleware(
  c: AuthContext,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  let token = '';

  // Extract token from Authorization header (Bearer format)
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Fallback to X-Clerk-Token header
    const clerkToken = c.req.header('X-Clerk-Token');
    if (clerkToken && clerkToken.trim().length > 0) {
      token = clerkToken.trim();
    }
  }

  // Return 401 if no token provided
  if (!token) {
    return c.json({
      status: 'error',
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'No authentication token provided' 
      }
    }, 401);
  }

  try {
    // Verify token using Clerk's JWT verification
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY
    });

    // Validate token has required claims
    if (!payload.sub) {
      throw new AuthenticationError('Invalid token - no subject');
    }

    // Create AuthResult and attach to context
    const auth: AuthResult = {
      userId: payload.sub,
      sessionId: (payload.sid as string) || ''
    };

    c.set('auth', auth);
    
    // Continue to next middleware/handler
    await next();
  } catch (error) {
    errorLog(undefined, '[authMiddleware] Authentication error:', error);
    
    // Return 401 with error details
    return c.json({
      status: 'error',
      error: { 
        code: 'UNAUTHORIZED', 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      }
    }, 401);
  }
}
