/**
 * Files API Client
 * Handles file operations and retrieval
 */

import { apiPathUrl, jsonHeaders } from '@/lib/apiClient'

export interface ProjectFile {
  id: string
  file_path: string
  file_type: string
  content: string
  updated_at: string
}

/**
 * Get all files for a project
 */
export async function getProjectFiles(projectId: string, token: string): Promise<ProjectFile[]> {
  const response = await fetch(apiPathUrl(`/projects/${projectId}/files`), {
    method: 'GET',
    headers: jsonHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch project files: ${response.statusText}`)
  }

  const data = await response.json()
  return data.files || []
}
