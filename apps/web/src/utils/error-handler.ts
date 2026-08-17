/**
 * API Error Handler Utilities
 *
 * Unified error handling for all API calls.
 * - Structured error objects
 * - Consistent error parsing
 * - User-friendly Indonesian messages
 * - Network error detection
 */

/**
 * Custom API Error class
 */
export class APIError extends Error {
  public code?: string;
  public statusCode?: number;
  public details?: any;

  constructor(message: string, code?: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, APIError);
    }
  }
}

/**
 * Handle API response and parse errors
 */
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  // Handle successful responses
  if (response.ok) {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      // Check for success field in response
      if (data.success === false) {
        throw new APIError(
          data.error || data.message || 'Request failed',
          data.code,
          response.status,
          data
        );
      }

      return data as T;
    }

    // Non-JSON response
    const text = await response.text();
    return text as unknown as T;
  }

  // Handle error responses
  const status = response.status;
  const statusText = response.statusText;
  let errorMessage = `HTTP ${status}: ${statusText}`;
  let errorCode: string | undefined;
  let errorDetails: any;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorCode = errorData.code;
      errorDetails = errorData;
    } else {
      const text = await response.text();
      if (text) {
        errorMessage = text;
        errorDetails = text;
      }
    }
  } catch {
    // keep default errorMessage
  }

  throw new APIError(errorMessage, errorCode, status, errorDetails);
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error): boolean {
  if (!error) return false;

  // Check error message for network-related keywords
  const message = error.message?.toLowerCase() || '';
  const networkKeywords = [
    'network',
    'fetch',
    'connection',
    'timeout',
    'offline',
    'failed to fetch',
    'networkerror',
    'net::err',
  ];

  if (networkKeywords.some(keyword => message.includes(keyword))) {
    return true;
  }

  // Check error name
  const name = error.name?.toLowerCase() || '';
  if (name === 'networkerror' || name === 'typeerror') {
    return true;
  }

  // Check if it's an APIError with no status code (likely network issue)
  if (error instanceof APIError && !error.statusCode) {
    return true;
  }

  return false;
}

/**
 * Get user-friendly error message in Indonesian
 */
export function getUserFriendlyMessage(error: Error): string {
  if (!error) {
    return 'Terjadi kesalahan yang tidak diketahui';
  }

  // Network errors
  if (isNetworkError(error)) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.';
  }

  // APIError with status code
  if (error instanceof APIError) {
    const statusCode = error.statusCode;

    // Map status codes to Indonesian messages
    switch (statusCode) {
      case 400:
        return error.message || 'Permintaan tidak valid. Periksa data yang Anda masukkan.';
      case 401:
        return 'Sesi Anda telah berakhir. Silakan login kembali.';
      case 403:
        return 'Anda tidak memiliki izin untuk melakukan tindakan ini.';
      case 404:
        return 'Data yang Anda cari tidak ditemukan.';
      case 409:
        return error.message || 'Terjadi konflik dengan data yang ada.';
      case 429:
        return 'Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.';
      case 500:
        return 'Terjadi kesalahan pada server. Tim kami sedang menanganinya.';
      case 502:
      case 503:
      case 504:
        return 'Server sedang sibuk atau dalam pemeliharaan. Silakan coba lagi nanti.';
      default:
        // Use the error message if available
        if (error.message && error.message !== 'Request failed') {
          return error.message;
        }
        return 'Terjadi kesalahan saat memproses permintaan Anda.';
    }
  }

  // Generic error with message
  if (error.message) {
    return error.message;
  }

  // Fallback
  return 'Terjadi kesalahan yang tidak diketahui';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (isNetworkError(error)) {
    return true;
  }

  if (error instanceof APIError) {
    const statusCode = error.statusCode;
    // Retry on server errors and rate limiting
    return statusCode === 429 || statusCode === 502 || statusCode === 503 || statusCode === 504;
  }

  return false;
}

/**
 * Format error for logging (development only)
 */
export function formatErrorForLogging(error: Error): string {
  if (error instanceof APIError) {
    return JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    }, null, 2);
  }

  return JSON.stringify({
    name: error.name,
    message: error.message,
    stack: error.stack,
  }, null, 2);
}
