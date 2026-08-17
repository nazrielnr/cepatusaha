/**
 * AI Models API Client
 */

import { apiUrl, jsonHeaders } from '@/lib/apiClient'

export interface AIModel {
  id: string
  provider: 'openai_compatible'
  displayName: string
}

export interface ModelsResponse {
  success: boolean
  models: AIModel[]
  error?: string
}

/**
 * Fetch available AI models from the API
 * This endpoint does not require authentication
 */
export async function fetchModels(): Promise<AIModel[]> {
  try {
    const response = await fetch(apiUrl('/models'), {
      method: 'GET',
      headers: jsonHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data: ModelsResponse = await response.json()

    if (!data.success || !data.models) {
      throw new Error(data.error || 'Failed to fetch models')
    }

    return data.models
  } catch (error) {
    console.error('[fetchModels] Error:', error)
    // Return empty array on error - UI will handle gracefully
    return []
  }
}
