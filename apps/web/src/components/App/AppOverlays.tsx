import { AnalyticsPanel } from '@/components/publish/AnalyticsPanel'
import { ProductAssetUploader } from '@/components/publish/ProductAssetUploader'
import { PublicationHistory } from '@/components/publish/PublicationHistory'

type OverlayType = 'history' | 'analytics' | 'assets' | null

type AppOverlaysProps = {
  activeOverlay: OverlayType
  setActiveOverlay: (overlay: OverlayType) => void
  appState: any
  userId?: string
  getToken: () => Promise<string | null>
}

export function AppOverlays({ activeOverlay, setActiveOverlay, appState, userId, getToken }: AppOverlaysProps) {
  if (!activeOverlay) return null

  switch (activeOverlay) {
    case 'history':
      return (
        <PublicationHistory
          records={appState.historyState.data ?? []}
          loading={appState.historyState.loading}
          error={appState.historyState.error}
          onRefresh={appState.refreshHistory}
          onClose={() => setActiveOverlay(null)}
          onDelete={appState.handleDeletePublication}
        />
      )
    case 'analytics':
      return (
        <AnalyticsPanel
          summary={appState.analyticsState.data}
          loading={appState.analyticsState.loading}
          error={appState.analyticsState.error}
          onRefresh={appState.refreshAnalytics}
        />
      )
    case 'assets':
      return userId
        ? <ProductAssetUploader userId={userId} getToken={getToken} />
        : <p className="text-sm text-muted-foreground">Masuk terlebih dahulu untuk mengunggah aset.</p>
    default:
      return null
  }
}
