/**
 * Path Security and Protection Utilities
 *
 * Enforces strict boundary checks against directory traversal and
 * prevents unauthorized user access to internal workspace artifacts (.artifacts/...).
 */

/**
 * Normalizes a path string, decoding URI components and normalizing separators.
 */
export function normalizeRelativePath(rawPath: string): string {
  if (!rawPath || typeof rawPath !== 'string') return ''
  let decoded = rawPath
  try {
    decoded = decodeURIComponent(rawPath)
  } catch {}
  return decoded.replace(/\\/g, '/').replace(/^\/+/, '').trim()
}

/**
 * Checks if a given path attempts directory traversal or contains illegal characters.
 */
export function isPathTraversal(rawPath: string): boolean {
  if (!rawPath || typeof rawPath !== 'string') return true

  // Disallow null bytes
  if (rawPath.includes('\0')) return true

  let decoded = rawPath
  try {
    decoded = decodeURIComponent(rawPath)
  } catch {
    return true
  }

  // Reject null bytes in decoded string
  if (decoded.includes('\0')) return true

  // Normalize slashes
  const normalized = decoded.replace(/\\/g, '/')

  // Reject absolute paths, Windows drive letters, or URL schemes
  if (normalized.startsWith('/') || /^[a-zA-Z]+:/.test(normalized)) return true

  // Check each path segment for traversal attempts
  const segments = normalized.split('/')
  for (const segment of segments) {
    const trimmed = segment.trim()
    if (trimmed === '..' || trimmed === '.' || trimmed === '') {
      // Empty segment might happen if there are double slashes //
      if (segment === '') return true
      return true
    }
  }

  // Whitelist safe characters: alphanumeric, dot, underscore, hyphen, forward slash
  if (!/^[a-zA-Z0-9._\-\/]+$/.test(normalized)) return true

  return false
}

/**
 * Checks if a path is protected/internal (such as .artifacts/, .env, .git)
 * Protected paths must never be exposed to or modified directly by the user.
 */
export function isProtectedPath(rawPath: string): boolean {
  if (isPathTraversal(rawPath)) return true

  const normalized = normalizeRelativePath(rawPath).toLowerCase()

  // Disallow access to .artifacts or artifacts directory
  if (
    normalized === '.artifacts' ||
    normalized.startsWith('.artifacts/') ||
    normalized === 'artifacts' ||
    normalized.startsWith('artifacts/')
  ) {
    return true
  }

  // Disallow access to sensitive system/dot files (.env, .git, etc.)
  const segments = normalized.split('/')
  if (segments.some(seg => seg.startsWith('.') || seg === '.env' || seg.startsWith('.git'))) {
    return true
  }

  return false
}

/**
 * Sanitizes a filename for storing inside .artifacts/images/.
 * Ensures it contains no path traversal or directory components.
 */
export function sanitizeArtifactFileName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') return 'image.png'

  // Extract basename only
  const base = rawName.split(/[/\\]/).pop() || 'image'

  // Remove dangerous characters, allow only alphanumeric, dots, underscores, dashes
  let cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')

  // Prevent hidden file dots or double extensions like ..png
  cleaned = cleaned.replace(/^\.+/, '')

  // Ensure reasonable length
  cleaned = cleaned.slice(0, 100)

  if (!cleaned) return 'image.png'

  // Ensure it has a recognized image extension if possible
  if (!/\.(png|jpe?g|gif|webp|svg|ico)$/i.test(cleaned)) {
    cleaned += '.png'
  }

  return cleaned
}
