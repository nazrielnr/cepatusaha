import type { RefObject } from 'react'

export type PreviewStyleEditContext = {
  iframeRef: RefObject<HTMLIFrameElement | null>
  previewHtml?: string
  onHtmlUpdate?: (html: string) => void
}

export type FontChange = {
  headingFont?: string
  headingWeight?: string
  headingSpacing?: string
  bodyFont?: string
  bodyWeight?: string
  bodySpacing?: string
}

export type ColorChange = {
  mode?: 'light' | 'dark'
  theme?: string
  colors?: Record<string, string>
}

export type AssetChange = {
  action: 'replace' | 'remove' | 'add'
  assetId: string
  newUrl?: string
}
