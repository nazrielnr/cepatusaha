import { memo, useEffect, useState } from 'react'
import { ThinkingBlock } from './ThinkingBlock'
import { MarkdownContent } from './MarkdownContent'
import { ActionBlock } from '../ActionBlock'
import { LimitReached } from './LimitReached'
import { areMessagesEqual, hasMarkdown as detectMarkdown, mapToolCallsToActions, type MessageBubbleProps } from './messageBubbleUtils'

export const MessageBubble = memo(function MessageBubble({ message, isExiting = false, isStreaming = false, onFormSubmit }: MessageBubbleProps) {
  const isUser = message.sender === 'user'
  const [animationDone, setAnimationDone] = useState(false)
  useEffect(() => {
    if (!isExiting && !animationDone) {
      const timer = setTimeout(() => setAnimationDone(true), 250)
      return () => clearTimeout(timer)
    }
  }, [isExiting, animationDone])

  const actions = message.actions || mapToolCallsToActions(message)
  const thinking = (message.metadata?.reasoning_content as string) || (message.metadata?.thinking_content as string) || message.thinking || ''
  const hasText = Boolean(message.content?.trim())
  const hasActions = Boolean(actions?.length)

  // ALWAYS render thinking block if we are streaming AND there is no other content yet!
  const hasThinking = Boolean(thinking) || (isStreaming && !hasText && !hasActions)

  const hasMarkdown = !isUser && detectMarkdown(message.content)
  const animationClass = isExiting ? 'animate-exit' : (!animationDone ? 'animate-enter' : '')

  // Quota limit: render the LimitReached card instead of any thinking/text/actions block
  const errorCode = (message.metadata?.error_code as string | undefined) || ''
  if (!isUser && errorCode.startsWith('PLAN_QUOTA')) {
    return (
      <div className={`flex justify-start ${animationClass}`} style={{ animationFillMode: 'forwards' }}>
        <LimitReached />
      </div>
    )
  }

  if (isUser) {
    let selectedElement: any = null
    let displayContent = message.content

    // 1. Try parsing the new structured XML/JSON format
    const newFormatMatch = displayContent.match(/<selected_element>(.*?)<\/selected_element>\n\nRequest:\n([\s\S]*)/)
    if (newFormatMatch) {
      try {
        selectedElement = JSON.parse(newFormatMatch[1])
        displayContent = newFormatMatch[2]
      } catch (e) {}
    }
    // 2. Fallback to old text format for chat history compatibility
    else if (displayContent.startsWith('Selected element:\n') && displayContent.includes('\n\nRequest:\n')) {
      const parts = displayContent.split('\n\nRequest:\n')
      const topPart = parts[0].replace('Selected element:\n', '')
      displayContent = parts.slice(1).join('\n\nRequest:\n')

      const lines = topPart.split('\n')
      selectedElement = { title: lines[0] || 'Selected' }
      if (lines.length > 1) {
        const hasQuote = topPart.indexOf('\n"')
        if (hasQuote !== -1) {
          selectedElement.subtitle = topPart.substring(lines[0].length + 1, hasQuote).trim()
          selectedElement.body = topPart.substring(hasQuote + 2, topPart.length - 1).trim()
        } else {
          selectedElement.subtitle = topPart.substring(lines[0].length + 1).trim()
        }
      }
    }

    const images = message.images || ((message.metadata?.images as any[]) || [])

    return (
      <div className={`flex justify-end ${animationClass}`} style={{ animationFillMode: 'forwards' }}>
        <div className="flex max-w-[85%] flex-col overflow-hidden rounded-2xl rounded-tr-sm bg-slate-100 dark:bg-slate-800 text-sm leading-relaxed text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700">
          {selectedElement && (
            <div className="border-b border-black/10 dark:border-white/10 bg-slate-50 dark:bg-slate-800 p-3 text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-md bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  {selectedElement.title}
                </span>
                {selectedElement.subtitle && (
                  <span className="truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {selectedElement.subtitle.split(' ').filter((c: string) => !c.startsWith('__cu-editor')).join('.') || 'no classes'}
                  </span>
                )}
              </div>
              {selectedElement.body && (
                <div className="mt-2 border-l-2 border-slate-300 dark:border-slate-600 pl-2.5">
                  <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{selectedElement.body}"
                  </p>
                </div>
              )}
            </div>
          )}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {images.map((image: any, i: number) => <img key={`${image.url}-${i}`} src={image.url} alt={image.name || 'Uploaded image'} className="max-h-32 max-w-44 rounded-lg border border-white/20 object-cover" />)}
            </div>
          )}
          <div className="px-4 py-3 whitespace-pre-wrap break-words">{displayContent}</div>
        </div>
      </div>
    )
  }

  const renderBlock = (block: string) => {
    if (block === 'thinking' && hasThinking) return <ThinkingBlock key="thinking" text={thinking!} isFinished={Boolean(message.metadata?.reasoning_done ?? message.metadata?.thinking_done) || hasText || hasActions} durationMs={(message.metadata?.reasoning_duration_ms ?? message.metadata?.thinking_duration_ms) as number | undefined} />
    if (block === 'actions' && hasActions) return <div key="actions" className="space-y-0.5">{actions!.map(action => <ActionBlock key={action.id} type={action.type} label={action.label} status={action.status} code={action.code} toolCall={action.toolCall} isExiting={isExiting} onFormSubmit={onFormSubmit} />)}</div>
    if (block === 'text' && hasText) return (
      <div key="text" className="prose prose-sm max-w-none prose-slate dark:prose-invert prose-headings:font-semibold prose-a:text-primary dark:prose-a:text-primary prose-code:text-foreground dark:prose-code:text-foreground prose-pre:bg-slate-900 dark:prose-pre:text-slate-100 break-words leading-relaxed py-2 prose-p:last-of-type:mb-0">
        {hasMarkdown ? <MarkdownContent content={message.content} /> : <div className="whitespace-pre-wrap break-words">{message.content}</div>}
      </div>
    )
    return null
  }
  const order = ((message.metadata?.event_order as string[] | undefined) || ['thinking', 'actions', 'text']).filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className={`flex justify-start ${animationClass}`} style={{ animationFillMode: 'forwards' }}>
      <div className="w-full flex flex-col gap-0.5 text-sm text-slate-800 dark:text-slate-200">
        {order.map(renderBlock)}
      </div>
    </div>
  )
}, areMessagesEqual)
