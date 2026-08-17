/**
 * Storage Utilities
 * Browser localStorage helpers with type safety
 */

/**
 * Load data from localStorage with type safety
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.warn(`[Storage] Failed to load key "${key}":`, error);
  }
  return defaultValue;
}

/**
 * Save data to localStorage
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[Storage] Failed to save key "${key}":`, error);
  }
}

/**
 * Remove data from localStorage
 */
export function removeFromStorage(key: string): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[Storage] Failed to remove key "${key}":`, error);
  }
}

/**
 * Clear all data with a specific prefix from localStorage
 */
export function clearStorageByPrefix(prefix: string): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn(`[Storage] Failed to clear prefix "${prefix}":`, error);
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get storage usage in bytes
 */
export function getStorageUsage(): number {
  try {
    if (typeof window === 'undefined') {
      return 0;
    }
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total * 2; // UTF-16 encoding
  } catch (error) {
    return 0;
  }
}
