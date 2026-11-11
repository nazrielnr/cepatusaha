import { useState, type ReactNode } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { ChevronRight, Crown, Loader2, LogOut, RotateCw, ShieldCheck, Sparkles, Tag, Zap } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PricingModal } from '@/components/landing/PricingModal'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/utils'

/** Date of the next monthly quota reset (1st of next month). */
const nextResetLabel = (key?: string): string => {
  if (!key) return 'bulan depan'
  const year = Number(key.slice(0, 4))
  const month = Number(key.slice(5, 7)) // 1-12
  if (isNaN(year) || isNaN(month)) return 'bulan depan'
  return new Date(year, month, 1).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const num = (n: number): string => n.toLocaleString('id-ID')

/** 200000 -> "200 rb", 2000000 -> "2 jt" */
const compact = (n: number): string =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
    : n >= 1_000
    ? `${(n / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} rb`
    : num(n)

type UsageMenuProps = {
  /** Custom trigger — defaults to the user avatar. */
  trigger?: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

/** Profile dropdown: identity, monthly token quota, pricing and sign out. */
export function UsageMenu({ trigger, align = 'end', className }: UsageMenuProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { plan, loading, error, refresh } = usePlan()
  const [pricingOpen, setPricingOpen] = useState(false)

  const initials = (
    user?.firstName?.[0] ||
    user?.username?.[0] ||
    user?.emailAddresses?.[0]?.emailAddress?.[0] ||
    '?'
  ).toUpperCase()

  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''
  const isUnlimited = Boolean(plan?.isUnlimited)
  const isPro = plan?.plan === 'pro'
  const planLabel = isUnlimited ? 'Super Admin' : isPro ? 'Pro' : 'Starter'

  const used = plan?.monthUsedTokens ?? 0
  const limit = plan?.monthLimitTokens ?? 1
  const pct = isUnlimited ? 0 : Math.min(100, Math.max(0, Math.round((used / limit) * 100)))
  const tone: 'ok' | 'warn' | 'exhausted' = plan?.exhausted ? 'exhausted' : pct >= 80 ? 'warn' : 'ok'
  const showUpgrade = !isUnlimited && !isPro

  const barColor = tone === 'exhausted' ? 'bg-red-500' : tone === 'warn' ? 'bg-amber-500' : 'bg-primary'

  return (
    <>
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
                <AvatarFallback className="bg-muted text-foreground font-semibold text-xs">{initials}</AvatarFallback>
              </Avatar>
              {(isUnlimited || isPro) && (
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background text-white',
                    isUnlimited ? 'bg-foreground' : 'bg-amber-500'
                  )}
                >
                  {isUnlimited ? <ShieldCheck className="h-2.5 w-2.5" /> : <Crown className="h-2.5 w-2.5" />}
                </span>
              )}
            </button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          sideOffset={10}
          className="w-[300px] overflow-hidden rounded-2xl border border-border bg-popover p-0 shadow-xl shadow-black/10"
        >
          {/* Identity */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <Avatar className="h-11 w-11 shrink-0">
              {user?.imageUrl ? <AvatarImage src={user.imageUrl} alt={email} className="object-cover" /> : null}
              <AvatarFallback className="bg-muted text-foreground font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">
                {user?.fullName || user?.username || 'Pengguna'}
              </p>
              <p className="truncate text-xs text-muted-foreground mt-0.5" title={email}>
                {email}
              </p>
            </div>
          </div>

          {/* Quota */}
          <div className="px-4 pb-4">
            {loading && !plan ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/50 py-6 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat kuota…
              </div>
            ) : plan ? (
              <div className="rounded-xl bg-muted/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {isUnlimited ? <ShieldCheck className="h-3 w-3" /> : isPro ? <Crown className="h-3 w-3 text-amber-500" /> : <Zap className="h-3 w-3" />}
                    Paket {planLabel}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void refresh()
                    }}
                    disabled={loading}
                    title="Segarkan kuota"
                    aria-label="Segarkan kuota"
                    className="-mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw className={cn('h-3 w-3', loading && 'animate-spin')} />
                  </button>
                </div>

                {isUnlimited ? (
                  <p className="mt-2 text-sm font-medium text-foreground">Token tanpa batas</p>
                ) : (
                  <>
                    <p className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{compact(used)}</span>
                      <span className="text-xs text-muted-foreground">/ {compact(limit)} token</span>
                    </p>
                    <div
                      className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
                    </div>
                    <p className={cn('mt-2 text-[11px]', tone === 'exhausted' ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                      {tone === 'exhausted'
                        ? `Kuota habis · reset ${nextResetLabel(plan.periodKey)}`
                        : `${compact(plan.monthRemainingTokens)} sisa · reset ${nextResetLabel(plan.periodKey)}`}
                    </p>
                  </>
                )}
                {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
              </div>
            ) : null}
          </div>

          <DropdownMenuSeparator className="m-0" />

          {/* Actions */}
          <div className="p-1.5">
            {showUpgrade && (
              <DropdownMenuItem
                onSelect={() => setPricingOpen(true)}
                className="mb-1 flex cursor-pointer items-center gap-2.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
              >
                <Sparkles className="h-4 w-4" />
                <span className="flex-1">Upgrade ke Pro</span>
                <ChevronRight className="h-4 w-4 opacity-70" />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() => setPricingOpen(true)}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground"
            >
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">Paket & harga</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void signOut()}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  )
}
