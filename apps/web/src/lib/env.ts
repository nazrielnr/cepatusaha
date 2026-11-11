export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8787'
).replace(/\/$/, '')

// Optional separate origin for the CPU-heavy AI chat stream (e.g. a self-hosted
// container behind a tunnel). Everything else keeps using API_BASE_URL.
export const CHAT_API_BASE_URL = (import.meta.env.VITE_CHAT_API_URL || '').trim().replace(/\/$/, '')

export const API_PATH = (import.meta.env.VITE_API_PATH || '/api').trim()
