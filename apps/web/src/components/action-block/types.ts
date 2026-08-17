import type { ActionStatus, StaticToolCall } from '@cepatusaha/shared-types'

export type ActionType =
  | 'list_files' | 'read_file' | 'search_files' | 'write_file' | 'edit_file' | 'delete_file' | 'ask_user'
  | 'search_design' | 'get_design' | 'list_skill' | 'load_skills'
  | 'create_file' | 'search_in_files' | 'replace_code' | 'request_external_resource' | 'check_workspace' | 'insert_code'
  | 'validate_code' | 'batch_replace' | 'rename_file' | 'copy_file' | 'get_file_diff' | 'get_element_selector'
  | 'gather_requirements' | 'generate_planning_docs' | 'execute_plan'
export type { ActionStatus } from '@cepatusaha/shared-types'

// Form field definition for external resource requests
export interface FormField {
  field_name: string;
  field_type: 'text' | 'file' | 'url' | 'select' | 'textarea' | 'color' | 'number' | 'email' | 'tel';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  accept?: string;
}

export interface FormSchema {
  resource_type: string;
  purpose: string;
  fields: FormField[];
}

// Workspace structure for check_workspace results
export interface WorkspaceFile {
  path: string;
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
  preview?: string;
  total_lines?: number;
}

export interface WorkspaceResult {
  files: WorkspaceFile[];
  folders: string[];
  total_files: number;
  total_folders: number;
  workspace_path: string;
  message?: string;
}

// Search results structure for search_in_files
export interface SearchMatch {
  file_path: string;
  file_type: string;
  line_number: number;
  line_content: string;
  context_before: string;
  context_after: string;
}

export interface SearchResult {
  query: string;
  file_pattern: string | null;
  matches: SearchMatch[];
  total_matches: number;
  truncated: boolean;
}

// Read file result structure for read_file
export interface ReadFileResult {
  file_path: string;
  file_type: string;
  content: string;
  content_with_line_numbers: string;
  total_lines: number;
  line_start?: number;
  line_end?: number;
  showing_lines: string;
}

// Replace code result structure
export interface ReplaceCodeResult {
  file_path: string;
  lines_changed: number;
  old_code_preview?: string;
  new_code_preview?: string;
  diff?: {
    diff: Array<{
      type: 'added' | 'deleted' | 'modified' | 'unchanged';
      line_number: number;
      new_content?: string;
      old_content?: string;
    }>;
    success: boolean;
    statistics: {
      lines_added: number;
      lines_deleted: number;
      total_changes: number;
      lines_modified: number;
    };
  };
}

// Insert code result structure
export interface InsertCodeResult {
  file_path: string;
  inserted_at: string;
  lines_inserted: number;
  new_total_lines: number;
  code_preview: string;
}

// Validate code result structure
export interface ValidateCodeResult {
  file_path: string;
  file_type: string;
  is_valid: boolean;
  errors: Array<{ line: number; message: string; severity: 'error' | 'warning' }>;
  warnings: Array<{ line: number; message: string; severity: 'error' | 'warning' }>;
  total_errors: number;
  total_warnings: number;
}

// Batch replace result structure
export interface BatchReplaceResult {
  search: string;
  replace: string;
  file_pattern: string;
  files_modified: number;
  total_replacements: number;
  details: Array<{ file_path: string; replacements: number }>;
  truncated?: boolean;
}

// Rename file result structure
export interface RenameFileResult {
  old_path: string;
  new_path: string;
  file_type: string;
}

// Copy file result structure
export interface CopyFileResult {
  source_path: string;
  dest_path: string;
  file_type: string;
  line_count: number;
}

// Get file diff result structure
export interface GetFileDiffResult {
  file_path: string;
  has_history: boolean;
  message?: string;
  comparing?: string;
  added_lines?: Array<{ line: number; content: string }>;
  removed_lines?: Array<{ line: number; content: string }>;
  stats?: {
    lines_added: number;
    lines_removed: number;
    current_total_lines: number;
    previous_total_lines: number;
  };
  truncated?: boolean;
}

// Get element selector result structure
export interface GetElementSelectorResult {
  description: string;
  file_searched: string;
  matches: Array<{
    selector: string;
    confidence: 'high' | 'medium' | 'low';
    context: string;
    file_path: string;
    line_number: number;
  }>;
  total_found: number;
  truncated?: boolean;
}

// Extended action status for UI states
export type ExtendedActionStatus = ActionStatus | 'loading' | 'complete' | 'failed'

export interface ToolCall extends Omit<StaticToolCall, 'arguments'> {
  arguments: {
    // For create_file
    file_path?: string
    file_type?: string
    content?: string

    // For search_in_files
    query?: string
    file_pattern?: string

    // For delete_file / read_file
    path?: string

    // For edit_file
    old_content?: string
    new_content?: string

    // For list_files
    directory?: string

    // Other tool-specific arguments
    [key: string]: any
  }
  // Real-time streaming progress
  progress?: string
  progressDetails?: any
  // Real-time streaming content (code/output)
  streamingContent?: string
  isComplete?: boolean
}

export interface ActionBlockProps {
  type?: ActionType
  label?: string
  status: ExtendedActionStatus
  code?: string
  toolCall?: ToolCall
  isExiting?: boolean // Flag to trigger exit animation
  onFormSubmit?: (formData: Record<string, any>) => void // Callback for external resource form submission
}

