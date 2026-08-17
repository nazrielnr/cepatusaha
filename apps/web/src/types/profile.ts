export type SocialLinks = {
  instagram?: string
  facebook?: string
  tiktok?: string
  website?: string
}

export type Profile = {
  businessName: string
  email: string
  whatsapp?: string
  socialLinks: SocialLinks
  description: string
  category: string
}
