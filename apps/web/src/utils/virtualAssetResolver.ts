/**
 * Virtual Asset Resolver
 *
 * Enables projects to use standard relative asset paths (e.g. 'assets/hero.png',
 * 'src/assets/images/banner.jpg', '/assets/logo.svg') in HTML and CSS, while
 * mapping them directly to physical storage in Cloudflare R2 bucket.
 */

export const ASSET_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'avif', 'bmp', 'tiff',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'mp4', 'webm', 'ogg', 'mp3', 'wav',
  'pdf'
])

export interface ProjectAssetFile {
  file_path: string
  content?: string
  file_type?: string
}

export function isAssetFilePath(path: string): boolean {
  if (!path) return false
  const clean = path.split('?')[0].split('#')[0].trim()
  const ext = clean.split('.').pop()?.toLowerCase() || ''
  return ASSET_EXTENSIONS.has(ext)
}

export function isRemoteUrl(url: string): boolean {
  if (!url) return false
  return /^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')
}

export function cleanRefPath(ref: string): string {
  return ref.split('?')[0].split('#')[0].trim()
}

export function resolveFilePath(currentPath: string, targetHref: string): string {
  let target = targetHref.split('?')[0].split('#')[0].trim()
  if (!target || /^(https?:)?\/\//i.test(target) || /^[a-z]+:/i.test(target)) return ''
  target = target.startsWith('/') ? target.slice(1) : `${currentPath.includes('/') ? currentPath.slice(0, currentPath.lastIndexOf('/') + 1) : ''}${target}`
  const parts: string[] = []
  for (const part of target.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

/**
 * Filter project files to only valid assets that have an accessible R2/HTTP content URL.
 */
export function getProjectAssetFiles(files: ProjectAssetFile[]): ProjectAssetFile[] {
  return files.filter(f => {
    if (!f.file_path || !f.content) return false
    const isAsset = isAssetFilePath(f.file_path) || f.file_path.includes('/assets/') || f.file_path.startsWith('assets/')
    const hasUrl = f.content.startsWith('http://') || f.content.startsWith('https://') || f.content.startsWith('/api/assets/')
    return isAsset && hasUrl
  })
}

/**
 * Find the matching Cloudflare R2 URL for a given relative or virtual asset reference.
 */
export function findAssetUrl(
  ref: string,
  currentDocPath: string,
  assetFiles: ProjectAssetFile[]
): { url: string; assetPath: string } | null {
  if (!ref || isRemoteUrl(ref)) return null
  const cleaned = cleanRefPath(ref)
  if (!cleaned) return null

  const resolved = resolveFilePath(currentDocPath, cleaned)
  const normalizedNoLeading = cleaned.replace(/^\/+/, '')

  // 1. Exact match with resolved relative path
  if (resolved) {
    const match = assetFiles.find(a => a.file_path === resolved)
    if (match?.content) return { url: match.content, assetPath: match.file_path }
  }

  // 2. Exact match with cleaned path (e.g. 'assets/logo.png')
  const exactMatch = assetFiles.find(a => a.file_path === normalizedNoLeading)
  if (exactMatch?.content) return { url: exactMatch.content, assetPath: exactMatch.file_path }

  // 3. Match without 'src/' prefix if asset has 'src/'
  const matchWithoutSrc = assetFiles.find(a => {
    const stripped = a.file_path.replace(/^src\//, '')
    return stripped === normalizedNoLeading
  })
  if (matchWithoutSrc?.content) return { url: matchWithoutSrc.content, assetPath: matchWithoutSrc.file_path }

  // 4. Suffix match (e.g. 'images/banner.png' or 'banner.png')
  const suffixMatch = assetFiles.find(a => a.file_path.endsWith(`/${normalizedNoLeading}`))
  if (suffixMatch?.content) return { url: suffixMatch.content, assetPath: suffixMatch.file_path }

  // 5. Basename match fallback (e.g. 'banner.png' matching 'src/assets/images/banner.png')
  const refBasename = normalizedNoLeading.split('/').pop()
  if (refBasename) {
    const nameMatch = assetFiles.find(a => a.file_path.split('/').pop() === refBasename)
    if (nameMatch?.content) return { url: nameMatch.content, assetPath: nameMatch.file_path }
  }

  return null
}

/**
 * Resolve relative asset URLs in CSS (e.g. url('assets/hero.jpg') or url("assets/hero.jpg")).
 */
export function resolveAssetUrlsInCss(
  cssContent: string,
  cssPath: string,
  assetFiles: ProjectAssetFile[]
): string {
  if (!assetFiles.length || !cssContent) return cssContent

  return cssContent.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, urlValue) => {
    const found = findAssetUrl(urlValue, cssPath, assetFiles)
    if (found) {
      return `url(${quote || '"'}${found.url}${quote || '"'})`
    }
    return match
  })
}

/**
 * Resolve relative asset URLs in HTML:
 * - <img src="...">
 * - <source srcset="...">
 * - <link rel="icon" href="...">
 * - inline style="..." with url(...)
 *
 * If `retainDataPath` is true, keeps original virtual path in `data-asset-path="..."` attribute
 * so it can be restored when the canvas editor serializes HTML back to the database.
 */
export function resolveAssetUrlsInHtml(
  htmlContent: string,
  htmlPath: string,
  assetFiles: ProjectAssetFile[],
  options: { retainDataPath?: boolean } = {}
): string {
  if (!assetFiles.length || !htmlContent) return htmlContent
  const { retainDataPath = true } = options

  let result = htmlContent

  // 1. Replace <img ... src="..." ...>
  result = result.replace(/<img\b([^>]*?)>/gi, (fullTag, attrs) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)
    if (!srcMatch) return fullTag

    const rawSrc = srcMatch[2]
    const found = findAssetUrl(rawSrc, htmlPath, assetFiles)
    if (!found) return fullTag

    let newAttrs = attrs.replace(srcMatch[0], `src="${found.url}"`)
    if (retainDataPath && !newAttrs.includes('data-asset-path=')) {
      newAttrs = `${newAttrs} data-asset-path="${rawSrc}"`
    }
    return `<img${newAttrs}>`
  })

  // 2. Replace <link ... href="..." ...> for icons / images
  result = result.replace(/<link\b([^>]*?)>/gi, (fullTag, attrs) => {
    const relMatch = attrs.match(/\brel\s*=\s*(["'])(.*?)\1/i)
    const rel = relMatch ? relMatch[2].toLowerCase() : ''
    if (!rel.includes('icon') && !rel.includes('image') && !rel.includes('preload')) return fullTag

    const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i)
    if (!hrefMatch) return fullTag

    const rawHref = hrefMatch[2]
    const found = findAssetUrl(rawHref, htmlPath, assetFiles)
    if (!found) return fullTag

    const newAttrs = attrs.replace(hrefMatch[0], `href="${found.url}"`)
    return `<link${newAttrs}>`
  })

  // 3. Replace CSS url(...) in style attributes: style="... url(...) ..."
  result = result.replace(/\bstyle\s*=\s*(["'])(.*?)\1/gi, (fullAttr, quote, styleContent) => {
    const resolvedStyle = resolveAssetUrlsInCss(styleContent, htmlPath, assetFiles)
    return `style=${quote}${resolvedStyle}${quote}`
  })

  // 4. Replace CSS url(...) inside <style> blocks
  result = result.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (fullBlock, attrs, css) => {
    const resolvedCss = resolveAssetUrlsInCss(css, htmlPath, assetFiles)
    return `<style${attrs}>${resolvedCss}</style>`
  })

  return result
}

/**
 * Reverts any `data-asset-path` attributes on `<img>` tags back into `src="..."`
 * and strips the `data-asset-path` attribute.
 * Used before saving or serializing HTML back to the database.
 */
export function restoreAssetUrlsInHtml(htmlContent: string): string {
  if (!htmlContent) return htmlContent
  return htmlContent.replace(/<img\b([^>]*?)>/gi, (fullTag, attrs) => {
    const dataMatch = attrs.match(/\bdata-asset-path\s*=\s*(["'])(.*?)\1/i)
    if (!dataMatch) return fullTag

    const originalPath = dataMatch[2]
    let newAttrs = attrs.replace(dataMatch[0], '').trim()

    // Replace current src with original path
    const srcMatch = newAttrs.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)
    if (srcMatch) {
      newAttrs = newAttrs.replace(srcMatch[0], `src="${originalPath}"`)
    } else {
      newAttrs = `src="${originalPath}" ${newAttrs}`
    }

    // Clean up multiple spaces
    newAttrs = newAttrs.replace(/\s{2,}/g, ' ')
    return `<img ${newAttrs}>`
  })
}
