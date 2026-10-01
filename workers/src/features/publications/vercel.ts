import type { Bindings } from '../../bindings'
import type { PublishedPage } from './service'

export type VercelDeployment = { url: string; deploymentId: string | null }

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

// Deploys pages as an instant static deployment. Project name = slug, so the
// deployment URL is <slug>-<id>[.<team>].vercel.app (name then generated id).
// ponytail: VERCEL_TOKEN is the CLI-scoped token and expires; swap for a
// dedicated dashboard token when publish starts returning 401/403.
export async function deployToVercel(env: Bindings, name: string, pages: PublishedPage[]): Promise<VercelDeployment> {
  const teamQuery = env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}` : ''
  const res = await fetch(`https://api.vercel.com/v13/deployments${teamQuery}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      target: 'production',
      projectSettings: { framework: null },
      files: pages.map((p) => ({ file: `/${p.path}`, data: toBase64(p.content), encoding: 'base64' })),
    }),
  })
  const json = await res.json() as { url?: string; id?: string; readyState?: string; error?: { message?: string } }
  if (!res.ok || !json.url) {
    throw new Error(json.error?.message || `Vercel deploy gagal (${res.status})`)
  }
  // Generated sites are public: strip Vercel deployment protection, otherwise
  // visitors get an auth wall instead of the site. Persists on the project.
  const unprotect = await fetch(`https://api.vercel.com/v9/projects/${name}${teamQuery}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ passwordProtection: null }),
  })
  if (!unprotect.ok) throw new Error(`Vercel deploy gagal: tidak bisa mematikan deployment protection (${unprotect.status})`)
  const url = `https://${json.url}`
  // Wait until the site actually serves (READY) so the returned URL works immediately.
  const deadline = Date.now() + 60_000
  let ready = json.readyState ?? 'QUEUED'
  while (ready !== 'READY' && ready !== 'ERROR' && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await fetch(`https://api.vercel.com/v13/deployments/${json.id}${teamQuery}`, { headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` } })
    const state = await poll.json() as { readyState?: string }
    ready = state.readyState ?? ready
  }
  if (ready !== 'READY') throw new Error(`Vercel deploy tidak selesai (${ready})`)
  return { url, deploymentId: json.id ?? null }
}
