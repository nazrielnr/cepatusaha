import type { ActionBlockProps } from './types'

export function areActionBlockPropsEqual(prevProps: ActionBlockProps, nextProps: ActionBlockProps): boolean {
  const prevResult = prevProps.toolCall?.result
  const nextResult = nextProps.toolCall?.result
  const prevHasResult = prevResult !== undefined && prevResult !== null
  const nextHasResult = nextResult !== undefined && nextResult !== null

  if (prevHasResult !== nextHasResult) return false
  if (prevHasResult && JSON.stringify(prevResult) !== JSON.stringify(nextResult)) return false

  return (
    prevProps.status === nextProps.status &&
    prevProps.code === nextProps.code &&
    prevProps.label === nextProps.label &&
    prevProps.type === nextProps.type &&
    prevProps.toolCall?.id === nextProps.toolCall?.id &&
    prevProps.toolCall?.name === nextProps.toolCall?.name &&
    prevProps.toolCall?.status === nextProps.toolCall?.status &&
    prevProps.toolCall?.arguments?.file_path === nextProps.toolCall?.arguments?.file_path &&
    prevProps.toolCall?.arguments?.path === nextProps.toolCall?.arguments?.path &&
    prevProps.toolCall?.arguments?.source_path === nextProps.toolCall?.arguments?.source_path &&
    prevProps.toolCall?.arguments?.dest_path === nextProps.toolCall?.arguments?.dest_path &&
    prevProps.toolCall?.arguments?.old_path === nextProps.toolCall?.arguments?.old_path &&
    prevProps.toolCall?.arguments?.new_path === nextProps.toolCall?.arguments?.new_path &&
    prevProps.toolCall?.arguments?.query === nextProps.toolCall?.arguments?.query &&
    prevProps.toolCall?.arguments?.package_name === nextProps.toolCall?.arguments?.package_name &&
    prevProps.toolCall?.arguments?.content === nextProps.toolCall?.arguments?.content &&
    prevProps.toolCall?.progress === nextProps.toolCall?.progress &&
    prevProps.toolCall?.streamingContent === nextProps.toolCall?.streamingContent &&
    prevProps.toolCall?.error === nextProps.toolCall?.error
  )
}
