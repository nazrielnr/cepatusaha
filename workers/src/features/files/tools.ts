/** Minimal AI tool schemas. Executor keeps old aliases, but provider sees only these. */

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string; properties?: Record<string, unknown>; required?: string[] };
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: { type: 'object'; properties: Record<string, ToolParameter>; required: string[] };
}

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: 'analyze_image',
    description: 'Analyze an uploaded image and return IMAGE_CONTEXT text. Use this before answering any request that depends on an uploaded image. Prefer image_key when provided.',
    parameters: { type: 'object', properties: { image_url: { type: 'string', description: 'Uploaded image URL from UPLOADED_IMAGES' }, image_key: { type: 'string', description: 'R2 object key from UPLOADED_IMAGES; preferred for local/private images' }, prompt: { type: 'string', description: 'Optional specific visual question/extraction request' } }, required: [] },
  },
  {
    name: 'list_files',
    description: 'List project workspace files. Use before writing when unsure what exists.',
    parameters: { type: 'object', properties: { include_content_preview: { type: 'boolean', description: 'Include short content preview' } }, required: [] },
  },
  {
    name: 'read_file',
    description: 'Read a project file. Returns content and numbered lines for exact edits.',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path' }, start_line: { type: 'number', description: 'Optional 1-indexed start line' }, end_line: { type: 'number', description: 'Optional 1-indexed end line' } }, required: ['path'] },
  },
  {
    name: 'search_files',
    description: 'Search project files. Use before edit_file replace to get exact old_text.',
    parameters: { type: 'object', properties: { query: { type: 'string', description: 'Plain text search query' }, pattern: { type: 'string', description: 'Optional glob-ish filter, e.g. *.html' }, case_sensitive: { type: 'boolean', description: 'Case-sensitive search' }, max_results: { type: 'number', description: 'Max results' } }, required: ['query'] },
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a file with complete content. For large files prefer fenced file blocks in text.',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path' }, content: { type: 'string', description: 'Complete file content' }, overwrite: { type: 'boolean', description: 'Allow overwrite; default true' } }, required: ['path', 'content'] },
  },
  {
    name: 'edit_file',
    description: 'Edit an existing file. replace requires exact old_text. insert requires content. replace_all replaces all occurrences.',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path' }, mode: { type: 'string', enum: ['replace', 'insert', 'replace_all'], description: 'Edit mode' }, old_text: { type: 'string', description: 'Exact text to replace' }, new_text: { type: 'string', description: 'Replacement text' }, content: { type: 'string', description: 'Content to insert' }, line: { type: 'number', description: 'Line number for insert' }, position: { type: 'string', enum: ['before', 'after', 'end'], description: 'Insert position' }, pattern: { type: 'string', description: 'Optional file pattern for replace_all' } }, required: ['path', 'mode'] },
  },
  {
    name: 'delete_file',
    description: 'Delete a file. Requires confirm true.',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path' }, confirm: { type: 'boolean', description: 'Must be true' } }, required: ['path', 'confirm'] },
  },
  {
    name: 'ask_user',
    description: 'Ask user for missing required external data/input. Stops the loop.',
    parameters: { type: 'object', properties: { purpose: { type: 'string', description: 'Why input is needed' }, fields: { type: 'array', description: 'Input fields', items: { type: 'object', properties: { name: { type: 'string' }, label: { type: 'string' }, type: { type: 'string' }, required: { type: 'boolean' } }, required: ['name', 'label', 'type'] } } }, required: ['purpose', 'fields'] },
  },
  {
    name: 'search_design',
    description: 'Search brand design.md identities by brand, aesthetic, typography, color, industry, or style. Returns ids only; call get_design for full content.',
    parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query, e.g. "luxury automotive dark red" or "airbnb warm marketplace"' }, limit: { type: 'number', description: 'Max results' } }, required: ['query'] },
  },
  {
    name: 'get_design',
    description: 'Get raw DESIGN.md content by id. Supports char paging (cursor/max_chars) or line ranges (line_start/line_end).',
    parameters: { type: 'object', properties: { id: { type: 'string', description: 'Design id from search_design, e.g. airbnb' }, max_chars: { type: 'number', description: 'Page size, hard-capped' }, cursor: { type: 'number', description: 'Start char offset from previous next_cursor' }, line_start: { type: 'number', description: 'Optional 1-indexed start line' }, line_end: { type: 'number', description: 'Optional 1-indexed end line' } }, required: ['id'] },
  },
  {
    name: 'list_skill',
    description: 'List available skills. With skill_id, list reference files for that skill without loading raw content.',
    parameters: { type: 'object', properties: { skill_id: { type: 'string', description: 'Optional skill id to list refs/files' } }, required: [] },
  },
  {
    name: 'load_skills',
    description: 'Load one or many skills. raw=false returns compact core chunks. raw=true returns raw reference content; use paths/path, line_start/line_end, cursor/max_chars, or all=true.',
    parameters: { type: 'object', properties: { ids: { type: 'array', description: 'Skill ids to load', items: { type: 'string' } }, raw: { type: 'boolean', description: 'false compact core chunks; true raw refs' }, paths: { type: 'array', description: 'Optional reference paths for raw load', items: { type: 'string' } }, path: { type: 'string', description: 'Single reference path for raw load' }, max_chars: { type: 'number', description: 'Char budget/page size, hard-capped unless all=true' }, cursor: { type: 'number', description: 'Raw char offset for paging' }, line_start: { type: 'number', description: 'Raw 1-indexed start line' }, line_end: { type: 'number', description: 'Raw 1-indexed end line' }, all: { type: 'boolean', description: 'Return all raw content for selected refs. Use carefully.' } }, required: ['ids'] },
  },
];

function coerceParameterType(value: unknown, expectedType: string): unknown {
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (actualType === expectedType) return value;
  if (expectedType === 'string' && actualType === 'number') return String(value);
  if (expectedType === 'number' && actualType === 'string') { const n = Number(value); if (!Number.isNaN(n)) return n; }
  if (expectedType === 'boolean' && actualType === 'string') { if (value === 'true') return true; if (value === 'false') return false; }
  return value;
}

const PLANNING_TOOL_NAMES = ['gather_requirements', 'generate_planning_docs', 'execute_plan'];

export function validateToolCall(toolName: string, parameters: Record<string, unknown>): { valid: boolean; errors: string[]; coercedParameters?: Record<string, unknown> } {
  const schema = TOOL_SCHEMAS.find((s) => s.name === toolName);
  if (!schema && PLANNING_TOOL_NAMES.includes(toolName)) return { valid: true, errors: [], coercedParameters: parameters };
  if (!schema) return { valid: false, errors: [`Unknown tool: ${toolName}`] };

  const errors: string[] = [];
  const coercedParameters: Record<string, unknown> = { ...parameters };
  for (const required of schema.parameters.required) {
    if (!(required in parameters) || parameters[required] === undefined || parameters[required] === null || parameters[required] === '') errors.push(`Missing required parameter: ${required}. ${schema.parameters.properties[required]?.description || ''}`);
  }
  for (const [key, value] of Object.entries(parameters)) {
    const paramSchema = schema.parameters.properties[key];
    if (!paramSchema) { errors.push(`Unknown parameter: ${key}`); continue; }
    const coercedValue = coerceParameterType(value, paramSchema.type);
    coercedParameters[key] = coercedValue;
    if (paramSchema.enum && !paramSchema.enum.includes(coercedValue as string)) errors.push(`Invalid value for ${key}: ${coercedValue}. Must be one of: ${paramSchema.enum.join(', ')}`);
    const actualType = Array.isArray(coercedValue) ? 'array' : typeof coercedValue;
    if (paramSchema.type !== actualType && paramSchema.type !== 'object') errors.push(`Invalid type for ${key}: expected ${paramSchema.type}, got ${actualType}`);
  }
  return { valid: errors.length === 0, errors, coercedParameters: errors.length === 0 ? coercedParameters : undefined };
}

export function getToolSchema(toolName: string): ToolSchema | undefined { return TOOL_SCHEMAS.find((s) => s.name === toolName); }
export function getAllToolSchemas(): ToolSchema[] { return TOOL_SCHEMAS; }
