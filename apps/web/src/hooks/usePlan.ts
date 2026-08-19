import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { getPlan, type PlanState } from '../api/plan'

export const formatTokens = (n: number): string => (n / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'K'

/** Format date string for the upcoming monthly quota reset (start of next month). */
export const nextResetLabel = (key?: string): string => {
  if (!key) return 'Bulan depan'
  const year = Number(key.slice(0, 4))
  const month = Number(key.slice(5, 7)) // 1-12
  if (isNaN(year) || isNaN(month)) return 'Bulan depan'
  // month parameter in Date constructor is 0-indexed, so passing `month` gives the 1st of the next month
  return new Date(year, month, 1).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function usePlan() {
  const { getToken, isSignedIn } = useAuth()
  const [plan, setPlan] = useState<PlanState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSignedIn) return
    setLoading(true)
    try {
      const token = await getToken()
      setPlan(await getPlan(token))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat kuota')
    } finally {
      setLoading(false)
    }
  }, [isSignedIn, getToken])

  useEffect(() => { void refresh() }, [refresh])

  return { plan, loading, error, refresh }
}
