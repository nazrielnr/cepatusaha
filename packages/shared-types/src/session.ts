/**
 * Session and Project Types
 * Types for session management and project data
 */

import type { ChatMessage, ChatMode } from './chat';

/**
 * Social links for business profile
 */
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
}

/**
 * Business profile
 */
export interface Profile {
  businessName: string;
  email: string;
  whatsapp?: string;
  socialLinks: SocialLinks;
  description: string;
  category: string;
}

/**
 * Layout section for website builder
 */
export interface LayoutSection {
  type: 'hero' | 'features' | 'about' | 'cta' | 'testimonial' | 'contact' | string;
  heading?: string;
  subheading?: string;
  body?: string;
  highlights?: string[];
  image?: string;
  actions?: Array<{ label: string; href?: string }>;
}

/**
 * Layout blueprint for website structure
 */
export interface LayoutBlueprint {
  theme: {
    accentColor: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  };
  sections: LayoutSection[];
}

/**
 * Generated copy from AI
 */
export interface GeneratedCopy {
  slogan: string;
  summary: string;
  highlights: string[];
  cta: {
    heading: string;
    body: string;
    button: string;
  };
}

/**
 * Preview response
 */
export interface PreviewResponse {
  html: string;
  generatedCopy: GeneratedCopy;
  layoutBlueprint: LayoutBlueprint | null;
}

/**
 * Publish response
 */
export interface PublishResponse {
  success: boolean;
  publicUrl?: string;
  vercelUrl?: string | null;
  vercelDeploymentId?: string | null;
  fallbackUrl?: string;
  publishedAt?: string;
  slug?: string;
  layoutBlueprint?: LayoutBlueprint;
  deploymentError?: string | null;
  deploymentStatus?: 'vercel_success' | 'vercel_failed_fallback_success' | 'failed';
}

/**
 * Publication record
 */
export interface PublicationRecord {
  id: string;
  publicUrl: string;
  status: string;
  publishedAt: string | null;
  slug: string | null;
  layoutBlueprint: LayoutBlueprint | null;
  sessionId: string | null;
  sessionTitle: string | null;
}

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  totalPublishes: number;
  lastPublishedAt: string | null;
  lastPublishedUrl: string | null;
  totalTemplates: number;
}

/**
 * Conversation step
 */
export type ConversationStep =
  | 'idle'
  | 'intro'
  | 'profile'
  | 'preferences'
  | 'confirmation'
  | 'previewing'
  | 'editing'
  | 'completed';

/**
 * Session mode entry
 */
export interface SessionModeEntry {
  mode: ChatMode;
  note?: string;
  at?: string;
}

/**
 * Session status
 */
export type SessionStatus = 'active' | 'completed' | 'abandoned';

/**
 * Session data
 */
export interface SessionData {
  id: string;
  title: string;
  messages: ChatMessage[];
  conversationStep: ConversationStep;
  profileDraft: Profile;
  layoutBlueprint: LayoutBlueprint | null;
  createdAt: string;
  updatedAt: string;
  lastPreview?: PreviewResponse | null;
  status: SessionStatus;
  modeHistory?: SessionModeEntry[];
  lastGeneratedCopy?: GeneratedCopy | null;
  previewThumbnail?: string;
}

/**
 * Session summary
 */
export interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: SessionStatus;
  conversationStep: ConversationStep;
  previewThumbnail?: string;
}

/**
 * Image upload source
 */
export type ImageUploadSource = 'url' | 'upload';

/**
 * Image update payload
 */
export interface ImageUpdatePayload {
  sessionId: string;
  elementPath: string;
  imageUrl: string;
  source: ImageUploadSource;
}
