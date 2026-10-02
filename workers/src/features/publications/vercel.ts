import type { Bindings } from '../../bindings'
import type { PublishedPage } from './service'

export type VercelDeployment = {
  url: string
  domainUrl: string
  deploymentUrl: string
  deploymentId: string | null
  projectId: string | null
  projectName: string
}

export type DeployOptions = {
  existingProjectId?: string | null
  slug?: string
}

const ASSET_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'avif', 'bmp', 'tiff',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'mp4', 'webm', 'ogg', 'mp3', 'wav',
  'pdf'
])

function isAssetPath(path: string): boolean {
  const clean = path.split('?')[0].split('#')[0].trim()
  const ext = clean.split('.').pop()?.toLowerCase() || ''
  return ASSET_EXTENSIONS.has(ext)
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

/**
 * Resolves file content to base64 encoding for Vercel deployment.
 * For binary assets (images, fonts, etc.), it retrieves the actual binary data
 * from the Cloudflare R2 bucket (or via HTTP) and encodes the raw binary bytes.
 */
async function resolveFileBase64(env: Bindings, path: string, content: string): Promise<string> {
  const isUrl = content.startsWith('http://') || content.startsWith('https://') || content.startsWith('/api/assets/object/')
  const isDataUrl = content.startsWith('data:')

  if (isDataUrl) {
    const comma = content.indexOf(',')
    if (comma !== -1) return content.slice(comma + 1)
  }

  if (isAssetPath(path) || isUrl) {
    // 1. Try directly extracting R2 key
    const match = content.match(/\/api\/assets\/object\/([^?#]+)/)
    if (match && env.ASSETS_BUCKET) {
      try {
        const key = decodeURIComponent(match[1])
        const obj = await env.ASSETS_BUCKET.get(key)
        if (obj) {
          const buf = await obj.arrayBuffer()
          return arrayBufferToBase64(buf)
        }
      } catch (err) {
        console.warn(`[Vercel Deploy] ASSETS_BUCKET get error for ${path}:`, err)
      }
    }

    // 2. Fetch via HTTP if URL
    if (content.startsWith('http://') || content.startsWith('https://')) {
      try {
        const res = await fetch(content)
        if (res.ok) {
          const buf = await res.arrayBuffer()
          return arrayBufferToBase64(buf)
        }
      } catch (err) {
        console.warn(`[Vercel Deploy] Failed to fetch asset URL for ${path}:`, err)
      }
    }
  }

  // Standard text content
  return toBase64(content)
}

/**
 * Resolves the primary project domain URL (not the deployment preview URL with random hash).
 */
export async function resolveProjectDomain(
  env: Bindings,
  projectIdOrName: string,
  slug?: string
): Promise<string | null> {
  const teamQuery = env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}` : ''

  // Attempt to attach preferred <slug>.vercel.app if provided
  if (slug) {
    try {
      await fetch(`https://api.vercel.com/v9/projects/${projectIdOrName}/domains${teamQuery}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${slug}.vercel.app` }),
      })
    } catch {
      // Ignored if domain is already owned or assigned elsewhere
    }
  }

  try {
    // 1. Check custom domains assigned to the project
    const domRes = await fetch(`https://api.vercel.com/v9/projects/${projectIdOrName}/domains${teamQuery}`, {
      headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` },
    })
    if (domRes.ok) {
      const data = await domRes.json() as { domains?: Array<{ name: string; verified?: boolean }> }
      if (data.domains && data.domains.length > 0) {
        // Preferred exact match for slug
        if (slug) {
          const match = data.domains.find((d) => d.name === `${slug}.vercel.app`)
          if (match) return `https://${match.name}`
        }
        // Clean non-team alias
        const clean = data.domains.find((d) => !d.name.includes('-projects.vercel.app')) || data.domains[0]
        if (clean?.name) return `https://${clean.name}`
      }
    }

    // 2. Check project production aliases
    const projRes = await fetch(`https://api.vercel.com/v9/projects/${projectIdOrName}${teamQuery}`, {
      headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` },
    })
    if (projRes.ok) {
      const proj = await projRes.json() as { targets?: { production?: { alias?: string[] } } }
      const aliases = proj.targets?.production?.alias || []
      if (slug) {
        const match = aliases.find((a) => a === `${slug}.vercel.app`)
        if (match) return `https://${match}`
      }
      const clean = aliases.find((a) => !a.includes('-projects.vercel.app')) || aliases[0]
      if (clean) return `https://${clean}`
    }
  } catch (err) {
    console.warn('[Vercel Deploy] Failed to resolve project domain:', err)
  }

  return null
}

/**
 * Deploys pages to Vercel as a production deployment on an existing or new project.
 * Updates an existing project if existingProjectId is provided, ensuring seamless AI updates.
 * Returns the stable production domain URL instead of the ephemeral deployment URL.
 */
export async function deployToVercel(
  env: Bindings,
  name: string,
  pages: PublishedPage[],
  options?: DeployOptions
): Promise<VercelDeployment> {
  const teamQuery = env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}` : ''

  // Clean file paths relative to project root without leading slashes.
  const files = await Promise.all(
    pages.map(async (p) => {
      const cleanPath = p.path.replace(/^\/+/, '')
      const data = await resolveFileBase64(env, cleanPath, p.content)
      return {
        file: cleanPath,
        data,
        encoding: 'base64',
      }
    })
  )

  const deployPayload: Record<string, unknown> = {
    name,
    target: 'production',
    projectSettings: { framework: null },
    files,
  }
  if (options?.existingProjectId) {
    deployPayload.project = options.existingProjectId
  }

  const res = await fetch(`https://api.vercel.com/v13/deployments${teamQuery}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(deployPayload),
  })
  const json = await res.json() as {
    url?: string
    id?: string
    projectId?: string
    name?: string
    readyState?: string
    error?: { message?: string }
  }
  if (!res.ok || !json.url) {
    throw new Error(json.error?.message || `Vercel deploy gagal (${res.status})`)
  }

  const effectiveProjectId = json.projectId || options?.existingProjectId || name

  // Strip BOTH SSO protection and password protection so public visitors can view the deployed site
  const unprotect = await fetch(`https://api.vercel.com/v9/projects/${effectiveProjectId}${teamQuery}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ssoProtection: null,
      passwordProtection: null,
    }),
  })
  if (!unprotect.ok) {
    console.warn(`[Vercel Deploy] Warning: could not disable deployment protection (${unprotect.status})`)
  }

  // Wait until the site actually serves (READY) so the returned URL works immediately.
  const deadline = Date.now() + 60_000
  let ready = json.readyState ?? 'QUEUED'
  while (ready !== 'READY' && ready !== 'ERROR' && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await fetch(`https://api.vercel.com/v13/deployments/${json.id}${teamQuery}`, {
      headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` },
    })
    const state = await poll.json() as { readyState?: string }
    ready = state.readyState ?? ready
  }
  if (ready !== 'READY') throw new Error(`Vercel deploy tidak selesai (${ready})`)

  // Resolve the clean production DOMAIN URL (e.g. https://randai-minang.vercel.app)
  const resolvedDomain = await resolveProjectDomain(env, effectiveProjectId, options?.slug)
  const finalDomainUrl = resolvedDomain || `https://${json.url}`

  return {
    url: finalDomainUrl,
    domainUrl: finalDomainUrl,
    deploymentUrl: `https://${json.url}`,
    deploymentId: json.id ?? null,
    projectId: json.projectId ?? options?.existingProjectId ?? null,
    projectName: json.name || name,
  }
}
