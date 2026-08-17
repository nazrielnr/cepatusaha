import type { Bindings } from '../../bindings'
import type { ToolCall, ExecutionContext, ExecutionResult, ToolParams, ToolValue } from './tool-types'
import { deleteFile, listProjectFilesWithContent, readFile, searchProjectFiles, upsertFile } from './service'
import { ensureDefaultWorkspace } from './default-workspace'
import { listSkill, loadSkills } from '../skills/service'
import { getDesign, searchDesign } from '../designs/service'
import { analyzeImageTool } from '../chat/image-context'

export interface FunctionCallStartEvent { type: 'function_call_start'; id: string; name: string; args: ToolParams; file_path?: string }
export interface FunctionCallCompleteEvent { type: 'function_call_complete'; id: string; success: boolean; data?: ToolValue; error?: string; execution_time_ms?: number }

const TOOL_NAMES = ['analyze_image', 'list_files', 'read_file', 'search_files', 'write_file', 'edit_file', 'delete_file', 'ask_user', 'search_design', 'get_design', 'list_skill', 'load_skills', 'create_file', 'rename_file', 'copy_file', 'replace_code', 'insert_code', 'search_in_files', 'batch_replace', 'validate_code', 'get_file_diff', 'get_element_selector', 'check_workspace', 'request_external_resource']

export class FunctionCallHandler {
  constructor(public env: Bindings) {}

  async executeOne(toolCall: ToolCall, context: ExecutionContext): Promise<ExecutionResult> {
    return this.executeTool(normalizeToolCall(toolCall), context)
  }

  async *executeAllStream(toolCalls: ToolCall[], context: ExecutionContext): AsyncGenerator<FunctionCallStartEvent | FunctionCallCompleteEvent> {
    for (const raw of toolCalls) {
      const startTime = Date.now()
      const toolCall = normalizeToolCall(raw)
      const id = toolCall.id || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`
      yield { type: 'function_call_start', id, name: toolCall.name, args: toolCall.parameters || {}, file_path: pathParam(toolCall.parameters || {}) }
      const result = await this.executeTool(toolCall, context)
      yield { type: 'function_call_complete', id, success: result.success, data: result.data, error: result.error, execution_time_ms: Date.now() - startTime }
    }
  }

  getRegisteredTools(): string[] { return TOOL_NAMES }
  hasExecutor(toolName: string): boolean { return TOOL_NAMES.includes(toolName) }

  private async executeTool(toolCall: ToolCall, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const p = toolCall.parameters || {}
      if (p._invalid_arguments_json === true) return fail(toolCall.name, invalidArgsMessage(toolCall.name, p), 'INVALID_TOOL_ARGUMENTS_JSON')
      if (toolCall.name === 'analyze_image') return ok(toolCall.name, await analyzeImageTool(this.env, { image_url: str(p.image_url), image_key: str(p.image_key), prompt: str(p.prompt) }))
      if (toolCall.name === 'search_design') return ok(toolCall.name, await searchDesign(this.env, str(p.query) ?? '', num(p.limit)))
      if (toolCall.name === 'get_design') return ok(toolCall.name, await getDesign(this.env, str(p.id) ?? '', num(p.max_chars), num(p.cursor) ?? 0, num(p.line_start), num(p.line_end)))
      if (toolCall.name === 'list_skill') return ok(toolCall.name, await listSkill(this.env, str(p.skill_id)))
      if (toolCall.name === 'load_skills') return ok(toolCall.name, await loadSkills(this.env, { ids: arr(p.ids), raw: bool(p.raw), paths: arr(p.paths), path: str(p.path), max_chars: num(p.max_chars), cursor: num(p.cursor), line_start: num(p.line_start), line_end: num(p.line_end), all: bool(p.all) }, context.session_id))
      const projectId = context.project_id
      const filePath = pathParam(p)
      if (!projectId) return fail(toolCall.name, 'project_id is required')
      if (await aborted(context)) return fail(toolCall.name, 'Tool execution aborted', 'ABORTED')

      switch (toolCall.name) {
        case 'write_file':
        case 'create_file': {
          if (!filePath) return fail(toolCall.name, 'file_path is required')
          const content = str(p.content)
          if (content === undefined) return fail(toolCall.name, 'content is required')
          const existing = await readFile(this.env, projectId, filePath)
          if (await aborted(context)) return fail(toolCall.name, 'Tool execution aborted', 'ABORTED')
          if (existing && p.overwrite === false) return fail(toolCall.name, 'File exists and overwrite is false')
          await upsertFile(this.env, projectId, filePath, content)
          return ok(toolCall.name, { file_path: filePath })
        }
        case 'read_file': {
          if (!filePath) return fail(toolCall.name, 'file_path is required')
          const file = await readFile(this.env, projectId, filePath)
          if (!file) return fail(toolCall.name, 'File not found')
          const lines = (file.content ?? '').split('\n')
          const start = Math.max(1, num(p.line_start) ?? 1)
          const end = Math.min(lines.length, num(p.line_end) ?? lines.length)
          const selected = lines.slice(start - 1, end)
          return ok(toolCall.name, {
            file_path: filePath,
            file_type: file.file_type ?? inferType(filePath, file.content ?? ''),
            content: selected.join('\n'),
            content_with_line_numbers: selected.map((line, i) => `${start + i}: ${line}`).join('\n'),
            total_lines: lines.length,
            line_start: start,
            line_end: end,
          })
        }
        case 'delete_file': {
          if (!filePath) return fail(toolCall.name, 'file_path is required')
          if (p.confirm !== true) return fail(toolCall.name, 'confirm must be true')
          await deleteFile(this.env, projectId, filePath)
          return ok(toolCall.name, { file_path: filePath })
        }
        case 'search_files':
        case 'search_in_files':
          return ok(toolCall.name, {
            matches: await searchProjectFiles(this.env, projectId, str(p.query) ?? '', str(p.pattern) ?? str(p.file_pattern), bool(p.case_sensitive), num(p.max_results) ?? 100)
          })
        case 'list_files':
        case 'check_workspace': {
          await ensureDefaultWorkspace(this.env, projectId)
          const files = await listProjectFilesWithContent(this.env, projectId)
          return ok(toolCall.name, { files: files.map((f) => ({ file_path: f.file_path, file_type: f.file_type ?? 'other', size_bytes: (f.content ?? '').length, line_count: (f.content ?? '').split('\n').length, updated_at: f.updated_at ?? '' })) })
        }
        case 'edit_file': {
          const mode = str(p.mode)
          if (mode === 'insert') return this.executeTool({ ...toolCall, name: 'insert_code', parameters: { ...p, code: str(p.content) ?? str(p.new_text) ?? '' } }, context)
          if (mode === 'replace_all') return this.executeTool({ ...toolCall, name: 'batch_replace', parameters: { ...p, search: str(p.old_text) ?? '', replace: str(p.new_text) ?? '', file_pattern: str(p.pattern) ?? filePath ?? '*' } }, context)
          return this.executeTool({ ...toolCall, name: 'replace_code', parameters: { ...p, old_code: str(p.old_text) ?? '', new_code: str(p.new_text) ?? '' } }, context)
        }
        case 'replace_code': {
          if (!filePath) return fail(toolCall.name, 'file_path is required')
          const oldCode = str(p.old_code) ?? str(p.old_text)
          if (!oldCode) return fail(toolCall.name, 'old_text is required')
          const file = await readFile(this.env, projectId, filePath)
          if (await aborted(context)) return fail(toolCall.name, 'Tool execution aborted', 'ABORTED')
          if (!file?.content) return fail(toolCall.name, 'File not found')
          if (!file.content.includes(oldCode)) return fail(toolCall.name, 'Target text not found')
          const newCode = str(p.new_code) ?? str(p.new_text) ?? ''
          const next = file.content.replace(oldCode, newCode)
          await upsertFile(this.env, projectId, filePath, next)
          return ok(toolCall.name, { file_path: filePath, diff: { type: 'replace', old_text: oldCode, new_text: newCode } })
        }
        case 'insert_code': {
          if (!filePath) return fail(toolCall.name, 'file_path is required')
          const code = str(p.code) ?? str(p.content)
          if (code === undefined) return fail(toolCall.name, 'code is required')
          const file = await readFile(this.env, projectId, filePath)
          if (await aborted(context)) return fail(toolCall.name, 'Tool execution aborted', 'ABORTED')
          const lines = (file?.content ?? '').split('\n')
          const before = num(p.before_line) ?? (str(p.position) === 'before' ? num(p.line) : undefined)
          const after = num(p.after_line) ?? (str(p.position) === 'after' ? num(p.line) : undefined)
          if (before && before > 0) lines.splice(before - 1, 0, code)
          else if (after && after >= 0) lines.splice(after, 0, code)
          else lines.push(code)
          await upsertFile(this.env, projectId, filePath, lines.join('\n'))
          return ok(toolCall.name, { file_path: filePath, diff: { type: 'insert', old_text: '', new_text: code } })
        }
        case 'rename_file': {
          const oldPath = str(p.old_path)
          const newPath = str(p.new_path)
          if (!oldPath || !newPath) return fail(toolCall.name, 'old_path and new_path are required')
          const file = await readFile(this.env, projectId, oldPath)
          if (!file) return fail(toolCall.name, 'File not found')
          await upsertFile(this.env, projectId, newPath, file.content ?? '')
          await deleteFile(this.env, projectId, oldPath)
          return ok(toolCall.name, { old_path: oldPath, new_path: newPath })
        }
        case 'copy_file': {
          const source = str(p.source_path)
          const dest = str(p.dest_path)
          if (!source || !dest) return fail(toolCall.name, 'source_path and dest_path are required')
          const file = await readFile(this.env, projectId, source)
          if (!file) return fail(toolCall.name, 'File not found')
          await upsertFile(this.env, projectId, dest, file.content ?? '')
          return ok(toolCall.name, { source_path: source, dest_path: dest })
        }
        case 'batch_replace': {
          const search = str(p.search)
          if (!search) return fail(toolCall.name, 'search is required')
          const replace = str(p.replace) ?? ''
          const files = await listProjectFilesWithContent(this.env, projectId)
          let changed_files = 0
          let replacements = 0
          for (const f of files.filter((f) => matchesPattern(f.file_path, str(p.file_pattern)))) {
            const current = f.content ?? ''
            if (await aborted(context)) return fail(toolCall.name, 'Tool execution aborted', 'ABORTED')
            const next = bool(p.case_sensitive) ? current.split(search).join(replace) : current.replaceAll(new RegExp(escapeRegExp(search), 'gi'), replace)
            if (next === current) continue
            replacements += countOccurrences(current, search, bool(p.case_sensitive))
            changed_files++
            await upsertFile(this.env, projectId, f.file_path, next)
          }
          return ok(toolCall.name, { changed_files, replacements, diff: { type: 'replace_all', old_text: search, new_text: replace } })
        }
        case 'validate_code': {
          if (!filePath) return fail(toolCall.name, 'file_path is required')
          const file = await readFile(this.env, projectId, filePath)
          if (!file) return fail(toolCall.name, 'File not found')
          return ok(toolCall.name, validateCode(filePath, file.content ?? '', str(p.file_type)))
        }
        case 'get_file_diff':
          if (!filePath) return fail(toolCall.name, 'file_path is required')
          // ponytail: file version history not stored; upgrade by adding file_versions diff table.
          return ok(toolCall.name, { file_path: filePath, available: false, added_lines: [], removed_lines: [], message: 'Version history not available' })
        case 'get_element_selector':
          return ok(toolCall.name, await getElementSelector(this.env, projectId, str(p.description) ?? '', str(p.file_path)))
        case 'ask_user':
        case 'request_external_resource':
          return ok(toolCall.name, { requested: true, resource_type: str(p.resource_type) ?? 'text', purpose: str(p.purpose) ?? '', input_fields: Array.isArray(p.fields) ? p.fields : Array.isArray(p.input_fields) ? p.input_fields : [] })
        default:
          return fail(toolCall.name, `Unknown tool: ${toolCall.name}`)
      }
    } catch (error) {
      return fail(toolCall.name, error instanceof Error ? error.message : 'Tool failed')
    }
  }
}

function normalizeToolCall(toolCall: ToolCall): ToolCall {
  const p = { ...(toolCall.parameters || {}) }
  if (toolCall.name === 'create_file' || toolCall.name === 'write_file') {
    p.path ||= p.file_path || inferPath(str(p.file_type), str(p.content) ?? '')
    p.file_path ||= p.path
    p.file_type ||= inferType(str(p.path) ?? str(p.file_path) ?? '', str(p.content) ?? '')
  }
  return { ...toolCall, parameters: p }
}

function inferPath(type?: string, content = ''): string {
  if (type === 'css' || /body\s*\{|\.[\w-]+\s*\{/.test(content)) return 'styles.css'
  if (type === 'javascript' || /document\.|function\s+|=>/.test(content)) return 'script.js'
  return 'index.html'
}

function inferType(path = '', content = ''): string {
  if (path.endsWith('.html')) return 'html'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.js') || path.endsWith('.ts')) return 'javascript'
  if (path.endsWith('.json')) return 'json'
  if (/<html[\s>]/i.test(content)) return 'html'
  return 'text'
}

function validateCode(path: string, content: string, explicit?: string): ToolValue {
  const type = explicit ?? inferType(path, content)
  const errors: ToolValue[] = []
  const warnings: ToolValue[] = []
  if (type === 'html') {
    if (!/<html[\s>]/i.test(content)) warnings.push({ line: 1, message: 'Missing <html> tag' })
    if ((content.match(/<script\b/gi)?.length ?? 0) !== (content.match(/<\/script>/gi)?.length ?? 0)) errors.push({ line: 1, message: 'Unbalanced <script> tags' })
    if ((content.match(/<style\b/gi)?.length ?? 0) !== (content.match(/<\/style>/gi)?.length ?? 0)) errors.push({ line: 1, message: 'Unbalanced <style> tags' })
  }
  if (type === 'css' || type === 'javascript') {
    const opens = (content.match(/\{/g)?.length ?? 0)
    const closes = (content.match(/\}/g)?.length ?? 0)
    if (opens !== closes) errors.push({ line: 1, message: 'Unbalanced braces' })
  }
  return { is_valid: errors.length === 0, errors, warnings }
}

async function getElementSelector(env: Bindings, projectId: string, description: string, filePath?: string): Promise<ToolValue> {
  const files = filePath ? [await readFile(env, projectId, filePath)] : await listProjectFilesWithContent(env, projectId)
  const selectors: ToolValue[] = []
  for (const f of files.filter(Boolean)) {
    const content = f?.content ?? ''
    for (const id of content.matchAll(/id=["']([^"']+)["']/g)) selectors.push({ selector: `#${id[1]}`, file_path: f!.file_path, confidence: description.includes(id[1]) ? 0.9 : 0.5 })
    for (const cls of content.matchAll(/class=["']([^"']+)["']/g)) {
      const first = cls[1].split(/\s+/)[0]
      if (first) selectors.push({ selector: `.${first}`, file_path: f!.file_path, confidence: description.includes(first) ? 0.8 : 0.4 })
    }
  }
  return { selectors: selectors.slice(0, 20) }
}

function str(value: unknown): string | undefined { return typeof value === 'string' ? value : undefined }
function arr(value: unknown): string[] { return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [] }
function num(value: unknown): number | undefined { return typeof value === 'number' ? value : undefined }
function bool(value: unknown): boolean { return value === true }
function pathParam(p: ToolParams): string | undefined { return [p.path, p.file_path, p.filePath, p.filepath, p.file, p.file_searched, p.source_path, p.dest_path, p.old_path, p.new_path, p.target_path, p.input_path, p.output_path, p.file_pattern].find((v): v is string => typeof v === 'string' && Boolean(v.trim())) }
function ok(tool_name: string, data: ToolValue): ExecutionResult { return { success: true, tool_name, data } }
function fail(tool_name: string, error: string, error_code?: string): ExecutionResult { return { success: false, tool_name, error, ...(error_code && { error_code }) } }
function invalidArgsMessage(toolName: string, p: ToolParams): string {
  const parseError = str(p._parse_error) || 'parse failed'
  if (toolName !== 'write_file' && toolName !== 'create_file') return `Invalid tool arguments JSON: ${parseError}`
  const path = str(p._suspected_path)
  return `Invalid ${toolName} arguments JSON: ${parseError}. The file content was likely truncated. Do not retry ${toolName} and do not overwrite the file. ${path ? `Call read_file(path: "${path}") first, inspect the saved partial content, then continue from the last intact line with edit_file mode="insert" or mode="replace".` : 'Call list_files/read_file first to inspect the saved partial content, then continue from the last intact line with edit_file mode="insert" or mode="replace".'}`
}
async function aborted(context: ExecutionContext): Promise<boolean> { return Boolean(context.signal?.aborted || await context.isAborted?.()) }
function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function countOccurrences(value: string, search: string, caseSensitive: boolean): number { return (caseSensitive ? value : value.toLowerCase()).split(caseSensitive ? search : search.toLowerCase()).length - 1 }
function matchesPattern(path: string, pattern?: string): boolean {
  if (!pattern || pattern === '*') return true
  if (pattern.startsWith('*.')) return path.endsWith(pattern.slice(1))
  if (pattern.endsWith('/*')) return path.startsWith(pattern.slice(0, -1))
  return path.includes(pattern.replaceAll('*', ''))
}
