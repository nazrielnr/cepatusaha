/**
 * Multi-Page Preview Utilities
 *
 * Enables navigation between multiple HTML files in the preview iframe
 * without requiring a server or SPA framework.
 *
 * Approach:
 * 1. Create Blob URLs for each HTML file
 * 2. Inject navigation script to intercept <a> clicks
 * 3. Use postMessage to communicate with parent window
 * 4. Parent swaps iframe src to appropriate Blob URL
 */

export interface PageBlobMapping {
  /** File path: 'index.html', 'about.html', 'pages/contact.html' */
  path: string
  /** Blob URL for this page */
  blobUrl: string
  /** Combined HTML content (with CSS/JS injected) */
  content: string
}

export interface FileData {
  file_path: string
  content: string
  file_type?: string
}

/**
 * Navigation handler script injected into each HTML page.
 * Intercepts <a> clicks and sends message to parent window.
 */
const NAVIGATION_SCRIPT = `
<script data-preview-nav="true">
(function() {
  // Intercept all link clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip external links, anchors, javascript:, mailto:, tel:
    if (href.startsWith('http://') || href.startsWith('https://') ||
        href.startsWith('#') || href.startsWith('javascript:') ||
        href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // Prevent default navigation
    e.preventDefault();
    e.stopPropagation();

    // Notify parent window
    window.parent.postMessage({
      type: 'PREVIEW_NAVIGATE',
      href: href
    }, '*');
  }, true);

  document.addEventListener('submit', function(e) {
    if (e.defaultPrevented) return;
    const form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    const action = form.getAttribute('action');
    if (!action || action === '#') {
      e.preventDefault();
      console.warn('[Preview] Native empty form submit blocked. Add a submit handler with preventDefault() + fetch(), or set a real action URL.');
    }
  });
})();
</script>
`;

/**
 * Inject navigation handler script into HTML content.
 * Inserts before </body> if exists, otherwise appends to end.
 */
export function injectNavigationHandler(html: string): string {
  if (html.includes('data-preview-nav="true"')) {
    // Already has navigation script
    return html
  }

  if (html.includes('</body>')) {
    return html.replace('</body>', `${NAVIGATION_SCRIPT}\n</body>`)
  }

  // No </body> tag, append to end
  return html + '\n' + NAVIGATION_SCRIPT
}

/**
 * Combine HTML with CSS and JS files (inline injection).
 */
function resolveFilePath(currentPath: string, targetHref: string): string {
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

function parseDotEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    else value = value.replace(/\s+#.*$/, '')
    env[match[1]] = value.replace(/\\n/g, '\n')
  }
  return env
}

function workspaceEnv(files: FileData[]): Record<string, string> {
  return parseDotEnv(files.find(file => resolveFilePath('', file.file_path) === '.env')?.content ?? '')
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/[<\u2028\u2029]/g, char => char === '<' ? '\\u003c' : char === '\u2028' ? '\\u2028' : '\\u2029')
}

function injectWorkspaceEnv(html: string, env: Record<string, string>): string {
  if (html.includes('data-workspace-env="true"')) return html
  const script = `<script data-workspace-env="true">\nwindow.__ENV__ = Object.assign({}, window.__ENV__ || {}, ${safeJson(env)});\nwindow.process = window.process || {};\nwindow.process.env = Object.assign({}, window.process.env || {}, window.__ENV__);\n</script>`
  if (html.includes('<head>')) return html.replace('<head>', `<head>\n${script}`)
  if (html.includes('<body')) return html.replace('<body', `${script}\n<body`)
  return `${script}\n${html}`
}

function getAttr(tag: string, name: string): string {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] ?? ''
}

function toFileMap(files: FileData[]): Map<string, string> {
  return new Map(files.map(file => [resolveFilePath('', file.file_path), file.content]))
}

function inlineLinkedCss(html: string, htmlPath: string, cssByPath: Map<string, string>): string {
  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = getAttr(tag, 'href')
    const rel = getAttr(tag, 'rel').toLowerCase()
    if (!href || !rel.split(/\s+/).includes('stylesheet')) return tag
    const content = cssByPath.get(resolveFilePath(htmlPath, href))
    return content ? `<style data-injected="true" data-source="${href}">\n${content}\n</style>` : tag
  })
}

function transformEnvImports(js: string): string {
  const envExpr = 'window.__ENV__ || (window.process && window.process.env) || {}'
  return js
    .replace(/^\s*import\s+\{\s*env(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*\}\s+from\s+['"][^'"]*env\.js['"];?\s*$/gm, (_match, alias) => `const ${alias || 'env'} = ${envExpr}`)
    .replace(/^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+['"][^'"]*env\.js['"];?\s*$/gm, (_match, name) => `const ${name} = ${envExpr}`)
}

function inlineLinkedJs(html: string, htmlPath: string, jsByPath: Map<string, string>): string {
  return html.replace(/<script\b[^>]*\bsrc\s*=\s*(["']).*?\1[^>]*>\s*<\/script>/gis, (tag) => {
    const src = getAttr(tag, 'src')
    const content = src ? jsByPath.get(resolveFilePath(htmlPath, src)) : undefined
    const type = getAttr(tag, 'type')
    const js = transformEnvImports(content ?? '')
    const isModule = type.toLowerCase() === 'module'
    const needsDomReady = !isModule && /\bdefer\b/i.test(tag)
    const body = needsDomReady ? `window.addEventListener('DOMContentLoaded', function() {\n${js}\n});` : js
    // ponytail: general ESM import graph not bundled; preview HTTP server is the upgrade path
    return content ? `<script${type ? ` type="${type}"` : ''} data-injected="true" data-source="${src}">\n${body}\n</script>` : tag
  })
}

function combineHtmlWithAssets(
  htmlContent: string,
  cssFiles: FileData[],
  jsFiles: FileData[],
  htmlPath = 'index.html'
): string {
  return inlineLinkedJs(inlineLinkedCss(htmlContent, htmlPath, toFileMap(cssFiles)), htmlPath, toFileMap(jsFiles))
}

/**
 * Create Blob URL mappings for all HTML files in the project.
 * Each HTML file gets CSS/JS injected and navigation handler added.
 */
export function createPageBlobMappings(files: FileData[]): PageBlobMapping[] {
  // Separate HTML, CSS, and JS files
  const htmlFiles = files.filter(f =>
    f.file_path.toLowerCase().endsWith('.html')
  )
  const cssFiles = files.filter(f =>
    f.file_type === 'css' || f.file_path.toLowerCase().endsWith('.css')
  )
  const jsFiles = files.filter(f =>
    f.file_type === 'javascript' || f.file_path.toLowerCase().endsWith('.js')
  )
  const env = workspaceEnv(files)

  if (htmlFiles.length === 0) {
    console.warn('[multiPagePreview] No HTML files found')
    return []
  }


  const mappings: PageBlobMapping[] = []

  for (const htmlFile of htmlFiles) {
    // Combine with workspace env + linked CSS and JS
    let content = combineHtmlWithAssets(injectWorkspaceEnv(htmlFile.content, env), cssFiles, jsFiles, htmlFile.file_path)

    // Inject navigation handler
    content = injectNavigationHandler(content)

    // Create Blob URL
    const blob = new Blob([content], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)

    mappings.push({
      path: htmlFile.file_path,
      blobUrl,
      content
    })
  }


  return mappings
}

/**
 * Resolve relative path from current page to target href.
 *
 * Examples:
 * - resolvePagePath('index.html', 'about.html') => 'about.html'
 * - resolvePagePath('pages/home.html', '../contact.html') => 'contact.html'
 * - resolvePagePath('index.html', 'pages/about.html') => 'pages/about.html'
 */
export function resolvePagePath(currentPath: string, targetHref: string): string {
  if (targetHref.split('?')[0].split('#')[0] === '/') return 'index.html'
  return resolveFilePath(currentPath, targetHref) || 'index.html'
}

/**
 * Find the best matching page for a given path.
 * Tries exact match first, then with/without .html extension.
 */
export function findPageMapping(
  mappings: PageBlobMapping[],
  targetPath: string
): PageBlobMapping | undefined {
  // Exact match
  let found = mappings.find(m => m.path === targetPath)
  if (found) return found

  // Try with .html extension
  if (!targetPath.endsWith('.html')) {
    found = mappings.find(m => m.path === targetPath + '.html')
    if (found) return found
  }

  // Try directory index
  const normalized = targetPath.replace(/\/$/, '')
  found = mappings.find(m => m.path === `${normalized}/index.html`)
  if (found) return found

  // Try without .html extension
  if (targetPath.endsWith('.html')) {
    const withoutExt = targetPath.slice(0, -5)
    found = mappings.find(m => m.path === withoutExt)
    if (found) return found
  }

  // Try case-insensitive match
  const lowerTarget = targetPath.toLowerCase()
  found = mappings.find(m => m.path.toLowerCase() === lowerTarget)
  if (found) return found

  return undefined
}

/**
 * Cleanup all Blob URLs to free memory.
 * Call this when component unmounts or files change.
 */
export function revokePageBlobMappings(mappings: PageBlobMapping[]): void {
  for (const mapping of mappings) {
    try {
      URL.revokeObjectURL(mapping.blobUrl)
    } catch (e) {
      console.warn('[multiPagePreview] Failed to revoke blob URL:', e)
    }
  }
}
