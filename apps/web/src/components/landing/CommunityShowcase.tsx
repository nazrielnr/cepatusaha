import React, { useState, useMemo } from 'react'
import { Heart, ArrowUpRight, Search, User, Layers } from 'lucide-react'
import { CommunityCard, type CommunityProject } from './CommunityCard'
import { Modal } from '../Modal'
import { cn } from '@/lib/utils'

const PROJECTS: CommunityProject[] = [
  {
    title: 'Neon Sushi Bar',
    author: 'Kai.Design',
    domain: 'neon-sushi.ai',
    type: 'Restoran',
    likes: '1.2k',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'Zenith Fitness',
    author: 'Sarah_Moves',
    domain: 'zenith-fit.app',
    type: 'Landing Page',
    likes: '892',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'Orbit SaaS',
    author: 'TechGuru',
    domain: 'orbit.cepathusaha.ai',
    type: 'SaaS',
    likes: '2.1k',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'Lumiere Photo',
    author: 'LensMaster',
    domain: 'lumiere.gallery',
    type: 'Portofolio',
    likes: '650',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'Rustic Coffee',
    author: 'BrewMaster',
    domain: 'rustic-coffee.ai',
    type: 'Kafe',
    likes: '945',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'Apex Landing',
    author: 'Studio_Apex',
    domain: 'apex-temp.app',
    type: 'Landing Page',
    likes: '712',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'Vivid Portfolio',
    author: 'Creative_Vivid',
    domain: 'vivid-arts.site',
    type: 'Portofolio',
    likes: '1.5k',
    image: 'https://images.unsplash.com/photo-1487017159436-69f706798071?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'Nova Logistics',
    author: 'LogiGlobal',
    domain: 'nova-transport.com',
    type: 'Perusahaan',
    likes: '530',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop'
  }
]

const CATEGORIES = ['Semua', 'Restoran', 'Landing Page', 'SaaS', 'Portofolio', 'Kafe', 'Perusahaan']

export const CommunityShowcase: React.FC = () => {
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [modalSearch, setModalSearch] = useState('')
  const [modalCategory, setModalCategory] = useState('Semua')

  // Filtered projects for the main landing page showcase
  const displayedProjects = useMemo(() => {
    if (activeCategory === 'Semua') {
      return PROJECTS.slice(0, 4)
    }
    const filtered = PROJECTS.filter((p) => p.type.toLowerCase() === activeCategory.toLowerCase())
    return filtered.length > 0 ? filtered : PROJECTS.slice(0, 4)
  }, [activeCategory])

  // Filtered projects for the modal gallery
  const modalFilteredProjects = useMemo(() => {
    return PROJECTS.filter((project) => {
      const matchCat = modalCategory === 'Semua' || project.type.toLowerCase() === modalCategory.toLowerCase()
      const matchSearch =
        modalSearch.trim() === '' ||
        project.title.toLowerCase().includes(modalSearch.toLowerCase()) ||
        project.author.toLowerCase().includes(modalSearch.toLowerCase()) ||
        project.domain.toLowerCase().includes(modalSearch.toLowerCase()) ||
        project.type.toLowerCase().includes(modalSearch.toLowerCase())
      return matchCat && matchSearch
    })
  }, [modalCategory, modalSearch])

  return (
    <section className="w-full py-12 sm:py-16 px-4 md:px-12 bg-background border-b border-border relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-sans font-bold text-foreground mb-2 tracking-tight">
              Galeri Karya Komunitas
            </h2>
            <p className="text-muted-foreground text-sm md:text-base font-light leading-relaxed">
              Jelajahi berbagai kreasi situs web unik, modern, dan fungsional yang dibangun oleh para pengguna CepatUsaha.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsGalleryModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-300 shadow-xs flex items-center gap-1.5 self-start md:self-auto shrink-0 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <span className="font-mono">({PROJECTS.length})</span>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedProjects.map((project, index) => (
            <CommunityCard
              project={project}
              key={index}
              onClick={() => window.open(`https://${project.domain}`, '_blank', 'noopener,noreferrer')}
            />
          ))}
        </div>

        {/* Bottom Info Banner */}
        <div className="mt-8 sm:mt-10 p-4 sm:p-5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Ingin karya situs web Anda tampil di sini?</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Buat proyek situs web Anda dan publikasikan ke domain publik.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            Mulai Buat Website
          </button>
        </div>

        {/* Community Gallery Full Modal */}
        <Modal
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          title="Galeri Karya Komunitas"
        >
          <div className="p-5 flex flex-col gap-4">
            {/* Modal Controls: Search & Category Chips */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Cari kreasi, pembuat, atau kategori..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-muted/50 border border-border/80 focus:bg-background focus:border-primary text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {['Semua', 'Restoran', 'SaaS', 'Portofolio', 'Kafe'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setModalCategory(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border',
                      modalCategory === cat
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Project Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {modalFilteredProjects.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                  Tidak ada karya yang sesuai dengan pencarian "{modalSearch}".
                </div>
              ) : (
                modalFilteredProjects.map((project, index) => (
                  <div
                    key={index}
                    className="flex flex-col justify-between p-3 bg-card hover:bg-muted/40 rounded-xl border border-border/80 transition-all group gap-3"
                  >
                    {/* Thumbnail & Title */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-20 h-14 rounded-lg overflow-hidden relative border border-border/80 shrink-0 bg-muted">
                        <img
                          src={project.image}
                          alt={project.title}
                          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors" title={project.title}>
                            {project.title}
                          </h4>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 shrink-0">
                            {project.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                          {project.domain}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" /> oleh {project.author}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium select-none">
                        <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" />
                        <span>{project.likes} disukai</span>
                      </div>
                      <a
                        href={`https://${project.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
                      >
                        Kunjungi <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      </div>
    </section>
  )
}
