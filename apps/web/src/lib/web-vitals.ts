/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals metrics and sends them to analytics
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 */

interface Metric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

/**
 * Send metric to analytics service
 * TODO: Replace with your analytics service (e.g., Google Analytics, Vercel Analytics)
 */
function sendToAnalytics(metric: Metric) {
  // Log to console in development

  // Send to analytics in production
  if (import.meta.env.PROD) {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_delta: Math.round(metric.delta),
        metric_id: metric.id,
      })
    }

    // Example: Send to custom analytics endpoint
    const body = JSON.stringify({
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: window.location.href,
      timestamp: Date.now(),
    })

    // Use sendBeacon if available (doesn't block page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/web-vitals', body)
    } else {
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(console.error)
    }
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this once when your app starts
 */
export async function initWebVitals() {
  try {
    // Dynamically import web-vitals to avoid blocking initial load
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals')

    // Track all Core Web Vitals
    onCLS(sendToAnalytics)
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
    onINP(sendToAnalytics)

      } catch (error) {
    console.error('[Web Vitals] Failed to initialize:', error)
  }
}

/**
 * Get current Web Vitals metrics
 * Useful for debugging or displaying in UI
 */
export async function getCurrentMetrics() {
  try {
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals')

    const metrics: Record<string, Metric> = {}

    const collectMetric = (metric: Metric) => {
      metrics[metric.name] = metric
    }

    onCLS(collectMetric, { reportAllChanges: true })
    onFCP(collectMetric, { reportAllChanges: true })
    onLCP(collectMetric, { reportAllChanges: true })
    onTTFB(collectMetric, { reportAllChanges: true })
    onINP(collectMetric, { reportAllChanges: true })

    return metrics
  } catch (error) {
    console.error('[Web Vitals] Failed to get metrics:', error)
    return {}
  }
}
