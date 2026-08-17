import type { Bindings } from '../../bindings'
import { createSql } from '../../db'
import { getSessionDbUserId } from '../sessions/service'

export type ProjectFile = {
  id?: string
  project_id?: string
  file_path: string
  content?: string
  file_type?: string
  created_at?: string
  updated_at?: string
}

function fileType(path: string): string {
  if (path.endsWith('.html')) return 'html'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript'
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript'
  if (path.endsWith('.json')) return 'json'
  return 'other'
}

export async function getDbUserId(env: Bindings, clerkUserId: string): Promise<string> {
  return getSessionDbUserId(env, clerkUserId)
}

export async function assertProjectOwner(env: Bindings, projectId: string, dbUserId: string): Promise<void> {
  const sql = createSql(env)
  const rows = await sql`select id from projects where id = ${projectId} and user_id = ${dbUserId} limit 1`
  if (!rows.length) throw new Error('PROJECT_NOT_FOUND')
}

export async function upsertFile(env: Bindings, projectId: string, filePath: string, content: string): Promise<void> {
  const sql = createSql(env)
  const now = new Date().toISOString()
  const updated = await sql`
    update files
    set content = ${content}, updated_at = ${now}
    where project_id = ${projectId} and file_path = ${filePath}
    returning id
  `
  if (updated.length) return
  await sql`
    insert into files (project_id, file_path, content, file_type, created_at, updated_at)
    values (${projectId}, ${filePath}, ${content}, ${fileType(filePath)}, ${now}, ${now})
  `
}

export async function deleteFile(env: Bindings, projectId: string, filePath: string): Promise<void> {
  await createSql(env)`delete from files where project_id = ${projectId} and file_path = ${filePath}`
}

export async function readFile(env: Bindings, projectId: string, filePath: string): Promise<ProjectFile | null> {
  const rows = await createSql(env)`
    select file_path, content, file_type, created_at, updated_at
    from files
    where project_id = ${projectId} and file_path = ${filePath}
    limit 1
  ` as ProjectFile[]
  return rows[0] ?? null
}

export async function listProjectFiles(env: Bindings, projectId: string): Promise<ProjectFile[]> {
  return await createSql(env)`
    select file_path, file_type, created_at, updated_at
    from files
    where project_id = ${projectId}
    order by file_path asc
  ` as ProjectFile[]
}

export async function listProjectFilesWithContent(env: Bindings, projectId: string): Promise<ProjectFile[]> {
  return await createSql(env)`
    select id, file_path, file_type, content, updated_at
    from files
    where project_id = ${projectId}
    order by file_path asc
  ` as ProjectFile[]
}

export type SearchMatch = {
  file_path: string
  line_number: number
  line_content: string
  context_before: string
  context_after: string
}

export async function searchProjectFiles(env: Bindings, projectId: string, query: string, filePattern?: string, caseSensitive = false, maxResults = 100): Promise<SearchMatch[]> {
  const files = await createSql(env)`select file_path, content from files where project_id = ${projectId}` as Array<{ file_path: string; content: string }>
  const needle = caseSensitive ? query : query.toLowerCase()
  const matches: SearchMatch[] = []
  for (const file of files.filter((f) => matchesPattern(f.file_path, filePattern))) {
    const lines = file.content.split('\n')
    for (let index = 0; index < lines.length; index++) {
      const hay = caseSensitive ? lines[index] : lines[index].toLowerCase()
      if (!hay.includes(needle)) continue
      matches.push({
        file_path: file.file_path,
        line_number: index + 1,
        line_content: lines[index],
        context_before: lines[index - 1] ?? '',
        context_after: lines[index + 1] ?? '',
      })
      if (matches.length >= maxResults) return matches
    }
  }
  return matches
}

function matchesPattern(path: string, pattern?: string): boolean {
  if (!pattern || pattern === '*') return true
  if (pattern.startsWith('*.')) return path.endsWith(pattern.slice(1))
  if (pattern.endsWith('/*')) return path.startsWith(pattern.slice(0, -1))
  return path.includes(pattern.replaceAll('*', ''))
}
