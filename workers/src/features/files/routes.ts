/** Handlers for file operations. */
import type { HonoContext } from '../../shared/types'
import { assertProjectOwner, deleteFile, getDbUserId, listProjectFiles, readFile, searchProjectFiles, upsertFile } from './service'

function jsonError(c: HonoContext, code: string, message: string, status: 400 | 401 | 403 | 404 | 500) {
  return c.json({ status: 'error', error: { code, message } }, status)
}

async function requireProject(c: HonoContext, projectId: string, clerkUserId: string) {
  const dbUserId = await getDbUserId(c.env, clerkUserId)
  await assertProjectOwner(c.env, projectId, dbUserId)
}

/** POST /api/files/update */
export async function updateFileHandler(c: HonoContext) {
  try {
    const auth = c.get('auth')
    if (!auth?.userId) return jsonError(c, 'UNAUTHORIZED', 'Authentication required', 401)

    const { project_id, file_path, content } = await c.req.json()
    if (!project_id || !file_path || content === undefined) {
      return jsonError(c, 'INVALID_REQUEST', 'Missing required fields: project_id, file_path, content', 400)
    }

    await requireProject(c, project_id, auth.userId)
    await upsertFile(c.env, project_id, file_path, String(content))
    return c.json({ status: 'success', message: 'File updated successfully', data: { project_id, file_path } })
  } catch (error) {
    if ((error as Error).message === 'PROJECT_NOT_FOUND') return jsonError(c, 'PROJECT_NOT_FOUND', 'Project not found', 404)
    errorLog(undefined, '[updateFileHandler] Unexpected error:', error)
    return jsonError(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}

/** POST /api/files/delete */
export async function deleteFileHandler(c: HonoContext) {
  try {
    const auth = c.get('auth')
    if (!auth?.userId) return jsonError(c, 'UNAUTHORIZED', 'Authentication required', 401)

    const { project_id, file_path } = await c.req.json()
    if (!project_id || !file_path) return jsonError(c, 'INVALID_REQUEST', 'Missing required fields: project_id, file_path', 400)

    await requireProject(c, project_id, auth.userId)
    await deleteFile(c.env, project_id, file_path)
    return c.json({ status: 'success', message: 'File deleted successfully', data: { project_id, file_path } })
  } catch (error) {
    if ((error as Error).message === 'PROJECT_NOT_FOUND') return jsonError(c, 'PROJECT_NOT_FOUND', 'Project not found', 404)
    errorLog(undefined, '[deleteFileHandler] Unexpected error:', error)
    return jsonError(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}

/** POST /api/files/read */
export async function readFileHandler(c: HonoContext) {
  try {
    const auth = c.get('auth')
    if (!auth?.userId) return jsonError(c, 'UNAUTHORIZED', 'Authentication required', 401)

    const { project_id, file_path } = await c.req.json()
    if (!project_id || !file_path) return jsonError(c, 'INVALID_REQUEST', 'Missing required fields: project_id, file_path', 400)

    await requireProject(c, project_id, auth.userId)
    const file = await readFile(c.env, project_id, file_path)
    if (!file) return jsonError(c, 'FILE_NOT_FOUND', 'File not found', 404)
    return c.json({ status: 'success', data: file })
  } catch (error) {
    if ((error as Error).message === 'PROJECT_NOT_FOUND') return jsonError(c, 'PROJECT_NOT_FOUND', 'Project not found', 404)
    errorLog(undefined, '[readFileHandler] Unexpected error:', error)
    return jsonError(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}

/** POST /api/files/list */
export async function listFilesHandler(c: HonoContext) {
  try {
    const auth = c.get('auth')
    if (!auth?.userId) return jsonError(c, 'UNAUTHORIZED', 'Authentication required', 401)

    const { project_id } = await c.req.json()
    if (!project_id) return jsonError(c, 'INVALID_REQUEST', 'Missing required field: project_id', 400)

    await requireProject(c, project_id, auth.userId)
    const files = await listProjectFiles(c.env, project_id)
    return c.json({ status: 'success', data: { project_id, files } })
  } catch (error) {
    if ((error as Error).message === 'PROJECT_NOT_FOUND') return jsonError(c, 'PROJECT_NOT_FOUND', 'Project not found', 404)
    errorLog(undefined, '[listFilesHandler] Unexpected error:', error)
    return jsonError(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}

/** POST /api/files/search */
export async function searchFilesHandler(c: HonoContext) {
  try {
    const auth = c.get('auth')
    if (!auth?.userId) return jsonError(c, 'UNAUTHORIZED', 'Authentication required', 401)

    const { project_id, query, file_pattern } = await c.req.json()
    if (!project_id || !query) return jsonError(c, 'INVALID_REQUEST', 'Missing required fields: project_id, query', 400)

    await requireProject(c, project_id, auth.userId)
    const results = await searchProjectFiles(c.env, project_id, String(query), file_pattern)
    return c.json({ status: 'success', data: { project_id, query, results } })
  } catch (error) {
    if ((error as Error).message === 'PROJECT_NOT_FOUND') return jsonError(c, 'PROJECT_NOT_FOUND', 'Project not found', 404)
    errorLog(undefined, '[searchFilesHandler] Unexpected error:', error)
    return jsonError(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}
import { warnLog, errorLog } from '../../shared/logger';
