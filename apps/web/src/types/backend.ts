export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  project_id: string | null
  started_at: string
  ended_at: string | null
  previewThumbnail?: string
}

export interface Asset {
  id: string
  project_id: string
  asset_type: string
  file_path: string
  storage_url: string
  context: string | null
  uploaded_at: string
}

export interface Publication {
  id: string
  project_id: string
  published_url: string
  published_at: string
  metadata: Record<string, any> | null
}

export interface AnalyticsEvent {
  id: string
  project_id: string | null
  user_id: string | null
  event_type: string
  detail: Record<string, any> | null
  timestamp: string
}
