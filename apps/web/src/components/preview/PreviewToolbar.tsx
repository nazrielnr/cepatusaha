import type { PreviewToolbarProps } from './PreviewToolbar.types'
import { PlanningPreviewToolbar } from './PlanningPreviewToolbar'
import { StandardPreviewToolbar } from './StandardPreviewToolbar'

export function PreviewToolbar(props: PreviewToolbarProps) {
  return (
    <div className="hidden md:flex flex-col bg-background dark:bg-background border-b border-border dark:border-border flex-shrink-0 z-10">
      {props.isPlanningMode ? <PlanningPreviewToolbar {...props} /> : <StandardPreviewToolbar {...props} />}
    </div>
  )
}
