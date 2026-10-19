import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useRef,
  useState,
  useCallback,
} from 'react'
import { Paperclip, Send, Square, UploadCloud, X } from 'lucide-react'
import type { ChatMode } from '@/types/chat'
import { ModelSelector } from './ModelSelector'
import { ImageAttachmentPreview } from '@/components/common/ImageAttachmentPreview'
import { cn } from '@/lib/utils'

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
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const addImages = useCallback((newFiles: File[]) => {
    const existing = new Set(images.map((f) => `${f.name}_${f.size}`))
    const unique = newFiles.filter((f) => !existing.has(`${f.name}_${f.size}`))
    onImagesChange?.([...images, ...unique].slice(0, 4))
  }, [images, onImagesChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData?.files || [])
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length > 0) {
      e.preventDefault()
      addImages(imageFiles)
      return
    }

    const items = e.clipboardData?.items
    if (items) {
      const itemFiles: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) itemFiles.push(file)
        }
      }
      if (itemFiles.length > 0) {
        e.preventDefault()
        addImages(itemFiles)
      }
    }
  }, [addImages])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer?.files || [])
    const imageFiles = droppedFiles.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length > 0) {
      addImages(imageFiles)
    }
  }

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
    if (e.target.files) {
      addImages(Array.from(e.target.files).filter((f) => f.type.startsWith('image/')))
    }
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
        <form
          onSubmit={handleSubmit}
          onPaste={handlePaste}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            'relative group rounded-2xl border border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/50 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300 flex flex-col',
            isDragging && 'border-primary ring-2 ring-primary/30'
          )}
        >
          {/* Drag & Drop Visual Overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary bg-background/95 backdrop-blur-xs text-primary pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <UploadCloud className="h-6 w-6 text-primary animate-bounce" />
              <p className="text-xs font-semibold text-foreground">Lepaskan gambar di sini</p>
              <p className="text-[10px] text-muted-foreground">Lampirkan referensi desain (maks. 4 gambar)</p>
            </div>
          )}

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

          {/* Uploaded Images Preview */}
          {images.length > 0 && (
            <div className="mx-3 mt-3">
              <ImageAttachmentPreview
                images={images}
                onRemove={(idx) => onImagesChange?.(images.filter((_, i) => i !== idx))}
                disabled={inputDisabled}
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Jelaskan apa yang ingin Anda buat atau ubah..."
            disabled={inputDisabled}
            className="w-full max-h-[300px] pt-3.5 px-4 pb-2 bg-transparent border-none focus:ring-0 outline-none text-[15px] leading-relaxed resize-none text-foreground placeholder:text-muted-foreground/60 min-h-[56px] transition-colors"
            rows={1}
            aria-label="Message input"
          />

          <div className="px-3 pb-3 pt-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {onModelChange && <ModelSelector selectedModelId={selectedModelId} onModelChange={onModelChange} disabled={inputDisabled} />}
            </div>

            <div className="flex items-center gap-1.5">
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={inputDisabled} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 cursor-pointer" aria-label="Attach image">
                <Paperclip className="h-4 w-4" />
              </button>
              {isStreaming ? (
                <button type="button" onClick={onStopStreaming} className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 transition-all focus:outline-none focus:ring-2 focus:ring-destructive/30 cursor-pointer" aria-label="Stop streaming">
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button type="submit" disabled={(!inputValue.trim() && !images.length) || inputDisabled} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer" aria-label="Send message">
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
