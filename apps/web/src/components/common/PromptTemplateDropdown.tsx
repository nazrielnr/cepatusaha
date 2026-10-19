import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Sparkles,
  ChevronDown,
  Search,
  X,
  Utensils,
  Coffee,
  Cake,
  Scissors,
  Car,
  Shirt,
  Smile,
  Home,
  Building2,
  GraduationCap,
  Camera,
} from 'lucide-react'
import {
  BUSINESS_PROMPT_TEMPLATES,
  PROMPT_CATEGORIES,
  type PromptTemplate,
} from '@/data/promptTemplates'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Coffee,
  Cake,
  Sparkles,
  Scissors,
  Car,
  Shirt,
  Smile,
  Home,
  Building2,
  GraduationCap,
  Camera,
}

export interface PromptTemplateDropdownProps {
  onSelectPrompt: (prompt: string, template: PromptTemplate) => void
  placement?: 'top' | 'bottom'
  align?: 'left' | 'right'
  disabled?: boolean
  className?: string
  triggerClassName?: string
  buttonSize?: 'sm' | 'default' | 'lg'
}

export const PromptTemplateDropdown: React.FC<PromptTemplateDropdownProps> = ({
  onSelectPrompt,
  placement = 'bottom',
  align = 'left',
  disabled = false,
  className,
  triggerClassName,
  buttonSize = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      setTimeout(() => searchInputRef.current?.focus(), 30)
      return () => document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Filter list
  const filteredTemplates = useMemo(() => {
    return BUSINESS_PROMPT_TEMPLATES.filter((tpl) => {
      const matchCat = selectedCategory === 'Semua' || tpl.category === selectedCategory
      if (!matchCat) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        tpl.title.toLowerCase().includes(q) ||
        tpl.suitableFor.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q)
      )
    })
  }, [selectedCategory, searchQuery])

  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom'>(placement)

  // Auto-flip if not enough space
  useEffect(() => {
    if (!isOpen) return

    const updatePlacement = () => {
      if (!dropdownRef.current) return
      const rect = dropdownRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      if (placement === 'bottom') {
        if (spaceBelow < 360 && spaceAbove > 260) {
          setActualPlacement('top')
        } else {
          setActualPlacement('bottom')
        }
      } else if (placement === 'top') {
        if (spaceAbove < 360 && spaceBelow > 260) {
          setActualPlacement('bottom')
        } else {
          setActualPlacement('top')
        }
      }
    }

    updatePlacement()
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)
    return () => {
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
    }
  }, [isOpen, placement])

  const handleSelect = (tpl: PromptTemplate) => {
    onSelectPrompt(tpl.prompt, tpl)
    setIsOpen(false)
  }

  const isTop = actualPlacement === 'top'

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 sm:gap-1.5 rounded-lg border border-border/80 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none',
          isOpen && 'border-primary/50 text-foreground bg-muted',
          buttonSize === 'lg'
            ? 'h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm'
            : buttonSize === 'sm'
              ? 'h-7 px-2 text-[11px]'
              : 'h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs',
          triggerClassName
        )}
        title="Pilih Template Prompt Bisnis"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
        <span className="truncate whitespace-nowrap">Template Ide Usaha</span>
        <ChevronDown
          className={cn(
            'w-3 h-3 opacity-60 shrink-0 transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-[100] w-[300px] xs:w-[330px] sm:w-[360px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-popover/95 backdrop-blur-md shadow-xl text-popover-foreground flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100',
            isTop ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            align === 'right' ? 'right-0' : 'left-0',
            isTop
              ? align === 'right'
                ? 'origin-bottom-right'
                : 'origin-bottom-left'
              : align === 'right'
                ? 'origin-top-right'
                : 'origin-top-left'
          )}
          style={{ maxHeight: 'min(350px, 60vh)' }}
        >
          {/* Search box */}
          <div className="p-2 border-b border-border/60 bg-muted/30">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari bisnis (cafe, laundry, distro, klinik)..."
                className="w-full h-7 rounded-lg border border-border/80 bg-background/90 pl-7 pr-6 text-xs text-foreground placeholder:text-muted-foreground/50 outline-hidden focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Hapus cari"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1.5 no-scrollbar text-[10px]">
              {PROMPT_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-1 divide-y divide-border/20">
            {filteredTemplates.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p>Tidak ada template ditemukan.</p>
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const IconComponent = ICON_MAP[template.iconName] || Sparkles
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelect(template)}
                    className="w-full text-left p-2 rounded-lg hover:bg-accent/70 hover:text-accent-foreground transition-colors cursor-pointer group flex items-start gap-2.5"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors mt-0.5">
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {template.title}
                        </span>
                        {template.badge && (
                          <span className="text-[9px] font-medium text-primary bg-primary/10 px-1 py-0.2 rounded border border-primary/20 shrink-0">
                            {template.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate leading-tight">
                        <span className="font-medium text-foreground/80">Cocok: </span>
                        {template.suitableFor}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Minimal footer */}
          <div className="px-2.5 py-1.5 border-t border-border/50 bg-muted/20 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>{filteredTemplates.length} template bisnis</span>
            <span className="text-[9px]">Klik untuk mengisi</span>
          </div>
        </div>
      )}
    </div>
  )
}

export const PromptTemplateModal = PromptTemplateDropdown
