import { useEffect } from 'react'

/**
 * Hook untuk mencegah library (seperti Radix UI) menambahkan padding ke body
 * yang menyebabkan layout shift
 */
export function usePreventBodyPadding() {
  useEffect(() => {
    const lockBodyStyles = () => {
      const body = document.body
      const html = document.documentElement

      // Force reset semua style yang bisa menyebabkan shift
      body.style.paddingRight = '0'
      body.style.marginRight = '0'
      body.style.paddingLeft = '0'
      body.style.marginLeft = '0'
      body.style.width = '100vw'
      body.style.maxWidth = '100vw'

      html.style.paddingRight = '0'
      html.style.marginRight = '0'
      html.style.width = '100vw'
      html.style.maxWidth = '100vw'
    }

    // Lock immediately
    lockBodyStyles()

    // Observer untuk mendeteksi perubahan style pada body dan html
    const observer = new MutationObserver(() => {
      lockBodyStyles()
    })

    // Observe both body and html
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class']
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    })

    // Also lock on any DOM changes (aggressive)
    const intervalId = setInterval(lockBodyStyles, 100)

    return () => {
      observer.disconnect()
      clearInterval(intervalId)
    }
  }, [])
}
