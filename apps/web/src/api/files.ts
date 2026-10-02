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

export async function updateProjectFile(projectId: string, filePath: string, content: string, token: string): Promise<void> {
  const response = await fetch(apiPathUrl('/files/update'), {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({
      project_id: projectId,
      file_path: filePath,
      content,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update project file: ${response.statusText}`)
  }
}

export async function deleteProjectFile(projectId: string, filePath: string, token: string): Promise<void> {
  const response = await fetch(apiPathUrl('/files/delete'), {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({
      project_id: projectId,
      file_path: filePath,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to delete project file: ${response.statusText}`)
  }
}

