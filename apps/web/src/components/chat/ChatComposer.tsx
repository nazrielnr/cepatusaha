import { type ChangeEvent, type FormEvent, type KeyboardEvent, type RefObject, useRef } from 'react'
import { ImageIcon, Paperclip, Send, Square, X } from 'lucide-react'
import type { ChatMode } from '@/types/chat'
import { ModelSelector } from './ModelSelector'

export type ComposerReplyContext = {
  title: string
  subtitle?: string
  body?: string
}

type ChatComposerProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  inputValue: string
  onInputChange: (value: string) => void
  inputDisabled: boolean
  isStreaming?: boolean
  onStopStreaming?: () => void
  currentMode: ChatMode
  selectedModelId?: string
  onModelChange?: (modelId: string) => void
  onSubmit: (message: string, mode: ChatMode, modelId?: string, planMode?: boolean, images?: File[]) => void
  images?: File[]
  onImagesChange?: (images: File[]) => void
  replyContext?: ComposerReplyContext | null
  onClearReplyContext?: () => void
}

export function ChatComposer({ textareaRef, inputValue, onInputChange, inputDisabled, isStreaming, onStopStreaming, currentMode, selectedModelId, onModelChange, onSubmit, replyContext, onClearReplyContext, images = [], onImagesChange }: ChatComposerProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isStreaming) return
    if (inputValue.trim() || images.length) {
      const message = replyContext ? `<selected_element>${JSON.stringify(replyContext)}</selected_element>\n\nRequest:\n${inputValue}` : inputValue
      onSubmit(message || 'Analisis gambar ini.', currentMode, selectedModelId, false, images)
      onInputChange('')
      onImagesChange?.([])
      onClearReplyContext?.()
    }
  }

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const next = [...images, ...Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))].slice(0, 4)
    onImagesChange?.(next)
    e.currentTarget.value = ''
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) form.requestSubmit()
    }
  }

  return (
    <div className="px-4 pb-4 pt-2 bg-transparent flex-shrink-0">
      <div className="max-w-4xl mx-auto pb-2">
        <form onSubmit={handleSubmit} className="relative group rounded-2xl border border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/50 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300 flex flex-col">
          {replyContext && (
            <div className="mx-3 mt-3 relative flex items-start rounded-xl border border-border/50 bg-muted/30 p-3 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-1">
              <div className="min-w-0 flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {replyContext.title}
                  </span>
                  {replyContext.subtitle && (
                    <span className="truncate font-mono text-[10px] text-muted-foreground/70">
                      {replyContext.subtitle.split(' ').filter(c => !c.startsWith('__cu-editor')).join('.') || 'no classes'}
                    </span>
                  )}
                </div>
                {replyContext.body && (
                  <div className="mt-2 border-l-2 border-primary/20 pl-2.5">
                    <p className="line-clamp-2 text-xs text-muted-foreground/80 leading-relaxed italic">
                      "{replyContext.body}"
                    </p>
                  </div>
                )}
              </div>
              <button type="button" onClick={onClearReplyContext} className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" aria-label="Clear selected element">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {images.length > 0 && (
            <div className="mx-3 mt-3 flex flex-wrap gap-2">
              {images.map((image, i) => (
                <div key={`${image.name}-${i}`} className="relative flex items-center gap-2 rounded-lg border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="max-w-32 truncate">{image.name}</span>
                  <button type="button" onClick={() => onImagesChange?.(images.filter((_, idx) => idx !== i))} className="rounded-full p-0.5 hover:bg-muted" aria-label={`Remove ${image.name}`}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jelaskan apa yang ingin Anda buat atau ubah..."
            disabled={inputDisabled}
            className="w-full max-h-[300px] pt-3.5 px-4 pb-2 bg-transparent border-none focus:ring-0 outline-none text-[15px] leading-relaxed resize-none text-foreground placeholder:text-muted-foreground/60 min-h-[56px] transition-colors"
            rows={1}
            aria-label="Message input"
          />

          <div className="px-3 pb-3 pt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onModelChange && <ModelSelector selectedModelId={selectedModelId} onModelChange={onModelChange} disabled={inputDisabled} />}
            </div>

            <div className="flex items-center gap-1.5">
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={inputDisabled} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" aria-label="Attach image">
                <Paperclip className="h-4 w-4" />
              </button>
              {isStreaming ? (
                <button type="button" onClick={onStopStreaming} className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 transition-all focus:outline-none focus:ring-2 focus:ring-destructive/30" aria-label="Stop streaming">
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button type="submit" disabled={(!inputValue.trim() && !images.length) || inputDisabled} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30" aria-label="Send message">
                  <Send className="h-4 w-4 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
