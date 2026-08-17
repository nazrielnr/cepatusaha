import React from 'react'
import { Terminal, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InteractiveEmptyStateProps {
  isActive?: boolean
}

export const InteractiveEmptyState: React.FC<InteractiveEmptyStateProps> = React.memo(({
  isActive = false
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden select-none">
      {/* Background Pattern - Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.8]"
        style={{
          backgroundImage: 'radial-gradient(#bae6fd 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Icon Placeholder */}
        <div className={cn(
          'w-20 h-20 rounded-2xl border-[1.5px] border-dashed flex items-center justify-center mb-6 transition-all duration-500',
          isActive
            ? 'border-primary bg-primary/50 animate-pulse'
            : 'border-slate-300 bg-slate-100/50'
        )}>
          {isActive ? (
            <Cpu className="w-8 h-8 text-primary animate-[spin_3s_linear_infinite]" />
          ) : (
            <Terminal className="w-8 h-8 text-slate-400" />
          )}
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2 max-w-xs px-4">
          <h3 className="text-base font-semibold text-slate-800 tracking-tight">
            {isActive ? 'System Processing' : 'Preview Environment'}
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            {isActive
              ? 'Compiling codebase and rendering interface...'
              : 'Waiting for input. Generated output will appear here.'}
          </p>
        </div>

        {/* Status Indicator Pill */}
        <div className={cn(
          'mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono uppercase tracking-wider transition-colors duration-300',
          isActive
            ? 'bg-primary/10 border-primary/20 text-primary'
            : 'bg-white border-slate-200 text-slate-400'
        )}>
          <div className={cn(
            'w-1.5 h-1.5 rounded-full',
            isActive ? 'bg-primary animate-ping' : 'bg-slate-300'
          )} />
          <span>{isActive ? 'Building...' : 'Standby'}</span>
        </div>
      </div>
    </div>
  )
})

InteractiveEmptyState.displayName = 'InteractiveEmptyState'
