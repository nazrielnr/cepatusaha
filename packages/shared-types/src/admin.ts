/**
 * Admin Dashboard Types
 * Types for admin functionality
 */

/**
 * Time series data for charts
 */
export interface TimeSeriesData {
  timestamp: Date | string;
  value: number;
  label?: string;
}

/**
 * Category data for charts
 */
export interface CategoryData {
  category: string;
  value: number;
  percentage?: number;
}

/**
 * Date range for filtering
 */
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Admin statistics
 */
export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalSessions: number;
  totalPublications: number;
  activeUsers: number;
  storageUsed: number;
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  userId: string;
  sessionId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: Date | string;
}

/**
 * System health status
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    status: 'connected' | 'disconnected';
    latency: number;
  };
  storage: {
    status: 'available' | 'unavailable';
    usedBytes: number;
    totalBytes: number;
  };
  ai: {
    status: 'available' | 'unavailable';
    provider: string;
    latency: number;
  };
}

/**
 * Admin action log entry
 */
export interface AdminActionLog {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  timestamp: Date | string;
}
