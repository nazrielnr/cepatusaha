import React from 'react'
import { Zap } from 'lucide-react'

const LINKS = {
  columns: [
    {
      header: 'Platform',
      links: ['AI Builder', 'Templat', 'Integrasi', 'Enterprise']
    },
    {
      header: 'Sumber Daya',
      links: ['Dokumentasi', 'Referensi API', 'Showcase', 'Blog']
    },
    {
      header: 'Perusahaan',
      links: ['Tentang', 'Karir', 'Legal', 'Kontak']
    }
  ]
}

export const Footer: React.FC = () => {
  return (
    <footer className="bg-card text-foreground border-t border-border pt-20 pb-10 font-sans">
      <div className="max-w-6xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-20">
            {/* Brand Column */}
            <div className="md:col-span-4 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
                        <Zap className="w-3 h-3 fill-current" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">CepatUsaha</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                  Platform bertenaga AI untuk membangun website modern dan berkinerja tinggi dalam hitungan detik.
                </p>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 md:pl-20">
                {LINKS.columns.map((col, idx) => (
                  <div key={idx} className="flex flex-col gap-4">
                      <h4 className="font-semibold text-sm">{col.header}</h4>
                      <ul className="flex flex-col gap-3">
                          {col.links.map(link => (
                            <li key={link}>
                              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{link}</a>
                            </li>
                          ))}
                      </ul>
                  </div>
                ))}
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-4">
            <span className="text-sm text-muted-foreground">
              © 2024 CepatUsaha Inc.
            </span>

            <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
                <a href="#" className="hover:text-primary transition-colors">Privasi</a>
                <a href="#" className="hover:text-primary transition-colors">Ketentuan</a>
                <a href="#" className="hover:text-primary transition-colors">Keamanan</a>
            </div>
        </div>
      </div>
    </footer>
  )
}
