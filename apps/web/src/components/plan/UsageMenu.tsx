import type { ReactNode } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { Crown, Loader2, LogOut, Zap, RotateCw, Calendar, AlertCircle, Layers } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/utils'

/** Format date string for the upcoming monthly quota reset (start of next month). */
const nextResetLabel = (key?: string): string => {
  if (!key) return 'Bulan depan'
  const year = Number(key.slice(0, 4))
  const month = Number(key.slice(5, 7)) // 1-12
  if (isNaN(year) || isNaN(month)) return 'Bulan depan'
  // month parameter in Date constructor is 0-indexed, so passing `month` gives the 1st of the next month
  const nextMonthDate = new Date(year, month, 1)
  return nextMonthDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const num = (n: number): string => n.toLocaleString('id-ID')

type UsageMenuProps = {
  /** Custom trigger — defaults to the user avatar. */
  trigger?: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

/**
 * Reusable profile dropdown with plan badge and token usage breakdown.
 * Designed with a clean SaaS aesthetic, micro-interactions, and dark mode support.
 */
export function UsageMenu({ trigger, align = 'end', className }: UsageMenuProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { plan, loading, error, refresh } = usePlan()

  const initials = (
    user?.firstName?.[0] ||
    user?.username?.[0] ||
    user?.emailAddresses?.[0]?.emailAddress?.[0] ||
    '?'
  ).toUpperCase()

  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''
  const isPro = plan?.plan === 'pro'

  // Progress metrics calculation
  const used = plan?.monthUsedTokens ?? 0
  const limit = plan?.monthLimitTokens ?? 1
  const pct = Math.min(100, Math.max(0, Math.round((used / limit) * 100)))
  const tone = plan?.exhausted ? 'exhausted' : limit > 0 && plan && (plan.monthRemainingTokens / limit) < 0.2 ? 'warn' : 'normal'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            title="Akun & Kuota"
            className="group relative shrink-0 rounded-full outline-none ring-2 ring-background transition-all duration-200 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <Avatar className={cn('h-9 w-9 ring-1 ring-border/60 shadow-xs transition-transform duration-200 group-hover:scale-105', className)}>
              {user?.imageUrl ? <AvatarImage src={user.imageUrl} alt={email} className="object-cover" /> : null}
              <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-foreground font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background shadow-xs transition-transform duration-200 group-hover:scale-110',
                isPro ? 'bg-amber-500 text-white' : 'bg-primary text-primary-foreground'
              )}
            >
              {isPro ? <Crown className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5 fill-current" />}
            </span>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={8}
        className="w-80 sm:w-[340px] rounded-2xl border border-border/80 bg-popover/95 p-3.5 shadow-xl shadow-black/10 backdrop-blur-xl dark:bg-slate-900/95"
      >
        {/* User Identity Header */}
        <DropdownMenuLabel className="flex items-center gap-3 p-0 pb-1">
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 ring-1 ring-border shadow-xs">
              {user?.imageUrl ? <AvatarImage src={user.imageUrl} alt={email} className="object-cover" /> : null}
              <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-foreground font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isPro && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                <Crown className="h-2.5 w-2.5" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground tracking-tight leading-tight">
              {user?.fullName || user?.username || 'Pengguna'}
            </p>
            <p className="truncate text-xs text-muted-foreground mt-0.5" title={email}>
              {email}
            </p>
          </div>

          {plan && (
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 px-2 py-0.5 text-[11px] font-semibold gap-1 rounded-full capitalize shadow-2xs',
                isPro
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-muted/80 text-muted-foreground border-border/80'
              )}
            >
              {isPro ? <Crown className="h-3 w-3 fill-amber-500/20" /> : <Zap className="h-3 w-3 fill-current text-primary" />}
              {isPro ? 'Pro' : 'Free'}
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-2.5" />

        {/* Loading State */}
        {loading && !plan ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Memuat kuota token…</span>
          </div>
        ) : plan ? (
          <div className="space-y-2.5">
            {/* Error Notification if any */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">{error}</span>
              </div>
            )}

            {/* Token Usage Card */}
            <div className="rounded-xl border border-border/70 bg-muted/40 dark:bg-muted/15 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Zap className="h-3.5 w-3.5 text-primary fill-primary/20" />
                  <span>Kuota Token Bulanan</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'text-[11px] font-semibold px-1.5 py-0.5 rounded-md border shadow-2xs',
                      tone === 'exhausted'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                        : tone === 'warn'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-background text-muted-foreground border-border/60'
                    )}
                  >
                    {pct}%
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void refresh()
                    }}
                    disabled={loading}
                    title="Segarkan kuota"
                    className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-background/80 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw className={cn('h-3 w-3', loading && 'animate-spin')} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted-foreground/15 dark:bg-muted/40"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    tone === 'exhausted'
                      ? 'bg-red-500'
                      : tone === 'warn'
                      ? 'bg-amber-500'
                      : 'bg-primary'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Token Breakdown Numbers */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  <strong className="font-semibold text-foreground">{num(plan.monthUsedTokens)}</strong> / {num(plan.monthLimitTokens)}
                </span>
                <span
                  className={cn(
                    'font-medium',
                    tone === 'exhausted'
                      ? 'text-red-600 dark:text-red-400 font-semibold'
                      : 'text-muted-foreground'
                  )}
                >
                  {num(plan.monthRemainingTokens)} sisa
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 rounded-xl border border-border/60 bg-muted/20 dark:bg-muted/5 p-2.5">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-1">
                  <Calendar className="h-3 w-3 text-primary/70" />
                  <span>Reset kuota</span>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {nextResetLabel(plan.periodKey)}
                </p>
              </div>
            </div>

            {/* Exhausted Quota Banner */}
            {plan.exhausted && (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <p className="font-semibold">Kuota bulanan habis</p>
                  <p className="text-[11px] text-red-600/90 dark:text-red-400/90 mt-0.5">
                    Chat dibatasi sementara sampai reset tanggal {nextResetLabel(plan.periodKey)}.
                  </p>
                </div>
              </div>
            )}

            {/* Plan Info Badge / Pro Feature Hint */}
            {isPro && (
              <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-2.5">
                <div className="flex items-center gap-2 text-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Paket <strong className="text-foreground font-semibold">Pro Aktif</strong> · Kecepatan & prioritas tinggi
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <DropdownMenuSeparator className="my-2.5" />

        {/* Sign Out Action */}
        <DropdownMenuItem
          onSelect={() => void signOut()}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Keluar dari Akun</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
