import type { ChatMessage } from '@/types/chat'

export type MessageBubbleProps = {
  message: ChatMessage
  isExiting?: boolean
  isStreaming?: boolean
  onFormSubmit?: (formData: Record<string, any>) => void
}

export function areMessagesEqual(prevProps: MessageBubbleProps, nextProps: MessageBubbleProps): boolean {
  if (prevProps.isExiting !== nextProps.isExiting) return false

  const prev = prevProps.message
  const next = nextProps.message
  if (prev.id !== next.id) return false
  if (prev.content !== next.content) return false
  if (prev.thinking !== next.thinking) return false

  const prevMeta = prev.metadata || {}
  const nextMeta = next.metadata || {}
  if (prevMeta.reasoning_content !== nextMeta.reasoning_content) return false
  if (prevMeta.thinking_content !== nextMeta.thinking_content) return false
  if (prevMeta.is_thinking !== nextMeta.is_thinking) return false
  if (prevMeta.reasoning_done !== nextMeta.reasoning_done) return false
  if (prevMeta.thinking_done !== nextMeta.thinking_done) return false
  if (prevMeta.phase !== nextMeta.phase) return false

  const prevToolCalls = prev.tool_calls || []
  const nextToolCalls = next.tool_calls || []
  if (prevToolCalls.length !== nextToolCalls.length) return false

  for (let i = 0; i < prevToolCalls.length; i++) {
    const prevTc = prevToolCalls[i] as any
    const nextTc = nextToolCalls[i] as any
    if (prevTc.id !== nextTc.id) return false
    if (prevTc.status !== nextTc.status) return false
    if (prevTc.file_path !== nextTc.file_path) return false
    if (prevTc.arguments?.file_path !== nextTc.arguments?.file_path) return false
    if (prevTc.arguments?.path !== nextTc.arguments?.path) return false
    if (prevTc.arguments?.source_path !== nextTc.arguments?.source_path) return false
    if (prevTc.arguments?.dest_path !== nextTc.arguments?.dest_path) return false
    if (prevTc.arguments?.old_path !== nextTc.arguments?.old_path) return false
    if (prevTc.arguments?.new_path !== nextTc.arguments?.new_path) return false
    if (prevTc.arguments?.query !== nextTc.arguments?.query) return false
    if (prevTc.arguments?.package_name !== nextTc.arguments?.package_name) return false
    if (prevTc.arguments?.content !== nextTc.arguments?.content) return false
    if (prevTc.progress !== nextTc.progress) return false
    if (prevTc.error !== nextTc.error) return false
    const prevHasResult = prevTc.result !== undefined && prevTc.result !== null
    const nextHasResult = nextTc.result !== undefined && nextTc.result !== null
    if (prevHasResult !== nextHasResult) return false
    if (prevHasResult && JSON.stringify(prevTc.result) !== JSON.stringify(nextTc.result)) return false
  }

  return ((prevMeta.execution_results as any[]) || []).length === ((nextMeta.execution_results as any[]) || []).length
}

export function mapToolCallsToActions(message: ChatMessage): any[] {
  return message.tool_calls?.map((tc: any) => {
    const args = tc.arguments || {}
    let status = tc.status || 'pending'
    if (status === 'loading') status = 'running'
    else if (status === 'success') status = 'completed'

    return {
      id: tc.id || `tool_${Date.now()}`,
      type: tc.name || 'unknown',
      status,
      error: tc.error,
      toolCall: {
        id: tc.id || `tool_${Date.now()}`,
        name: tc.name,
        arguments: {
          ...args,
          file_path: args.file_path || tc.file_path || args.path,
          content: args.content || tc.content,
          query: args.query || tc.search_query,
          package_name: args.package || args.package_name || tc.package_name,
        },
        result: tc.result,
        error: tc.error,
        status,
        progress: tc.progress,
        streamingContent: tc.streamingContent,
      },
    }
  }) || []
}

export function hasMarkdown(content: string): boolean {
  return Boolean(content && (
    content.includes('```') ||
    content.includes('**') ||
    content.includes('##') ||
    content.includes('- ') ||
    content.includes('* ') ||
    (content.includes('[') && content.includes('](')) ||
    (content.includes('|') && content.includes('---'))
  ))
}

export function buildContentBlocks(message: ChatMessage, displayHasThinking: boolean, displayHasContent: boolean, displayHasActions: boolean): Array<{ type: 'thinking' | 'text' | 'actions'; key: string }> {
  if (message.sender === 'user') return []
  return [
    ...(displayHasThinking ? [{ type: 'thinking' as const, key: 'thinking' }] : []),
    ...(displayHasActions ? [{ type: 'actions' as const, key: 'actions' }] : []),
    ...(displayHasContent ? [{ type: 'text' as const, key: 'text' }] : []),
  ]
}
