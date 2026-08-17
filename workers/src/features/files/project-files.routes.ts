import type { HonoContext } from '../../shared/types'
import { listProjectFilesWithContent } from './service'
import { ensureDefaultWorkspace } from './default-workspace'
import { warnLog, errorLog } from '../../shared/logger';

export async function getProjectFilesHandler(c: HonoContext) {
  try {
    const projectId = c.req.param('projectId')
    if (!projectId) return c.json({ status: 'error', error: 'Project ID is required' }, 400)
    await ensureDefaultWorkspace(c.env, projectId)
    const files = await listProjectFilesWithContent(c.env, projectId)
    return c.json({ status: 'success', files, count: files.length })
  } catch (error) {
    errorLog(undefined, '[ProjectFiles] Error:', error)
    return c.json({ status: 'error', error: error instanceof Error ? error.message : 'Failed to fetch project files' }, 500)
  }
}
