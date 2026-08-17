import assert from 'node:assert/strict'

function resolveFilePath(currentPath, targetHref) {
  let target = targetHref.split('?')[0].split('#')[0].trim()
  if (!target || /^(https?:)?\/\//i.test(target) || /^[a-z]+:/i.test(target)) return ''
  target = target.startsWith('/') ? target.slice(1) : `${currentPath.includes('/') ? currentPath.slice(0, currentPath.lastIndexOf('/') + 1) : ''}${target}`
  const parts = []
  for (const part of target.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}
function parseDotEnv(content) {
  const env = {}
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
function safeJson(value) { return JSON.stringify(value).replace(/[<\u2028\u2029]/g, char => char === '<' ? '\\u003c' : char === '\u2028' ? '\\u2028' : '\\u2029') }
function injectWorkspaceEnv(html, env) {
  if (html.includes('data-workspace-env="true"')) return html
  const script = `<script data-workspace-env="true">\nwindow.__ENV__ = Object.assign({}, window.__ENV__ || {}, ${safeJson(env)});\nwindow.process = window.process || {};\nwindow.process.env = Object.assign({}, window.process.env || {}, window.__ENV__);\n</script>`
  if (html.includes('<head>')) return html.replace('<head>', `<head>\n${script}`)
  if (html.includes('<body')) return html.replace('<body', `${script}\n<body`)
  return `${script}\n${html}`
}
function getAttr(tag, name) { return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] ?? '' }
function toFileMap(files) { return new Map(files.map(file => [resolveFilePath('', file.file_path), file.content])) }
function inlineLinkedCss(html, htmlPath, cssByPath) {
  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = getAttr(tag, 'href')
    const rel = getAttr(tag, 'rel').toLowerCase()
    if (!href || !rel.split(/\s+/).includes('stylesheet')) return tag
    const content = cssByPath.get(resolveFilePath(htmlPath, href))
    return content ? `<style data-injected="true" data-source="${href}">\n${content}\n</style>` : tag
  })
}
function transformEnvImports(js) {
  const envExpr = 'window.__ENV__ || (window.process && window.process.env) || {}'
  return js
    .replace(/^\s*import\s+\{\s*env(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*\}\s+from\s+['"][^'"]*env\.js['"];?\s*$/gm, (_match, alias) => `const ${alias || 'env'} = ${envExpr}`)
    .replace(/^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+['"][^'"]*env\.js['"];?\s*$/gm, (_match, name) => `const ${name} = ${envExpr}`)
}
function inlineLinkedJs(html, htmlPath, jsByPath) {
  return html.replace(/<script\b[^>]*\bsrc\s*=\s*(["']).*?\1[^>]*>\s*<\/script>/gis, (tag) => {
    const src = getAttr(tag, 'src')
    const content = src ? jsByPath.get(resolveFilePath(htmlPath, src)) : undefined
    const type = getAttr(tag, 'type')
    const js = transformEnvImports(content ?? '')
    const isModule = type.toLowerCase() === 'module'
    const needsDomReady = !isModule && /\bdefer\b/i.test(tag)
    const body = needsDomReady ? `window.addEventListener('DOMContentLoaded', function() {\n${js}\n});` : js
    return content ? `<script${type ? ` type="${type}"` : ''} data-injected="true" data-source="${src}">\n${body}\n</script>` : tag
  })
}
function combineHtmlWithAssets(htmlContent, cssFiles, jsFiles, htmlPath = 'index.html') {
  return inlineLinkedJs(inlineLinkedCss(htmlContent, htmlPath, toFileMap(cssFiles)), htmlPath, toFileMap(jsFiles))
}

assert.deepEqual(parseDotEnv('A=1\nB="two"\nexport C=three # comment\n'), { A: '1', B: 'two', C: 'three' })
const envHtml = injectWorkspaceEnv('<html><head></head><body></body></html>', { AI_MODEL_ID: 'gpt-4o-mini', X: '</script>' })
assert(envHtml.includes('data-workspace-env="true"'))
assert(envHtml.includes('AI_MODEL_ID'))
assert(!envHtml.includes('</script>"'))

const html = `
<link rel="stylesheet" href="../css/main.css">
<script defer src="../js/main.js"></script>
<script type="module" src="../js/module.js"></script>
`
const out = combineHtmlWithAssets(html, [
  { file_path: 'css/main.css', content: 'body{color:red}' },
], [
  { file_path: 'js/main.js', content: "document.querySelector('form').addEventListener('submit', e => e.preventDefault())" },
  { file_path: 'js/module.js', content: "import { env } from './env.js'\nwindow.model = env.AI_MODEL_ID" },
], 'pages/checkout.html')
assert(out.includes('body{color:red}'))
assert(out.includes("window.addEventListener('DOMContentLoaded'"))
assert(out.includes("document.querySelector('form')"))
assert(out.includes('const env = window.__ENV__'))
assert(out.includes('type="module"'))

console.log('multiPagePreview ok')
