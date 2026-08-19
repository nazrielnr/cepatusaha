import { AlertCircle, Loader2, RotateCw, Zap } from 'lucide-react'
import { usePlan, nextResetLabel } from '@/hooks/usePlan'

const num = (n: number): string => n.toLocaleString('id-ID')

/**
 * Quota limit card shown in the chat when the monthly token quota is exhausted.
 * Matches the UsageMenu quota styling: red tone, progress bar, reset date.
 */
export function LimitReached() {
  const { plan, loading, refresh } = usePlan()

  const used = plan?.monthUsedTokens ?? 0
  const limit = plan?.monthLimitTokens ?? 1
  const pct = Math.min(100, Math.max(0, Math.round((used / limit) * 100)))

  return (
    <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 p-4 shadow-sm animate-enter">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
          <Zap className="h-4 w-4 fill-current" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground tracking-tight">Kuota token bulanan habis</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Chat dibatasi sementara sampai reset tanggal {plan?.periodKey ? nextResetLabel(plan.periodKey) : 'bulan depan'}.
          </p>
        </div>
      </div>

      {loading && !plan ? (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span>Memuat kuota token…</span>
        </div>
      ) : plan ? (
        <div className="mt-3 space-y-2">
          {plan.exhausted && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Semua token bulan ini sudah terpakai.</span>
            </div>
          )}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-red-500/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              <strong className="font-semibold text-foreground">{num(used)}</strong> / {num(limit)} token
            </span>
            <span className="font-medium text-red-600 dark:text-red-400">{num(plan.monthRemainingTokens)} sisa</span>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-red-500/15 pt-2.5">
        <p className="text-[11px] text-muted-foreground">
          Upgrade ke <strong className="font-semibold text-foreground">Pro</strong> untuk kuota lebih besar & prioritas tinggi.
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          title="Segarkan kuota"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-red-500/10 hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RotateCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
        </button>
      </div>
    </div>
  )
}
