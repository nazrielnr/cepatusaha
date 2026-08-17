/**
 * Database Entity Types
 * Core entities shared between frontend and backend
 */

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  clerk_user_id: string;
  created_at: string | Date;
}

/**
 * Project entity
 */
export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Session entity
 */
export interface Session {
  id: string;
  user_id: string;
  project_id: string | null;
  started_at: string | Date;
  ended_at: string | Date | null;
  preview_thumbnail?: string;
}

/**
 * File entity
 */
export interface File {
  id: string;
  project_id: string;
  session_id: string | null;
  file_path: string;
  file_type: string;
  content: string;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Asset entity
 */
export interface Asset {
  id: string;
  project_id: string;
  asset_type: string;
  file_path: string;
  storage_url: string;
  context: string | null;
  uploaded_at: string | Date;
}

/**
 * Publication metadata
 */
export interface PublicationMetadata {
  vercelUrl?: string;
  vercelDeploymentId?: string;
  fallbackUrl?: string;
  deploymentStatus?: 'vercel_success' | 'vercel_failed_fallback_success' | 'failed';
  deploymentError?: string | null;
  customDomain?: string;
  [key: string]: unknown;
}

/**
 * Publication entity
 */
export interface Publication {
  id: string;
  project_id: string;
  published_url: string;
  published_at: string | Date;
  metadata: PublicationMetadata | null;
}

/**
 * Dependency entity
 */
export interface Dependency {
  id: string;
  project_id: string;
  dep_type: string;
  dep_name: string;
  version: string | null;
  added_at: string | Date;
}

/**
 * AnalyticsEvent entity
 */
export interface AnalyticsEvent {
  id: string;
  project_id: string | null;
  user_id: string | null;
  event_type: string;
  detail: Record<string, unknown> | null;
  timestamp: string | Date;
}

/**
 * FunctionCallLog entity
 */
export interface FunctionCallLog {
  id: string;
  session_id: string;
  function_name: string;
  arguments: Record<string, unknown>;
  result: unknown;
  status: 'pending' | 'success' | 'error';
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string | Date;
}

/**
 * Checkpoint entity
 */
export interface Checkpoint {
  id: string;
  project_id: string;
  session_id: string;
  name: string;
  description: string | null;
  created_at: string | Date;
}
