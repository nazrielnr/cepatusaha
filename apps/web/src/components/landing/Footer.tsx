import React from 'react'
import { Zap, Heart, Github, Twitter, Linkedin, Instagram, Dribbble, Globe, MessageSquare } from 'lucide-react'

const FOOTER_COLUMNS = [
  {
    title: 'PRODUCT',
    links: [
      { label: 'Overview', href: '#' },
      { label: 'Features', href: '#' },
      { label: 'Solutions', href: '#' },
      { label: 'Tutorials', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Releases', href: '#' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'News', href: '#' },
      { label: 'Media kit', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'RESOURCES',
    links: [
      { label: 'Blog', href: '#' },
      { label: 'Newsletter', href: '#' },
      { label: 'Events', href: '#' },
      { label: 'Help centre', href: '#' },
      { label: 'Tutorials', href: '#' },
      { label: 'Support', href: '#' },
    ],
  },
  {
    title: 'USE CASES',
    links: [
      { label: 'Startups', href: '#' },
      { label: 'Enterprise', href: '#' },
      { label: 'Government', href: '#' },
      { label: 'SaaS', href: '#' },
      { label: 'Marketplaces', href: '#' },
      { label: 'Ecommerce', href: '#' },
    ],
  },
  {
    title: 'SOCIAL',
    links: [
      { label: 'X (Twitter)', href: 'https://twitter.com' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
      { label: 'Facebook', href: 'https://facebook.com' },
      { label: 'GitHub', href: 'https://github.com' },
      { label: 'AngelList', href: '#' },
      { label: 'Dribbble', href: 'https://dribbble.com' },
    ],
  },
  {
    title: 'LEGAL',
    links: [
      { label: 'Terms', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Cookies', href: '#' },
      { label: 'Licenses', href: '#' },
      { label: 'Settings', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
]

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-background text-foreground font-sans">
      {/* Testimonial / Quote Section before footer */}
      <section className="w-full py-12 sm:py-16 px-4 md:px-12 border-b border-border bg-muted/20 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 select-none">
            <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-2xs">
              <Zap className="w-3 h-3 fill-current" />
            </div>
            <span className="font-bold text-base text-foreground tracking-tight">CepatUsaha</span>
          </div>

          {/* Big Quote */}
          <blockquote className="text-xl sm:text-3xl md:text-4xl font-sans font-semibold text-foreground tracking-tight leading-snug md:leading-normal mb-6 sm:mb-8 max-w-3xl px-2">
            “CepatUsaha menghemat ribuan jam kerja kami. Kami mampu membangun dan meluncurkan situs web 10x lebih cepat.”
          </blockquote>

          {/* Author Details */}
          <div className="flex flex-col items-center gap-1.5">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
              alt="Amélie Laurent"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-background shadow-xs mb-1"
              loading="lazy"
            />
            <div className="font-semibold text-sm text-foreground">Amélie Laurent</div>
            <div className="text-xs text-muted-foreground">Product Lead, cepatusaha.ai</div>
          </div>
        </div>
      </section>

      {/* Main Multi-Column Footer */}
      <section className="w-full pt-12 sm:pt-16 pb-0 px-4 md:px-12 relative overflow-hidden bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Top Brand Bar */}
          <div className="flex items-center gap-2.5 mb-8 sm:mb-12">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">CepatUsaha</span>
          </div>

          {/* 6 Columns Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-between gap-6 sm:gap-8 mb-12 sm:mb-16 w-full">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-3 min-w-[110px] md:min-w-0">
                <h4 className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                  {column.title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-xs text-foreground/80 hover:text-primary transition-colors font-medium"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Copyright & Social Icons Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-10 border-t border-border/60 gap-4 text-xs text-muted-foreground">
            <div>
              © 2026 CepatUsaha. All rights reserved.
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 text-muted-foreground">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors p-1"
                aria-label="X (Twitter)"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors p-1"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors p-1"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors p-1"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://dribbble.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors p-1"
                aria-label="Dribbble"
              >
                <Dribbble className="w-4 h-4" />
              </a>
              <a
                href="https://cepatusaha.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors p-1"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="hover:text-foreground transition-colors p-1"
                aria-label="Community / Messages"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </footer>
  )
}

