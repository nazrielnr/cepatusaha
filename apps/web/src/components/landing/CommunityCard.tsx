import React from 'react'
import { Heart, ArrowUpRight } from 'lucide-react'

export interface CommunityProject {
  title: string
  author: string
  domain: string
  type: string
  likes: string
  image: string
}

interface CommunityCardProps {
  project: CommunityProject
  onClick?: () => void
}

export function CommunityCard({ project, onClick }: CommunityCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col h-[240px] bg-card rounded-xl border border-border transition-all duration-300 cursor-pointer"
    >
      {/* Thumbnail Section */}
      <div className="w-full h-[140px] bg-muted relative overflow-hidden border-b border-border rounded-t-[11px]">
        <img
          src={project.image}
          alt={`${project.title} - ${project.type} website preview`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700"
        />

        {/* Likes Pill */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/90 backdrop-blur shadow-sm border border-border text-[9px] font-semibold text-muted-foreground select-none z-10">
          <Heart className="w-2.5 h-2.5 text-destructive fill-destructive" />
          <span>{project.likes}</span>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-4 flex flex-col justify-between flex-1 min-h-0">
        <div className="flex items-start justify-between mb-1 relative">
          <h3
            className="font-semibold text-sm text-foreground truncate pr-2 flex-1 group-hover:text-primary transition-colors"
            title={project.title}
          >
            {project.title}
          </h3>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>

        <div className="pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground/60">
          <span>{project.type}</span>
          <span className="font-medium">oleh {project.author}</span>
        </div>
      </div>
    </div>
  )
}

