import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'shimmer' | 'destructive'
  children: React.ReactNode
  icon?: React.ReactNode
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  icon,
  loading = false,
  ...props
}) => {
  const baseLayout = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-sans tracking-tight text-sm'

  const variants = {
    primary: 'px-6 py-2.5 rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90',
    secondary: 'px-6 py-2.5 rounded-lg bg-card border border-border text-foreground shadow-sm hover:bg-muted',
    outline: 'px-6 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted',
    ghost: 'px-4 py-2 rounded-lg bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted',
    destructive: 'px-6 py-2.5 rounded-lg bg-destructive text-destructive-foreground shadow-md shadow-destructive/20 hover:bg-destructive/90',
    shimmer: 'px-8 py-3.5 rounded-xl bg-primary text-primary-foreground overflow-hidden group shadow-lg shadow-primary/25 transition-all'
  }

  if (variant === 'shimmer') {
    return (
      <button
        className={`${baseLayout} ${variants.shimmer} ${className}`}
        {...props}
      >
        <span className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-background opacity-20 group-hover:animate-shimmer" />
        <span className="flex items-center gap-2.5 relative z-10">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {children}
          {icon}
        </span>
      </button>
    )
  }

  return (
    <button
      className={`${baseLayout} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </span>
    </button>
  )
}
