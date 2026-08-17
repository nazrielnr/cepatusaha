import type { Context, MiddlewareHandler, Next } from 'hono';
import type { Bindings } from '../bindings';

export interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const PROD_ORIGINS = [
  'https://cepatusaha.com',
  'https://www.cepatusaha.com',
  'https://cepatusaha.vercel.app',
];

const DEFAULT_CORS_OPTIONS: Required<Omit<CorsOptions, 'origin'>> = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Clerk-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
  credentials: true,
  maxAge: 86400,
};

function envOrigins(env: Bindings): string[] {
  return (env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function allowedOrigins(env: Bindings): string[] {
  return [...(env.NODE_ENV === 'development' ? DEV_ORIGINS : []), ...PROD_ORIGINS, ...envOrigins(env)];
}

function isAllowed(origin: string | undefined, env: Bindings, configured?: CorsOptions['origin']): boolean {
  if (!origin) return false;
  if (env.NODE_ENV === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return true;
  if (typeof configured === 'function') return configured(origin);
  if (typeof configured === 'string') return configured === '*' || configured === origin;
  if (Array.isArray(configured)) return configured.includes('*') || configured.includes(origin);
  return allowedOrigins(env).includes(origin);
}

export function corsResponseHeaders(env: Bindings, origin?: string, options: CorsOptions = {}): Record<string, string> {
  const config = { ...DEFAULT_CORS_OPTIONS, ...options };
  const allowOrigin = options.origin === '*' ? '*' : isAllowed(origin, env, options.origin) ? origin : undefined;
  return {
    ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin } : {}),
    ...(config.credentials && allowOrigin !== '*' ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
    'Access-Control-Allow-Methods': config.methods.join(', '),
    'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
    'Access-Control-Expose-Headers': config.exposedHeaders.join(', '),
    'Access-Control-Max-Age': String(config.maxAge),
    Vary: 'Origin',
  };
}

export function corsMiddleware(options: CorsOptions = {}): MiddlewareHandler {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const origin = c.req.header('Origin');
    const headers = corsResponseHeaders(c.env, origin, options);
    for (const [key, value] of Object.entries(headers)) c.header(key, value);

    if (c.req.method === 'OPTIONS') return c.body(null, headers['Access-Control-Allow-Origin'] || !origin ? 204 : 403);
    await next();
  };
}
