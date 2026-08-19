import { handleAPIResponse } from '../utils/error-handler'
import { fetchWithTokenRetry } from './auth'
import { apiPathUrl } from '@/lib/apiClient'

export type PlanName = 'free' | 'pro'

export interface PlanState {
  plan: PlanName
  periodKey: string
  monthUsedTokens: number
  monthLimitTokens: number
  monthRemainingTokens: number
  maxIterations: number
  reqPerMinute: number
  exhausted: boolean
}

interface PlanResponse {
  status: 'success'
  plan: PlanState
}

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = {}
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

export async function getPlan(token?: string): Promise<PlanState> {
  const response = await fetchWithTokenRetry(apiPathUrl('/plan'), { method: 'GET', headers: headers(token) })
  const data = await handleAPIResponse<PlanResponse>(response)
  return data.plan
}
