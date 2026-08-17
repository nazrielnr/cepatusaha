/**
 * Clean inspect mode artifacts from HTML before saving/publishing
 * Removes injected styles and classes that should not persist
 */

const INSPECT_OUTLINE_CLASS = '__inspect-hover-outline__'
const INSPECT_STYLE_ID = '__inspect-styles__'

/**
 * Remove all inspect mode artifacts from the iframe document
 */
export function cleanInspectArtifacts(doc: Document): void {
  // Remove all inspect outline classes from elements
  const elementsWithClass = doc.querySelectorAll(`.${INSPECT_OUTLINE_CLASS}`)
  elementsWithClass.forEach(el => {
    el.classList.remove(INSPECT_OUTLINE_CLASS)

    // Also remove the class from className string if it's the only class
    if (el.className === INSPECT_OUTLINE_CLASS) {
      el.removeAttribute('class')
    }
  })

  // Remove inject style tag
  const styleEl = doc.getElementById(INSPECT_STYLE_ID)
  if (styleEl) {
    styleEl.remove()
  }

}

/**
 * Extract clean HTML from document (without inspect artifacts)
 * Returns HTML with DOCTYPE prepended
 */
export function extractCleanHtml(doc: Document): string {
  // First, clean all inspect artifacts
  cleanInspectArtifacts(doc)

  // Then extract HTML
  const doctype = '<!DOCTYPE html>\n'
  const htmlContent = doc.documentElement.outerHTML

  return doctype + htmlContent
}

/**
 * Strip inspect artifacts from HTML string
 * Use this as a safety fallback if document cleaning failed
 */
export function stripInspectArtifactsFromString(html: string): string {
  let cleaned = html

  // Remove style tag with inspect styles
  const styleRegex = new RegExp(
    `<style[^>]*id="${INSPECT_STYLE_ID}"[^>]*>[\\s\\S]*?</style>`,
    'gi'
  )
  cleaned = cleaned.replace(styleRegex, '')

  // Remove inspect outline class from elements
  const classRegex = new RegExp(
    `\\s*${INSPECT_OUTLINE_CLASS}\\s*`,
    'g'
  )
  cleaned = cleaned.replace(classRegex, ' ')

  // Clean up double spaces and empty class attributes
  cleaned = cleaned.replace(/class="\s+"/g, '')
  cleaned = cleaned.replace(/class=""/g, '')
  cleaned = cleaned.replace(/\s+class=""/g, '')

  return cleaned
}
