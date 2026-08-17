export type LayoutSection = {
  type: 'hero' | 'features' | 'about' | 'cta' | 'testimonial' | 'contact' | string
  heading?: string
  subheading?: string
  body?: string
  highlights?: string[]
  image?: string
  actions?: Array<{ label: string; href?: string }>
}

export type LayoutBlueprint = {
  theme: {
    accentColor: string
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
  }
  sections: LayoutSection[]
}

export type GeneratedCopy = {
  slogan: string
  summary: string
  highlights: string[]
  cta: {
    heading: string
    body: string
    button: string
  }
}

export type PreviewResponse = {
  html: string
  generatedCopy: GeneratedCopy
  layoutBlueprint: LayoutBlueprint | null
}

export type File = {
  id: string
  project_id: string
  session_id: string | null
  file_path: string
  file_type: string
  content: string
  created_at: string
  updated_at: string
}

export type ImageUploadSource = 'url' | 'upload'

export type ImageUpdatePayload = {
  sessionId: string
  elementPath: string
  imageUrl: string
  source: ImageUploadSource
}
