/**
 * ViewModeToggle Component
 *
 * Dynamic View Toggle:
 * - Active: Expanded (Icon + Text), Blue Theme
 * - Inactive: Collapsed (Icon), White Theme, Square aspect ratio
 * - Transitions: Grid-based smooth animation (from ThinkingBlock pattern)
 */

import { cn } from '@/lib/utils'
import { Code2, Globe, LayoutGrid } from 'lucide-react'

export type ViewMode = 'preview' | 'canvas' | 'code'

interface ViewModeToggleProps {
    activeMode: ViewMode
    onModeChange: (mode: ViewMode) => void
    disabled?: boolean
}

export function ViewModeToggle({ activeMode, onModeChange, disabled = false }: ViewModeToggleProps) {
    return (
        <div
            className="flex items-center gap-1.5"
            role="tablist"
            aria-label="View mode"
        >
            {/* Preview Button */}
            <button
                onClick={() => onModeChange('preview')}
                disabled={disabled}
                className={cn(
                    "group flex items-center h-9 rounded-lg border text-sm font-medium cursor-pointer outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring overflow-hidden shrink-0 transition-colors duration-300",
                    activeMode === 'preview'
                        ? "bg-accent border-border text-accent-foreground px-3"
                        : "bg-background border-border text-muted-foreground px-2.5 hover:bg-accent hover:text-accent-foreground",
                    disabled && "opacity-50 pointer-events-none"
                )}
                title="Preview"
            >
                <Globe
                    className={cn(
                        "w-4 h-4 shrink-0 transition-colors duration-300",
                        activeMode === 'preview' ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                />
                {/* Grid-based collapsible text container */}
                <div
                    className={cn(
                        "grid transition-[grid-template-columns] duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]",
                        activeMode === 'preview' ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
                    )}
                >
                    <div className="overflow-hidden flex items-center">
                        <span className="whitespace-nowrap pl-2">Preview</span>
                    </div>
                </div>
            </button>

            {/* Canvas Button */}
            <button
                onClick={() => onModeChange('canvas')}
                disabled={disabled}
                className={cn(
                    "group flex items-center h-9 rounded-lg border text-sm font-medium cursor-pointer outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring overflow-hidden shrink-0 transition-colors duration-300",
                    activeMode === 'canvas'
                        ? "bg-accent border-border text-accent-foreground px-3"
                        : "bg-background border-border text-muted-foreground px-2.5 hover:bg-accent hover:text-accent-foreground",
                    disabled && "opacity-50 pointer-events-none"
                )}
                title="Canvas"
            >
                <LayoutGrid
                    className={cn(
                        "w-4 h-4 shrink-0 transition-colors duration-300",
                        activeMode === 'canvas' ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                />
                <div
                    className={cn(
                        "grid transition-[grid-template-columns] duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]",
                        activeMode === 'canvas' ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
                    )}
                >
                    <div className="overflow-hidden flex items-center">
                        <span className="whitespace-nowrap pl-2">Canvas</span>
                    </div>
                </div>
            </button>

            {/* Code Button */}
            <button
                onClick={() => onModeChange('code')}
                disabled={disabled}
                className={cn(
                    "group flex items-center h-9 rounded-lg border text-sm font-medium cursor-pointer outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring overflow-hidden shrink-0 transition-colors duration-300",
                    activeMode === 'code'
                        ? "bg-accent border-border text-accent-foreground px-3"
                        : "bg-background border-border text-muted-foreground px-2.5 hover:bg-accent hover:text-accent-foreground",
                    disabled && "opacity-50 pointer-events-none"
                )}
                title="Code"
            >
                <Code2
                    className={cn(
                        "w-4 h-4 shrink-0 transition-colors duration-300",
                        activeMode === 'code' ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                />
                <div
                    className={cn(
                        "grid transition-[grid-template-columns] duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]",
                        activeMode === 'code' ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
                    )}
                >
                    <div className="overflow-hidden flex items-center">
                        <span className="whitespace-nowrap pl-2">Code</span>
                    </div>
                </div>
            </button>
        </div>
    )
}
