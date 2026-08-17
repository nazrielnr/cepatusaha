import React, { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InteractiveGridPatternProps {
    className?: string
}

export const InteractiveGridPattern: React.FC<InteractiveGridPatternProps> = ({ className }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const highlightRef = useRef<HTMLDivElement>(null)
    const [opacity, setOpacity] = useState(0)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!highlightRef.current) return

            const rect = container.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            // Snap logic: Calculate nearest 24px grid cell
            const snapX = Math.floor(x / 24) * 24
            const snapY = Math.floor(y / 24) * 24

            // Direct DOM update for zero-latency performance
            highlightRef.current.style.transform = `translate(${snapX}px, ${snapY}px)`
        }

        const handleMouseEnter = () => setOpacity(1)
        const handleMouseLeave = () => setOpacity(0)

        container.addEventListener('mousemove', handleMouseMove, { passive: true })
        container.addEventListener('mouseenter', handleMouseEnter)
        container.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            container.removeEventListener('mousemove', handleMouseMove)
            container.removeEventListener('mouseenter', handleMouseEnter)
            container.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={cn("absolute inset-0 overflow-hidden", className)}
        >
            {/* Base Layer - Static Subtle Grid */}
            <div
                className="absolute inset-0 bg-[linear-gradient(to_right,#80808022_1px,transparent_1px),linear-gradient(to_bottom,#80808022_1px,transparent_1px)] bg-[size:24px_24px]"
            />

            {/* Snapping Grid Highlight Layer */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Optimized Highlight Cell - No React state lag */}
                <div
                    ref={highlightRef}
                    className="absolute bg-brand-primary/5 border border-brand-primary/10 backdrop-blur-[0px]"
                    style={{
                        width: 24,
                        height: 24,
                        top: 0,
                        left: 0,
                        opacity: opacity, // Only opacity is managed by React state (smooth fade)
                        transition: 'opacity 0.2s ease', // Smooth fade in/out
                        boxShadow: 'inset 0 0 10px rgba(251, 146, 60, 0.1)',
                        willChange: 'transform', // Hardware acceleration hint
                        // transform is set via JS
                    }}
                />
            </div>
        </div>
    )
}
