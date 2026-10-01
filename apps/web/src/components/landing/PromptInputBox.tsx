import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowUp,
  Utensils,
  Shirt,
  Coffee,
  ChevronDown,
  Check,
  Loader2,
  Paperclip,
  ImageIcon,
  X,
  Code2,
  Atom,
} from 'lucide-react'
import { Button } from './Button'
import { fetchModels, type AIModel } from '@/api/models'
import { cn } from '@/lib/utils'

export interface PromptInputBoxProps {
  onGenerate: (prompt: string, modelId: string, planMode?: boolean, images?: File[]) => void
  isGenerating: boolean
  size?: 'default' | 'lg'
  showSuggestions?: boolean
  suggestionsTitle?: string
  className?: string
  textareaMinHeightClass?: string
  autoFocus?: boolean
  placeholderExamples?: string[]
}

export const DEFAULT_SUGGESTIONS = [
  {
    label: 'Restoran Padang',
    icon: Utensils,
    prompt:
      'Website restoran Padang modern dan elegan yang menyajikan menu kuliner khas Sumatera Barat secara visual premium. Dilengkapi dengan galeri menu interaktif, sistem reservasi meja makan online, peta lokasi cabang terintegrasi, testimoni pelanggan, serta halaman sejarah resep keluarga yang otentik.',
  },
  {
    label: 'Fashion Store',
    icon: Shirt,
    prompt:
      'Website e-commerce Fashion Store minimalis dan estetis untuk brand pakaian lokal modern. Menyediakan fitur katalog produk dengan filter kategori pintar, halaman detail pakaian yang menampilkan panduan ukuran, galeri lookbook musiman yang interaktif, integrasi media sosial, serta alur belanja yang seamless.',
  },
  {
    label: 'Kafe Kekinian',
    icon: Coffee,
    prompt:
      'Website Kafe Kekinian (Specialty Coffee Shop) bergaya industrial-minimalis yang aesthetic. Menampilkan menu kopi artisan, pastry, dan seasonal drinks. Dilengkapi fitur reservasi ruang kerja (coworking space), kalender acara live music, galeri suasana kafe, serta sistem pendaftaran membership pelanggan setia.',
  },
]

export const DEFAULT_PLACEHOLDER_EXAMPLES = [
  'usaha laundry sepatu premium dengan layanan antar jemput',
  'toko bunga online dengan fitur kustomisasi buket',
  'coffee shop minimalis dengan fitur membership digital',
  'studio yoga dengan booking kelas online',
]

export const PromptInputBox: React.FC<PromptInputBoxProps> = ({
  onGenerate,
  isGenerating,
  size = 'default',
  showSuggestions = true,
  suggestionsTitle = 'Coba buat:',
  className = '',
  textareaMinHeightClass,
  autoFocus = false,
  placeholderExamples = DEFAULT_PLACEHOLDER_EXAMPLES,
}) => {
  const isLarge = size === 'lg'
  const computedMinHeight = textareaMinHeightClass || (isLarge ? 'min-h-[105px] sm:min-h-[125px]' : 'min-h-[72px] sm:min-h-[96px]')

  const [prompt, setPrompt] = useState('')
  const [models, setModels] = useState<AIModel[]>([])
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  const [selectedFramework, setSelectedFramework] = useState<'html' | 'react'>('html')
  const [isFrameworkMenuOpen, setIsFrameworkMenuOpen] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderText, setPlaceholderText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Fetch available models
  useEffect(() => {
    let isMounted = true
    const loadModels = async () => {
      try {
        const fetchedModels = await fetchModels()
        if (isMounted && fetchedModels.length > 0) {
          setModels(fetchedModels)
          setSelectedModel(fetchedModels[0])
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        if (isMounted) {
          setIsLoadingModels(false)
        }
      }
    }

    loadModels()
    return () => {
      isMounted = false
    }
  }, [])

  // Typewriter effect for placeholder
  useEffect(() => {
    const examples = placeholderExamples
    if (!examples || examples.length === 0) return

    const currentFullText = examples[placeholderIndex % examples.length]

    const handleTyping = () => {
      setPlaceholderText((prev) => {
        if (isDeleting) {
          return currentFullText.substring(0, prev.length - 1)
        } else {
          try {
            return currentFullText.substring(0, prev.length + 1)
          } catch {
            return prev
          }
        }
      })

      if (!isDeleting && placeholderText === currentFullText) {
        setTimeout(() => setIsDeleting(true), 2000)
      } else if (isDeleting && placeholderText === '') {
        setIsDeleting(false)
        setPlaceholderIndex((prev) => (prev + 1) % examples.length)
      }
    }

    const timer = setTimeout(handleTyping, isDeleting ? 30 : 50)
    return () => clearTimeout(timer)
  }, [placeholderText, isDeleting, placeholderIndex, placeholderExamples])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${scrollHeight}px`
    }
  }, [prompt])

  const handleSubmit = async () => {
    if ((!prompt.trim() && !images.length) || !selectedModel || isGenerating || isSubmitting) return

    setIsSubmitting(true)
    const promptToSend = prompt || 'Analisis gambar ini.'
    const imagesToSend = images
    setPrompt('')
    setImages([])

    try {
      await onGenerate(promptToSend, selectedModel.id, false, imagesToSend)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImages((prev) =>
      [...prev, ...Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))].slice(0, 4)
    )
    e.currentTarget.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={cn('relative w-full flex flex-col', className)}>
      <div
        className={`
          relative group bg-card rounded-2xl border transition-all duration-300 shadow-xl shadow-foreground/5 flex flex-col
          border-border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10
        `}
      >
        {/* Uploaded Images Preview */}
        {images.length > 0 && (
          <div className="px-3.5 sm:px-4 pt-3.5 sm:pt-4 flex flex-wrap gap-2">
            {images.map((image, i) => (
              <div
                key={`${image.name}-${i}`}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="max-w-32 sm:max-w-36 truncate text-[11px] sm:text-xs">{image.name}</span>
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="rounded-full p-0.5 hover:bg-muted/80 cursor-pointer"
                  aria-label={`Hapus ${image.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Prompt Input Textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          autoFocus={autoFocus}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className={cn(
            'w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/40 font-sans leading-relaxed',
            isLarge
              ? 'pt-4 px-4 sm:pt-5 sm:px-5 pb-2 max-h-[280px] sm:max-h-[340px] text-sm sm:text-base md:text-lg'
              : 'pt-3.5 px-3.5 sm:pt-5 sm:px-5 pb-2 max-h-[240px] sm:max-h-[300px] text-sm sm:text-base md:text-lg',
            computedMinHeight
          )}
          rows={1}
        />

        {/* Action Toolbar */}
        <div
          className={cn(
            'flex items-center justify-between gap-1 sm:gap-2 rounded-b-2xl',
            isLarge ? 'px-2.5 sm:px-4 pb-2.5 sm:pb-3 pt-0.5' : 'px-2 sm:px-3 pb-2 sm:pb-3 pt-0.5'
          )}
        >
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isGenerating || isSubmitting}
              className={cn(
                'flex items-center justify-center rounded-lg font-medium bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer',
                isLarge ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7 sm:w-8 sm:h-8'
              )}
              title="Lampirkan gambar"
              aria-label="Lampirkan gambar"
            >
              <Paperclip className={cn('shrink-0', isLarge ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5')} />
            </button>

            {/* Model Selector */}
            {!isLoadingModels && models.length > 0 && selectedModel && (
              <div className="relative min-w-0 shrink">
                <button
                  type="button"
                  onClick={() => {
                    setIsModelMenuOpen(!isModelMenuOpen)
                    setIsFrameworkMenuOpen(false)
                  }}
                  disabled={isGenerating || isSubmitting}
                  className={cn(
                    'flex items-center gap-1 sm:gap-1.5 rounded-lg font-medium bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 whitespace-nowrap',
                    isLarge
                      ? 'h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm max-w-[120px] xs:max-w-[160px] sm:max-w-[220px]'
                      : 'h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs max-w-[105px] xs:max-w-[140px] sm:max-w-[200px]'
                  )}
                >
                  <span className="truncate">{selectedModel.displayName}</span>
                  <ChevronDown
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50 shrink-0 transition-transform duration-200 ${
                      isModelMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isModelMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)} />
                    <div className="absolute top-full mt-1.5 left-0 min-w-[200px] max-w-[280px] bg-card rounded-xl border border-border shadow-lg p-1 z-20 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(model)
                            setIsModelMenuOpen(false)
                          }}
                          className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors cursor-pointer ${
                            selectedModel.id === model.id
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <span className="truncate">{model.displayName}</span>
                          {selectedModel.id === model.id && <Check className="w-3 h-3 shrink-0 ml-2" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Framework / Format Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsFrameworkMenuOpen(!isFrameworkMenuOpen)
                  setIsModelMenuOpen(false)
                }}
                disabled={isGenerating || isSubmitting}
                className={cn(
                  'flex items-center gap-1 sm:gap-1.5 rounded-lg font-medium bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 whitespace-nowrap',
                  isLarge ? 'h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm' : 'h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs'
                )}
                title="Format Output Website"
              >
                <Code2 className={cn('opacity-70 shrink-0', isLarge ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5')} />
                <span>{selectedFramework === 'html' ? 'HTML' : 'React'}</span>
                <ChevronDown
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50 shrink-0 transition-transform duration-200 ${
                    isFrameworkMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isFrameworkMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFrameworkMenuOpen(false)} />
                  <div className="absolute top-full mt-1.5 left-0 sm:left-auto sm:right-0 min-w-[180px] bg-card rounded-xl border border-border shadow-lg p-1 z-20 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                    {/* HTML Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFramework('html')
                        setIsFrameworkMenuOpen(false)
                      }}
                      className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors cursor-pointer ${
                        selectedFramework === 'html'
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5" />
                        <span>HTML</span>
                      </div>
                      {selectedFramework === 'html' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {/* React (Coming Soon) Option */}
                    <div className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg text-left opacity-60 cursor-not-allowed select-none text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Atom className="w-3.5 h-3.5" />
                        <span>React</span>
                      </div>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/80">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleSubmit}
            disabled={
              (!prompt.trim() && !images.length) || !selectedModel || isGenerating || isLoadingModels || isSubmitting
            }
            className={cn(
              'rounded-lg transition-all duration-300 shrink-0 ml-1 sm:ml-2 p-0 flex items-center justify-center disabled:opacity-100 cursor-pointer',
              (prompt.trim() || images.length) && selectedModel && !isGenerating && !isLoadingModels && !isSubmitting
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none',
              isLarge ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7 sm:w-8 sm:h-8'
            )}
          >
            {isGenerating || isSubmitting ? (
              <Loader2 className={cn('animate-spin', isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5 sm:w-4 sm:h-4')} />
            ) : (
              <ArrowUp className={cn(isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5 sm:w-4 sm:h-4')} />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestion Chips */}
      {showSuggestions && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3.5 sm:mt-4 px-1 sm:px-0">
          {suggestionsTitle && (
            <span className="text-[11px] sm:text-xs text-muted-foreground/70 mr-0.5 sm:mr-1 whitespace-nowrap">
              {suggestionsTitle}
            </span>
          )}
          {DEFAULT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => {
                setPrompt(suggestion.prompt)
                if (textareaRef.current) textareaRef.current.focus()
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-card/90 border border-border/90 shadow-2xs text-[11px] sm:text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <suggestion.icon className="w-3 h-3 opacity-60 shrink-0" />
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

