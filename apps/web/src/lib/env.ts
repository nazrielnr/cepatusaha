export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8787'
).replace(/\/$/, '')

export const API_PATH = (import.meta.env.VITE_API_PATH || '/api').trim()
