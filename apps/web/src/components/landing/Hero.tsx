import React, { useState, useEffect, useRef } from 'react'
import { ArrowUp, Utensils, Shirt, Coffee, Sparkles, ChevronDown, Check, Loader2, Lightbulb, Paperclip, ImageIcon, X } from 'lucide-react'
import { Button } from './Button'
import { InteractiveGridPattern } from './InteractiveGridPattern'
import { fetchModels, type AIModel } from '@/api/models'

interface HeroProps {
  onGenerate: (prompt: string, modelId: string, planMode?: boolean, images?: File[]) => void
  isGenerating: boolean
}

const SUGGESTIONS = [
  {
    label: 'Restoran Padang',
    icon: Utensils,
    prompt: 'Website restoran Padang modern dan elegan yang menyajikan menu kuliner khas Sumatera Barat secara visual premium. Dilengkapi dengan galeri menu interaktif, sistem reservasi meja makan online, peta lokasi cabang terintegrasi, testimoni pelanggan, serta halaman sejarah resep keluarga yang otentik.'
  },
  {
    label: 'Fashion Store',
    icon: Shirt,
    prompt: 'Website e-commerce Fashion Store minimalis dan estetis untuk brand pakaian lokal modern. Menyediakan fitur katalog produk dengan filter kategori pintar, halaman detail pakaian yang menampilkan panduan ukuran, galeri lookbook musiman yang interaktif, integrasi media sosial, serta alur belanja yang seamless.'
  },
  {
    label: 'Kafe Kekinian',
    icon: Coffee,
    prompt: 'Website Kafe Kekinian (Specialty Coffee Shop) bergaya industrial-minimalis yang aesthetic. Menampilkan menu kopi artisan, pastry, dan seasonal drinks. Dilengkapi fitur reservasi ruang kerja (coworking space), kalender acara live music, galeri suasana kafe, serta sistem pendaftaran membership pelanggan setia.'
  }
]

const PLACEHOLDER_EXAMPLES = [
  'usaha laundry sepatu premium dengan layanan antar jemput',
  'toko bunga online dengan fitur kustomisasi buket',
  'coffee shop minimalis dengan fitur membership digital',
  'studio yoga dengan booking kelas online'
]

const PLAN_MODE_EXAMPLES = [
  'rencanakan aplikasi e-commerce dengan fitur marketplace',
  'desain sistem pemesanan untuk klinik kesehatan',
  'buat dokumen kebutuhan untuk platform edukasi online',
  'rancang arsitektur situs web agen perjalanan'
]

export const Hero: React.FC<HeroProps> = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('')
  const [models, setModels] = useState<AIModel[]>([])
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [isPlanMode, setIsPlanMode] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderText, setPlaceholderText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Fetch available models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await fetchModels()

        if (models.length > 0) {
          setModels(models)
          setSelectedModel(models[0])
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadModels()
  }, [])

  // Reset placeholder when plan mode changes
  useEffect(() => {
    setPlaceholderText('')
    setPlaceholderIndex(0)
    setIsDeleting(false)
  }, [isPlanMode])

  // Typewriter effect for placeholder
  useEffect(() => {
    const examples = isPlanMode ? PLAN_MODE_EXAMPLES : PLACEHOLDER_EXAMPLES
    const currentFullText = examples[placeholderIndex]

    const handleTyping = () => {
      setPlaceholderText(prev => {
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
  }, [placeholderText, isDeleting, placeholderIndex, isPlanMode])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${scrollHeight}px`
    }
  }, [prompt])

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if ((!prompt.trim() && !images.length) || !selectedModel || isGenerating || isSubmitting) return


    // Set submitting state and clear prompt immediately
    setIsSubmitting(true)
    const promptToSend = prompt || 'Analisis gambar ini.'
    const imagesToSend = images
    setPrompt('')
    setImages([])

    try {
      await onGenerate(promptToSend, selectedModel.id, isPlanMode, imagesToSend)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImages((prev) => [...prev, ...Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))].slice(0, 4))
    e.currentTarget.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <section className="relative w-full pt-32 pb-16 px-4 flex flex-col items-center justify-center min-h-[85vh] bg-background overflow-hidden">

      {/* Background Layers */}
      <div className="absolute inset-0 z-0 select-none">

        {/* Interactive Geometric Grid */}
        <InteractiveGridPattern />

        {/* Scattered Ambient Gradient Blobs (Confined to Hero) */}
        <div className="absolute pointer-events-none inset-0 overflow-hidden">
          {/* Top Left - Sky Blue (Visible on Mobile & Desktop) */}
          <div className="absolute -top-[10%] -left-[10%] w-48 h-48 md:w-[600px] md:h-[600px] bg-sky-400/20 rounded-full blur-[60px] md:blur-[130px] animate-blob"></div>
          {/* Top Right - Amber (Visible on Mobile & Desktop) */}
          <div className="absolute top-[5%] -right-[10%] w-56 h-56 md:w-[700px] md:h-[700px] bg-amber-400/20 rounded-full blur-[70px] md:blur-[140px] animate-blob" style={{ animationDelay: '2s' }}></div>
          
          {/* Center Left - Emerald (Desktop Only) */}
          <div className="hidden md:block absolute top-[30%] -left-[15%] w-[600px] h-[600px] bg-emerald-400/15 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '4s' }}></div>
          {/* Center Right - Orange (Desktop Only) */}
          <div className="hidden md:block absolute top-[40%] -right-[5%] w-[650px] h-[650px] bg-orange-400/15 rounded-full blur-[130px] animate-blob" style={{ animationDelay: '1s' }}></div>
          {/* Bottom Left - Amber (Desktop Only) */}
          <div className="hidden md:block absolute bottom-[5%] -left-[5%] w-[550px] h-[550px] bg-amber-400/15 rounded-full blur-[110px] animate-blob" style={{ animationDelay: '3s' }}></div>
          {/* Bottom Right - Sky Blue (Desktop Only) */}
          <div className="hidden md:block absolute bottom-[-10%] -right-[10%] w-[650px] h-[650px] bg-sky-400/20 rounded-full blur-[130px] animate-blob" style={{ animationDelay: '5s' }}></div>
        </div>

        {/* Gradient Fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center text-center gap-6 mb-10">


        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-serif font-medium text-foreground tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
          Ubah Ide Anda Menjadi <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] animate-shimmer">
            Website Siap Pakai
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          Tulis apa pun yang ingin Anda bangun, dan saksikan ide tersebut menjadi situs web modern, responsif, dan fungsional secara instan.
        </p>

      </div>

      {/* Input Area */}
      <div className="relative w-full max-w-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">

        {/* Plan Mode Indicator */}
        {isPlanMode && (
          <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-lg">
            <Lightbulb className="w-4 h-4 text-secondary fill-secondary" />
            <span className="text-xs text-foreground font-medium">
              Mode Perencanaan aktif - AI akan membuat desain, dokumen kebutuhan, dan perencanaan proyek
            </span>
          </div>
        )}

        <div className={`
          relative group bg-card rounded-2xl border transition-all duration-300 shadow-xl shadow-foreground/5 flex flex-col
          ${isPlanMode
            ? 'border-secondary/30 focus-within:border-secondary focus-within:ring-4 focus-within:ring-secondary/20'
            : 'border-border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10'
          }
        `}>

          {images.length > 0 && (
            <div className="px-4 pt-4 flex flex-wrap gap-2">
              {images.map((image, i) => (
                <div key={`${image.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="max-w-36 truncate">{image.name}</span>
                  <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-full p-0.5 hover:bg-muted/80" aria-label={`Hapus ${image.name}`}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="w-full bg-transparent pt-5 px-5 md:pt-6 md:px-6 pb-2 min-h-[96px] max-h-[300px] resize-none outline-none text-lg text-foreground placeholder:text-muted-foreground/40 font-sans"
            rows={1}
          />

          <div className="px-3 pb-3 flex items-center justify-between rounded-b-2xl">

            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isGenerating || isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Tambah gambar"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Media</span>
              </button>

              {/* Model Selector */}
              {!isLoadingModels && models.length > 0 && selectedModel && (
                <div className="relative">
                  <button
                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                    disabled={isGenerating || isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedModel.displayName}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>

                  {isModelMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)} />
                      <div className="absolute top-full mt-2 left-0 min-w-[200px] bg-card rounded-xl border border-border shadow-lg p-1 z-20 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                        {models.map(model => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model)
                              setIsModelMenuOpen(false)
                            }}
                            className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg text-left transition-colors ${selectedModel.id === model.id
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted'
                              }`}
                          >
                            {model.displayName}
                            {selectedModel.id === model.id && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Plan Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setIsPlanMode(!isPlanMode)}
                disabled={isGenerating || isSubmitting}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${isPlanMode
                    ? 'bg-secondary/10 border-secondary/30 text-foreground hover:bg-secondary/20'
                    : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                title={isPlanMode ? 'Mode Perencanaan aktif - AI akan membuat desain & dokumen kebutuhan' : 'Aktifkan mode perencanaan'}
              >
                <Lightbulb className={`w-3.5 h-3.5 ${isPlanMode ? 'fill-secondary text-secondary' : ''}`} />
                <span>Rencanakan</span>
              </button>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleSubmit}
              disabled={(!prompt.trim() && !images.length) || !selectedModel || isGenerating || isLoadingModels || isSubmitting}
              className={`
                rounded-lg transition-all duration-300
                ${(prompt.trim() || images.length) && selectedModel && !isGenerating && !isLoadingModels && !isSubmitting
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'}
                w-10 h-10 p-0 flex items-center justify-center disabled:opacity-100
              `}
            >
              {isGenerating || isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="text-xs text-muted-foreground/70 mr-1">Coba buat:</span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => {
                setPrompt(suggestion.prompt)
                if (textareaRef.current) textareaRef.current.focus()
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border shadow-sm text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              <suggestion.icon className="w-3 h-3 opacity-60" />
              {suggestion.label}
            </button>
          ))}
        </div>

      </div>
    </section>
  )
}
