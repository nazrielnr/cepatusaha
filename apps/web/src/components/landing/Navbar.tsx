import React, { useState, useEffect } from 'react'
import { Menu, Zap } from 'lucide-react'
import { Button } from './Button'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Fitur', href: '#features' },
    { label: 'Templat', href: '#templates' },
    { label: 'Harga', href: '#pricing' }
  ]

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 md:pt-5 px-4 pointer-events-none">
      <nav
        className={`
          pointer-events-auto
          relative flex items-center justify-between
          transition-[max-width,height,padding,background-color,border-color,border-radius,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
          w-full

          ${scrolled
            ? 'max-w-[580px] h-14 rounded-full bg-background/90 backdrop-blur-md border border-border shadow-lg shadow-foreground/5 px-3'
            : 'max-w-7xl h-16 rounded-xl bg-transparent border border-transparent shadow-none px-2 md:px-4'
          }
        `}
      >
        {/* LOGO AREA */}
        <div className="flex items-center gap-3 shrink-0 z-20">
            <div className={`
              flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-500 w-9 h-9
              ${scrolled ? 'scale-90' : 'scale-100'}
            `}>
                <Zap className="w-4 h-4 fill-current" />
            </div>

            <div className={`
                overflow-hidden transition-[max-width,opacity,transform] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] origin-left
                ${scrolled ? 'max-w-0 opacity-0 scale-90' : 'max-w-[120px] opacity-100 scale-100'}
            `}>
                <span className="font-semibold tracking-tight text-foreground text-lg whitespace-nowrap">
                    CepatUsaha
                </span>
            </div>
        </div>

        {/* CENTER LINKS */}
        <div className={`
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            hidden md:flex items-center
            transition-all duration-500 ease-out
            ${scrolled ? 'gap-0.5' : 'gap-2'}
        `}>
            {navLinks.map((link) => (
                <a
                    key={link.label}
                    href={link.href}
                    className={`
                        rounded-full font-medium transition-all duration-200
                        text-muted-foreground hover:text-primary hover:bg-muted/60
                        flex items-center justify-center
                        ${scrolled ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
                    `}
                >
                    {link.label}
                </a>
            ))}
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2 shrink-0 z-20 ml-auto md:ml-0">
            {/* Signed Out State */}
            <SignedOut>
              <div className={`
                  hidden md:block overflow-hidden transition-[max-width,opacity] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
                  ${scrolled ? 'max-w-0 opacity-0' : 'max-w-[100px] opacity-100'}
              `}>
                  <SignInButton mode="modal">
                    <button type="button" className="text-sm font-medium text-muted-foreground hover:text-primary px-3 py-2 transition-colors whitespace-nowrap">
                        Masuk
                    </button>
                  </SignInButton>
              </div>

              <SignInButton mode="modal">
                <Button
                    variant="primary"
                    className={`
                        transition-all duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
                        whitespace-nowrap shadow-sm
                        ${scrolled
                          ? 'h-9 px-4 text-xs rounded-full bg-primary hover:bg-primary/90'
                          : 'h-10 px-5 text-sm rounded-lg'
                        }
                    `}
                >
                    {scrolled ? 'Buat' : 'Mulai Buat'}
                </Button>
              </SignInButton>
            </SignedOut>

            {/* Signed In State */}
            <SignedIn>
              <div className={`
                  hidden md:flex items-center overflow-hidden transition-[max-width,opacity] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
                  ${scrolled ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[120px] opacity-100'}
              `}>
                  <a
                    href="/workspace"
                    className="text-sm font-medium text-muted-foreground hover:text-primary px-3 py-2 transition-colors whitespace-nowrap"
                  >
                      Dashboard
                  </a>
              </div>

              <div className={`
                flex items-center gap-2
                ${scrolled ? 'scale-90' : 'scale-100'}
                transition-transform duration-500
              `}>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: scrolled ? 'w-8 h-8' : 'w-9 h-9'
                    }
                  }}
                />
              </div>
            </SignedIn>

            <button type="button" className="md:hidden p-2 text-foreground rounded-lg hover:bg-muted ml-1" aria-label="Menu">
                <Menu className="w-5 h-5" />
            </button>
        </div>
      </nav>
    </div>
  )
}
