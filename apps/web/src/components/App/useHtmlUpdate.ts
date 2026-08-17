import { useCallback } from 'react'
import { apiPathUrl, jsonHeaders } from '@/lib/apiClient'

type UseHtmlUpdateOptions = {
  appState: any
  previewState: any
  getToken: () => Promise<string | null>
}

export function useHtmlUpdate({ appState, previewState, getToken }: UseHtmlUpdateOptions) {
  return useCallback(async (html: string) => {
    if (!html || html.trim().length === 0) {
      console.error('[handleHtmlUpdate] Empty HTML, skipping update')
      return
    }

    if (!/<html/i.test(html) && !/<body/i.test(html)) {
      console.error('[handleHtmlUpdate] Invalid HTML structure, skipping update')
      return
    }

        previewState.updateHtml(html)

    const sessionId = appState.activeSessionId
    const projectId = appState.currentSession?.project_id

    if (!sessionId || !projectId) {
      console.warn('[handleHtmlUpdate] No active session or project, skipping file save')
      return
    }

    try {
      const token = await getToken()
      if (!token) {
        console.error('[handleHtmlUpdate] No auth token available')
        return
      }

      const response = await fetch(apiPathUrl('/files/update'), {
        method: 'POST',
        headers: jsonHeaders(token),
        body: JSON.stringify({ project_id: projectId, file_path: 'index.html', content: html }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[handleHtmlUpdate] API Error Response:', { status: response.status, statusText: response.statusText, errorData })
        throw new Error(`Failed to save HTML: ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

            previewState.refresh?.()
    } catch (error) {
      console.error('[handleHtmlUpdate] Error saving HTML:', error)
    }
  }, [previewState, appState.activeSessionId, appState.currentSession?.project_id, getToken])
}
