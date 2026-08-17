import { CheckCircle, Circle, ClipboardList, Code, Copy, FileEdit, FilePlus, FileText, FolderSearch, GitBranch, HelpCircle, Lightbulb, RefreshCw, Search, Sparkles, Trash2 } from 'lucide-react'
import type { ActionType } from './types'

export const getIcon = (type: ActionType) => {
  switch (type) {
    case 'write_file' as ActionType:
    case 'create_file': return FilePlus
    case 'delete_file': return Trash2
    case 'read_file': return FileText
    case 'rename_file': return FileEdit
    case 'copy_file': return Copy
    case 'search_files' as ActionType:
    case 'search_in_files': return Search
    case 'edit_file':
    case 'replace_code': return FileEdit
    case 'insert_code': return FilePlus
    case 'batch_replace': return RefreshCw
    case 'validate_code': return CheckCircle
    case 'get_file_diff': return GitBranch
    case 'get_element_selector': return Code
    case 'list_files':
    case 'check_workspace': return FolderSearch
    case 'ask_user' as ActionType:
    case 'request_external_resource': return HelpCircle
    case 'gather_requirements' as ActionType: return ClipboardList
    case 'generate_planning_docs' as ActionType: return Lightbulb
    case 'execute_plan' as ActionType: return Sparkles
    default: return Circle
  }
}
