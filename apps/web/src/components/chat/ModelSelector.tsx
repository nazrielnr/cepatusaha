/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { fetchModels, type AIModel } from '@/api'

interface ModelSelectorProps {
  selectedModelId?: string
  onModelChange: (modelId: string) => void
  disabled?: boolean
}

export function ModelSelector({ selectedModelId, onModelChange, disabled = false }: ModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true)
        const fetchedModels = await fetchModels()
        setModels(fetchedModels)

        // If no model selected and models available, select the first one
        if (!selectedModelId && fetchedModels.length > 0) {
          onModelChange(fetchedModels[0].id)
        }
      } catch (error) {
        console.error('[ModelSelector] Failed to load models:', error)
      } finally {
        setLoading(false)
      }
    }

    loadModels()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedModel = models.find(m => m.id === selectedModelId)

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500">
        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse" />
        <span>Loading...</span>
      </div>
    )
  }

  if (models.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200 border
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
          }
        `}
        aria-label="Select AI model"
      >
        <span className="text-slate-700 dark:text-slate-300">
          {selectedModel?.displayName || 'Select Model'}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 min-w-[200px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-1 z-20 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelChange(model.id)
                  setIsOpen(false)
                }}
                className={`
                  flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg text-left transition-colors
                  ${selectedModelId === model.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span className="font-medium">{model.displayName}</span>
                {selectedModelId === model.id && (
                  <Check className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
