/**
 * Error Handling Utilities
 * Common error handling functions
 */

/**
 * Custom API Error class
 */
export class APIError extends Error {
  public code?: string;
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, code?: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error): boolean {
  if (!error) return false;

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

  if (networkKeywords.some((keyword) => message.includes(keyword))) {
    return true;
  }

  const name = error.name?.toLowerCase() || '';
  if (name === 'networkerror' || name === 'typeerror') {
    return true;
  }

  if (error instanceof APIError && !error.statusCode) {
    return true;
  }

  return false;
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
    return statusCode === 429 || statusCode === 502 || statusCode === 503 || statusCode === 504;
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

  if (isNetworkError(error)) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.';
  }

  if (error instanceof APIError) {
    const statusCode = error.statusCode;

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
        if (error.message && error.message !== 'Request failed') {
          return error.message;
        }
        return 'Terjadi kesalahan saat memproses permintaan Anda.';
    }
  }

  if (error.message) {
    return error.message;
  }

  return 'Terjadi kesalahan yang tidak diketahui';
}

/**
 * Handle API response and parse errors
 */
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

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

    const text = await response.text();
    return text as unknown as T;
  }

  let errorMessage = 'Request failed';
  let errorCode: string | undefined;
  let errorDetails: unknown;

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
      }
    }
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  throw new APIError(errorMessage, errorCode, response.status, errorDetails);
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: Error): string {
  if (error instanceof APIError) {
    return JSON.stringify(
      {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack,
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    null,
    2
  );
}
