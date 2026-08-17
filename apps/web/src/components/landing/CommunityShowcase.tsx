import React, { useState } from 'react'
import { Heart } from 'lucide-react'
import { CommunityCard } from './CommunityCard'
import { Modal } from '../Modal'

const PROJECTS = [
  {
    title: 'Neon Sushi Bar',
    author: 'Kai.Design',
    domain: 'neon-sushi.ai',
    type: 'Restoran',
    likes: '1.2k',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop'
  },
  {
    title: 'Zenith Fitness',
    author: 'Sarah_Moves',
    domain: 'zenith-fit.app',
    type: 'Landing Page',
    likes: '892',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop'
  },
  {
    title: 'Orbit SaaS',
    author: 'TechGuru',
    domain: 'orbit.cepathusaha.ai',
    type: 'SaaS',
    likes: '2.1k',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop'
  },
  {
    title: 'Lumiere Photo',
    author: 'LensMaster',
    domain: 'lumiere.gallery',
    type: 'Portofolio',
    likes: '650',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=400&auto=format&fit=crop'
  },
  {
    title: 'Rustic Coffee',
    author: 'BrewMaster',
    domain: 'rustic-coffee.ai',
    type: 'Kafe',
    likes: '945',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=400&auto=format&fit=crop'
  },
  {
    title: 'Apex Landing',
    author: 'Studio_Apex',
    domain: 'apex-temp.app',
    type: 'Landing Page',
    likes: '712',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop'
  },
  {
    title: 'Vivid Portfolio',
    author: 'Creative_Vivid',
    domain: 'vivid-arts.site',
    type: 'Portofolio',
    likes: '1.5k',
    image: 'https://images.unsplash.com/photo-1487017159436-69f706798071?q=80&w=400&auto=format&fit=crop'
  },
  {
    title: 'Nova Logistics',
    author: 'LogiGlobal',
    domain: 'nova-transport.com',
    type: 'Perusahaan',
    likes: '530',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=400&auto=format&fit=crop'
  }
]

export const CommunityShowcase: React.FC = () => {
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const displayedProjects = PROJECTS.slice(0, 4)

  return (
    <section className="w-full bg-background py-24 border-t border-border relative overflow-hidden">

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase mb-2 block">Komunitas</span>
            <h2 className="text-3xl md:text-4xl font-sans font-bold text-foreground mb-3 tracking-tight">
              Galeri Karya Komunitas
            </h2>
            <p className="text-muted-foreground text-base md:text-lg font-light leading-relaxed">
              Jelajahi berbagai kreasi situs web unik, modern, dan fungsional yang dibangun oleh para pengguna CepatUsaha.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsGalleryModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-300 shadow-sm flex items-center gap-1"
          >
            Lihat Semua ({PROJECTS.length})
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6">
          {displayedProjects.map((project, index) => (
            <CommunityCard project={project} key={index} />
          ))}
        </div>

        {/* Community Gallery Modal */}
        <Modal
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          title="Galeri Komunitas"
        >
          <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {PROJECTS.map((project, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-card hover:bg-muted rounded-xl border border-border transition-all group"
              >
                {/* Left Info: Thumbnail, Title, Author */}
                <div className="flex items-center min-w-0">
                  <div className="w-14 h-9 rounded-lg overflow-hidden relative border border-border flex-shrink-0">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                  <div className="ml-3 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors" title={project.title}>
                      {project.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      oleh {project.author} • {project.type} • {project.domain}
                    </p>
                  </div>
                </div>

                {/* Right Info: Likes & Visit Link */}
                <div className="flex items-center gap-2 ml-4">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium mr-1 select-none">
                    <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" />
                    <span>{project.likes}</span>
                  </div>
                  <a
                    href={`https://${project.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted border border-border text-muted-foreground hover:text-primary transition-all shadow-sm"
                  >
                    Kunjungi
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Modal>

      </div>
    </section>
  )
}
