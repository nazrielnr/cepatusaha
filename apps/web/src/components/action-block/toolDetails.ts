import type { ExtendedActionStatus, ToolCall } from './types'

const isDone = (status?: string) => status === 'completed' || status === 'success' || status === 'complete'
const FILE_PATH_KEYS = ['path', 'file_path', 'filePath', 'filepath', 'file', 'file_searched', 'source_path', 'dest_path', 'old_path', 'new_path', 'target_path', 'input_path', 'output_path', 'file_pattern']

export const extractToolFilePath = (toolCall?: ToolCall): string => {
  const seen = new Set<string>()
  const add = (value: unknown) => {
    const values = Array.isArray(value) ? value : [value]
    for (const v of values) if (typeof v === 'string' && v.trim() && looksPath(v)) seen.add(v.trim())
  }
  const scan = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FILE_PATH_KEYS.includes(key)) add(child)
      if (Array.isArray(child)) child.forEach(scan)
      else if (child && typeof child === 'object') scan(child)
    }
  }
  scan(toolCall?.arguments)
  scan(toolCall)
  scan(toolCall?.result)
  return [...seen].join(' → ')
}

function looksPath(value: string) { return /[/.\\]/.test(value) || /\.[a-z0-9]+$/i.test(value) }

export const extractToolDetails = (toolCall?: ToolCall, status?: ExtendedActionStatus): string => {
  if (!toolCall) return ''
  const { name, arguments: args = {} } = toolCall
  if (status === 'error') return 'Failed'
  const done = isDone(status)

  switch (name) {
    case 'list_files':
      return done ? 'Workspace Analyzed' : 'Analyzing Workspace'

    case 'read_file':
      return done ? 'Read' : 'Reading'

    case 'search_files':
      return args.query ? `Searching For "${args.query}"` : 'Searching Workspace'

    case 'write_file':
      return done ? 'Created' : 'Creating'

    case 'edit_file':
      return done ? 'Updated' : 'Updating'

    case 'delete_file':
      return done ? 'Deleted' : 'Deleting'

    case 'ask_user':
      return done ? 'Input Requested' : 'Awaiting User Confirmation'

    case 'search_design':
      return done ? 'Brand Identities Discovered' : 'Seeking Brand Identities'

    case 'get_design':
      return done ? 'Styling Specifications Ready' : 'Importing Styling Specifications'

    case 'list_skill':
      return done ? 'Capabilities Mapped' : 'Querying Capability Database'

    case 'load_skills':
      return done ? 'Capabilities Activated' : 'Equipping Helper Capabilities'

    case 'gather_requirements':
      return done ? 'Form Ready' : 'Structuring Initial Specifications'

    case 'generate_planning_docs':
      return done ? 'Docs Ready' : 'Drafting Technical Planning Blueprint'

    case 'execute_plan':
      return done ? 'Plan Executed' : 'Orchestrating Build Sequence'

    case 'analyze_image':
      return done ? 'Image Analyzed' : 'Analyzing Image'

    default: {
      const titleCase = name.replace(/_/g, ' ')
      return titleCase.replace(/\b\w/g, c => c.toUpperCase())
    }
  }
}
