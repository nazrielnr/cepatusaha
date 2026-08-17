/**
 * @cepatusaha/utils
 * Shared utility functions for CepatUsaha platform
 */

// Storage utilities
export {
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
  clearStorageByPrefix,
  isStorageAvailable,
  getStorageUsage,
} from './storage';

// Validation utilities
export {
  isValidEmail,
  isValidUrl,
  isValidPhoneNumber,
  isValidUUID,
  isEmpty,
  isWithinLength,
  isValidFileExtension,
  isValidFileSize,
  sanitizeString,
  isValidJSON,
  safeJSONParse,
} from './validators';

// Error handling utilities
export {
  APIError,
  isNetworkError,
  isRetryableError,
  getUserFriendlyMessage,
  handleAPIResponse,
  formatErrorForLogging,
} from './errors';

// Formatting utilities
export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatFileSize,
  formatNumber,
  formatCurrency,
  formatPercentage,
  truncate,
  capitalize,
  toTitleCase,
  toSlug,
  formatDuration,
} from './formatters';

// API client utilities
export {
  fetchWithTimeout,
  createApiClient,
  retryWithBackoff,
  buildUrl,
  parseQueryString,
} from './api-client';
export type { RequestOptions } from './api-client';
