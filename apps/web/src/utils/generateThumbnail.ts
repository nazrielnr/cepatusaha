import html2canvas from 'html2canvas'
import { getCachedThumbnail, setCachedThumbnail } from './thumbnailCache'

/**
 * Generate a thumbnail from an iframe preview
 * Uses localStorage cache to avoid regenerating thumbnails
 * @param iframeRef - Reference to the iframe element
 * @param sessionId - Optional session ID for caching
 * @param forceRegenerate - Force regeneration even if cached version exists
 * @returns Base64 encoded JPEG thumbnail (400x300px)
 */
export async function generateThumbnail(
  iframeRef: HTMLIFrameElement,
  sessionId?: string,
  forceRegenerate = false
): Promise<string | null> {
  // Check cache first if sessionId provided and not forcing regeneration
  if (sessionId && !forceRegenerate) {
    const cached = getCachedThumbnail(sessionId)
    if (cached) {
            return cached
    }
  }
  try {
    // Ensure iframe is loaded
    if (!iframeRef.contentDocument || !iframeRef.contentWindow) {
      console.warn('[generateThumbnail] Iframe not ready')
      return null
    }

    const doc = iframeRef.contentDocument
    const body = doc.body

    if (!body) {
      console.warn('[generateThumbnail] Iframe body not found')
      return null
    }

    // Capture screenshot using html2canvas
    const canvas = await html2canvas(body, {
      width: 1200, // Capture at higher resolution
      height: 900,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1200,
      windowHeight: 900,
    })

    // Create a smaller canvas for the thumbnail
    const thumbnailCanvas = document.createElement('canvas')
    thumbnailCanvas.width = 400
    thumbnailCanvas.height = 300

    const ctx = thumbnailCanvas.getContext('2d')
    if (!ctx) {
      console.error('[generateThumbnail] Failed to get canvas context')
      return null
    }

    // Draw the captured image scaled down to thumbnail size
    ctx.drawImage(canvas, 0, 0, 400, 300)

    // Convert to base64 JPEG with 70% quality
    const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.7)


    // Cache the thumbnail if sessionId provided
    if (sessionId) {
      setCachedThumbnail(sessionId, thumbnail)
    }

    return thumbnail

  } catch (error) {
    console.error('[generateThumbnail] Failed to generate thumbnail:', error)
    return null
  }
}
