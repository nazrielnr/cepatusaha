/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui-components/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'enter': 'enter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'exit': 'exit 0.125s cubic-bezier(0.8, 0.2, 1, 0.2) forwards',
        'pop-in': 'popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 4s linear infinite',
        'focus-in': 'focusIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'focus-out': 'focusOut 0.125s cubic-bezier(0.8, 0.2, 1, 0.2) forwards',
        'spin-slow': 'spin 12s linear infinite',
        'loading-bar': 'loadingBar 1.5s ease-in-out infinite',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        enter: {
          '0%': { opacity: '0', transform: 'translateY(15px) scale(0.98)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        exit: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
          '100%': { opacity: '0', transform: 'translateY(-15px) scale(0.98)', filter: 'blur(4px)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)', filter: 'blur(2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)', filter: 'blur(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        },
        focusIn: {
          '0%': { opacity: '0', filter: 'blur(8px)', transform: 'scale(0.96)' },
          '100%': { opacity: '1', filter: 'blur(0)', transform: 'scale(1)' }
        },
        focusOut: {
          '0%': { opacity: '1', filter: 'blur(0)', transform: 'scale(1)' },
          '100%': { opacity: '0', filter: 'blur(8px)', transform: 'scale(0.96)' }
        },
        loadingBar: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' }
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        brand: {
          primary: 'hsl(var(--foreground))',
          secondary: 'hsl(var(--muted-foreground))',
          accent: 'hsl(var(--primary))',
          highlight: 'hsl(var(--destructive))',
          surface: 'hsl(var(--background))',
          subtle: 'hsl(var(--muted))',
          border: 'hsl(var(--border))',
          hover: 'hsl(var(--accent))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Newsreader', 'serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid-sm': '20px 20px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
