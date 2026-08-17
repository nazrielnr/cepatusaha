import type { ElementData } from '@/hooks/useInspectMode'

// Text elements (can be edited inline)
const TEXT_EDITABLE_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'LABEL', 'TD', 'TH']

// Image elements (can be edited with image upload)
const IMAGE_TAGS = ['IMG']

// Structural elements (AI-only, no inline edit)
const STRUCTURAL_TAGS = ['DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'TABLE', 'FORM', 'UL', 'OL']

// All selectable tags
const SELECTABLE_TAGS = [...TEXT_EDITABLE_TAGS, ...IMAGE_TAGS, ...STRUCTURAL_TAGS]

function getDomPath(el: Element): string {
  const path: number[] = []
  let cur: Element | null = el
  while (cur?.parentElement && cur !== cur.ownerDocument.body) {
    path.unshift(Array.prototype.indexOf.call(cur.parentElement.children, cur))
    cur = cur.parentElement
  }
  return path.join('/')
}

const INSPECT_OUTLINE_CLASS = '__inspect-hover-outline__'
const INSPECT_STYLE_ID = '__inspect-styles__'

type InspectScriptOptions = {
  onElementSelected: (data: ElementData) => void
  onError?: (error: Error) => void
}

/**
 * Inject inspect mode script into iframe document
 * Handles hover effects and click detection for text elements
 */
export function injectInspectScript(
  doc: Document,
  options: InspectScriptOptions
): () => void {
  const { onElementSelected, onError } = options

  // Track listeners for cleanup
  const listeners: Array<{ element: EventTarget; event: string; handler: EventListener }> = []

  // Suppress console errors from AI-generated HTML (prevent spam)
  const originalConsoleError = doc.defaultView?.console.error
  if (doc.defaultView && originalConsoleError) {
    doc.defaultView.console.error = (...args: any[]) => {
      // Filter out known errors from AI-generated HTML
      const message = args[0]?.toString() || ''
      if (message.includes('querySelector') || message.includes('not a valid selector')) {
        return // Suppress this error
      }
      originalConsoleError.apply(doc.defaultView!.console, args)
    }
  }

  try {
    // Inject CSS styles for hover effect
    let styleEl = doc.getElementById(INSPECT_STYLE_ID) as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = doc.createElement('style')
      styleEl.id = INSPECT_STYLE_ID
      styleEl.textContent = `
        .${INSPECT_OUTLINE_CLASS} {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 2px !important;
          transition: outline 0.15s ease !important;
          cursor: crosshair !important;
        }

        .${INSPECT_OUTLINE_CLASS}:hover {
          outline-color: #8b5cf6 !important;
          outline-width: 3px !important;
        }
      `
      doc.head.appendChild(styleEl)
    }

    // Helper: Check if element is selectable
    const isSelectable = (el: HTMLElement): boolean => {
      if (!SELECTABLE_TAGS.includes(el.tagName)) return false
      if (IMAGE_TAGS.includes(el.tagName)) return Boolean((el as HTMLImageElement).src)
      if (STRUCTURAL_TAGS.includes(el.tagName)) return true
      return Boolean(el.textContent?.trim())
    }

    // Helper: Add listener and track for cleanup
    const addListener = (element: EventTarget, event: string, handler: EventListener) => {
      element.addEventListener(event, handler)
      listeners.push({ element, event, handler })
    }

    // Mouseover: Add outline to selectable elements
    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement
      if (isSelectable(target)) {
        target.classList.add(INSPECT_OUTLINE_CLASS)
      }
    }

    // Mouseout: Remove outline
    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement
      target.classList.remove(INSPECT_OUTLINE_CLASS)
    }

    // Click: Select element and extract data
    const handleClick = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as HTMLElement

      if (!isSelectable(target)) {
        return
      }

      // Remove outline from all elements
      doc.querySelectorAll(`.${INSPECT_OUTLINE_CLASS}`).forEach(el => {
        el.classList.remove(INSPECT_OUTLINE_CLASS)
      })

      // Extract element data
      // Note: Send iframe-relative coordinates, parent will transform them
      const mouseEvent = e as MouseEvent

      // Determine if element is text-editable, image-editable, or structural
      const isTextEditable = TEXT_EDITABLE_TAGS.includes(target.tagName)
      const isImageEditable = IMAGE_TAGS.includes(target.tagName)

      // Extract current image src if element is an IMG
      const currentSrc = isImageEditable ? (target as HTMLImageElement).src : undefined

      const elementData: ElementData = {
        element: target,
        tag: target.tagName,
        text: target.textContent?.trim() || '',
        classes: target.className,
        html: target.outerHTML,
        position: {
          // Send iframe-relative coordinates (will be transformed in parent)
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        },
        isTextEditable,
        isImageEditable,
        currentSrc,
        domPath: getDomPath(target)
      }

      // Callback to parent
      onElementSelected(elementData)
    }

    // Attach event listeners to document
    addListener(doc, 'mouseover', handleMouseOver)
    addListener(doc, 'mouseout', handleMouseOut)
    addListener(doc, 'click', handleClick)


    // Return cleanup function
    return () => {
      // Remove all listeners
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler)
      })

      // Remove outline class from all elements
      doc.querySelectorAll(`.${INSPECT_OUTLINE_CLASS}`).forEach(el => {
        el.classList.remove(INSPECT_OUTLINE_CLASS)
      })

      // Remove style element
      const style = doc.getElementById(INSPECT_STYLE_ID)
      if (style) {
        style.remove()
      }

      // Restore original console.error
      if (doc.defaultView && originalConsoleError) {
        doc.defaultView.console.error = originalConsoleError
      }

    }

  } catch (error) {
    console.error('❌ Failed to inject inspect script:', error)
    if (onError && error instanceof Error) {
      onError(error)
    }

    // Return no-op cleanup
    return () => {}
  }
}

/**
 * Check if iframe is ready for script injection
 */
export function isIframeReady(iframe: HTMLIFrameElement | null): boolean {
  if (!iframe) return false

  try {
    const doc = iframe.contentDocument
    if (!doc) return false

    // Check if document is loaded and body exists
    return doc.readyState === 'complete' && Boolean(doc.body)
  } catch (error) {
    console.error('Failed to check iframe readiness:', error)
    return false
  }
}

/**
 * Wait for iframe to be ready, then inject script
 */
export function injectWhenReady(
  iframe: HTMLIFrameElement,
  options: InspectScriptOptions,
  timeout = 5000
): Promise<() => void> {
  return new Promise((resolve, reject) => {
    if (isIframeReady(iframe)) {
      const cleanup = injectInspectScript(iframe.contentDocument!, options)
      resolve(cleanup)
      return
    }

    const timeoutId = setTimeout(() => {
      iframe.removeEventListener('load', onLoad)
      reject(new Error('Iframe load timeout'))
    }, timeout)

    const onLoad = () => {
      clearTimeout(timeoutId)

      if (iframe.contentDocument) {
        const cleanup = injectInspectScript(iframe.contentDocument, options)
        resolve(cleanup)
      } else {
        reject(new Error('Iframe content document not accessible'))
      }
    }

    iframe.addEventListener('load', onLoad, { once: true })
  })
}
