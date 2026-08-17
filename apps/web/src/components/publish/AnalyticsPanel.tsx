import type { AnalyticsSummary } from '@/types/analytics'

type AnalyticsPanelProps = {
  summary: AnalyticsSummary | null
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
}

export function AnalyticsPanel({ summary, loading, error, onRefresh }: AnalyticsPanelProps) {
  return (
    <section className="panel-section" aria-label="Analitik">
      <div className="panel-header">
        <div>
          <h2>Analitik Ringkas</h2>
          <p>Gambaran aktivitas publikasi Anda.</p>
        </div>
        <button type="button" className="secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Memuat…' : 'Segarkan'}
        </button>
      </div>

      {error && <p className="feedback error">{error}</p>}

      {loading && (
        <div className="panel-loading">
          <div className="inline-spinner" aria-hidden="true" />
          <span>Memuat analitik…</span>
        </div>
      )}

      {summary && (
        <ul className="analytics-grid">
          <li>
            <span className="analytics-label">Total Publikasi</span>
            <strong className="analytics-value">{summary.totalPublishes}</strong>
          </li>
          <li>
            <span className="analytics-label">Template tersedia</span>
            <strong className="analytics-value">{summary.totalTemplates}</strong>
          </li>
          <li>
            <span className="analytics-label">Publikasi terakhir</span>
            <strong className="analytics-value">
              {summary.lastPublishedAt ? new Date(summary.lastPublishedAt).toLocaleString() : '-'}
            </strong>
          </li>
          <li>
            <span className="analytics-label">URL terbaru</span>
            {summary.lastPublishedUrl ? (
              <a href={summary.lastPublishedUrl} target="_blank" rel="noreferrer">
                Buka halaman
              </a>
            ) : (
              <strong className="analytics-value">-</strong>
            )}
          </li>
        </ul>
      )}
    </section>
  )
}
