/**
 * Planning Mode TypeScript Types
 *
 * Shared types for planning data across frontend and backend.
 */

/**
 * Question types for gather_requirements form
 */
export interface PlanningQuestion {
  id: string
  question: string
  type: 'single_choice' | 'multiple_choice' | 'text'
  options?: string[]
  required?: boolean
}

/**
 * Data structure from gather_requirements tool
 */
export interface RequirementsFormData {
  business_category: string
  business_name?: string
  suggested_templates: string[]
  questions: PlanningQuestion[]
}

/**
 * User's answers to the requirements form
 */
export interface RequirementsAnswers {
  business_name?: string
  selected_template: string
  answers?: Record<string, string | string[]>
  skip_planning?: boolean
}

/**
 * PRD (Product Requirements Document) data
 */
export interface PRDData {
  executive_summary: string
  goals: string[]
  features: {
    name: string
    description: string
    priority: 'must_have' | 'nice_to_have'
  }[]
  user_stories: string[]
}

/**
 * Sitemap page structure
 */
export interface SitemapPage {
  name: string
  path: string
  sections: string[]
  sub_pages?: string[]
}

/**
 * Design Brief data
 */
export interface DesignBrief {
  mood: string
  color_palette: {
    name: string
    hex: string
    usage: string
  }[]
  typography: {
    heading_font: string
    body_font: string
  }
  inspiration_keywords: string[]
}

/**
 * Page-specific SEO data
 */
export interface PageSEO {
  page: string
  title: string
  description: string
  h1: string
  target_keywords: string[]
}

/**
 * Local SEO data for local businesses
 */
export interface LocalSEO {
  business_name: string
  address: string
  city: string
  phone: string
  business_hours: string
  google_maps_embed: boolean
}

/**
 * Schema.org structured data settings
 */
export interface StructuredDataSettings {
  type: 'LocalBusiness' | 'Organization' | 'Product' | 'Service'
  include_breadcrumbs: boolean
  include_faq: boolean
}

/**
 * Complete SEO Plan
 */
export interface SEOPlan {
  primary_keywords: string[]
  secondary_keywords: string[]
  meta_title_template: string
  meta_description_template: string
  page_seo: PageSEO[]
  local_seo?: LocalSEO
  structured_data: StructuredDataSettings
}

/**
 * Business information
 */
export interface BusinessInfo {
  name: string
  category: string
  tagline?: string
  target_audience: string[]
}

/**
 * Complete Planning Data from generate_planning_docs
 */
export interface PlanningData {
  business_info: BusinessInfo
  selected_template: string
  selected_features: string[]
  prd: PRDData
  sitemap: { pages: SitemapPage[] }
  design_brief: DesignBrief
  seo_plan: SEOPlan
}

/**
 * Execute plan modifications
 */
export interface PlanModifications {
  add_features?: string[]
  remove_features?: string[]
  color_changes?: Record<string, string>
  other_changes?: string
}

/**
 * Planning phase for UI state
 */
export type PlanningUIPhase = 'idle' | 'form' | 'review' | 'executing'

/**
 * Planning store state (for Zustand)
 */
export interface PlanningStoreState {
  // State
  isPlanningMode: boolean
  planningPhase: PlanningUIPhase
  requirementsData: RequirementsFormData | null
  planningData: PlanningData | null
  userAnswers: RequirementsAnswers | null
  activePlanningTab: 'prd' | 'sitemap' | 'design' | 'seo'

  // Actions
  startPlanning: () => void
  setRequirements: (data: RequirementsFormData) => void
  setUserAnswers: (answers: RequirementsAnswers) => void
  setPlanningDocs: (data: PlanningData) => void
  setActiveTab: (tab: 'prd' | 'sitemap' | 'design' | 'seo') => void
  executePlan: () => void
  resetPlanning: () => void
  skipPlanning: () => void
}
