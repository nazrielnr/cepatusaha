import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useSignIn, useSignUp, useAuth } from '@clerk/clerk-react'
import {
  Zap,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Code2,
  Clock,
  Layers,
  PanelLeftClose,
  MousePointerClick,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  Send,
  ChevronLeft,
  Check,
  Globe,
  LayoutGrid,
} from 'lucide-react'

/* ---------------------------------- utils ---------------------------------- */

function clerkErrorMessage(err: unknown): string {
  const anyErr = err as { errors?: { longMessage?: string; message?: string }[] }
  return (
    anyErr?.errors?.[0]?.longMessage ??
    anyErr?.errors?.[0]?.message ??
    'Terjadi kesalahan. Silakan coba lagi.'
  )
}

/* ------------------------------- small pieces ------------------------------ */

function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
        <Zap className="h-4 w-4 fill-current" />
      </div>
      <span className="text-base font-bold tracking-tight text-foreground">CepatUsaha</span>
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-foreground">{label}</span>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  )
}

function GoogleButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground shadow-2xs transition-all hover:bg-muted hover:border-muted-foreground/30 disabled:opacity-60 cursor-pointer"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
      <span>{loading ? 'Menghubungkan…' : 'Lanjutkan dengan Google'}</span>
    </button>
  )
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border/80" />
      <span className="text-xs font-medium text-muted-foreground/80">atau lanjutkan dengan email</span>
      <span className="h-px flex-1 bg-border/80" />
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-xl border border-border bg-background pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none'

/* ---------------------------------- forms ---------------------------------- */

function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded || !signIn) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email.trim(), password })
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(clerkErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (err) {
      setError(clerkErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <GoogleButton onClick={handleGoogle} loading={loading} />
      <Divider />

      <Field label="Email" icon={<Mail className="h-4 w-4" />}>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@perusahaan.com"
          className={inputClass}
        />
      </Field>

      <Field label="Kata Sandi" icon={<Lock className="h-4 w-4" />}>
        <input
          type={showPw ? 'text' : 'password'}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan kata sandi"
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          className="absolute right-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>Masuk ke Akun</span>
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  )
}

function SignUpForm({ onRequireVerification }: { onRequireVerification: () => void }) {
  const { isLoaded, signUp, setActive } = useSignUp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded || !signUp) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
        ...(name.trim() ? { firstName: name.trim() } : {}),
      })
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        navigate('/', { replace: true })
        return
      }
      if (result.verifications?.emailAddress?.status === 'unverified') {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        onRequireVerification()
        return
      }
      setError('Pendaftaran belum selesai. Silakan periksa kembali data Anda.')
    } catch (err) {
      setError(clerkErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (err) {
      setError(clerkErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <GoogleButton onClick={handleGoogle} loading={loading} />
      <Divider />

      <Field label="Nama Lengkap" icon={<User className="h-4 w-4" />}>
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda atau bisnis Anda"
          className={inputClass}
        />
      </Field>

      <Field label="Email" icon={<Mail className="h-4 w-4" />}>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@perusahaan.com"
          className={inputClass}
        />
      </Field>

      <Field label="Kata Sandi" icon={<Lock className="h-4 w-4" />}>
        <input
          type={showPw ? 'text' : 'password'}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          className="absolute right-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>Buat Akun Gratis</span>
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  )
}

function VerifyEmailForm({ onBack }: { onBack: () => void }) {
  const { isLoaded, signUp, setActive } = useSignUp()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded || !signUp) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() })
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        navigate('/', { replace: true })
        return
      }
      setError('Kode verifikasi tidak cocok. Silakan coba lagi.')
    } catch (err) {
      setError(clerkErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-foreground">
          Kode Verifikasi (6 Digit)
        </label>
        <input
          type="text"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="h-12 w-full text-center tracking-[0.5em] font-mono text-lg font-bold rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
        />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Kami telah mengirimkan 6 digit kode ke email Anda. Periksa kotak masuk atau folder spam.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || code.length < 6}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>Verifikasi & Lanjutkan</span>
      </button>

      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer pt-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Ubah email atau kata sandi
      </button>
    </form>
  )
}

/* ---------------------------------- right visual 70% ---------------------------------- */

function RightShowcase() {
  return (
    <div className="relative hidden md:flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] dark:from-[#090b10] dark:via-[#0e111a] dark:to-[#161a26] border-l border-border">
      {/* Background Soft Atmospheric Glows */}
      <div className="absolute -top-20 -right-20 w-[450px] h-[450px] bg-primary/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-sky-500/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Workspace Canvas (Centered with balanced padding on all sides) */}
      <div className="absolute inset-0 p-8 lg:p-10 pb-0 flex flex-col pointer-events-none select-none overflow-hidden">
        <div className="w-full h-full rounded-2xl border border-slate-200/90 dark:border-border/80 bg-white dark:bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
          {/* Workspace Body: 2 Split Panels (Left: ChatPanel ~40%, Right: PreviewPanel ~60%) */}
          <div className="flex-1 grid grid-cols-12 overflow-hidden bg-white dark:bg-card">
            {/* ----------------- LEFT SPLIT: ChatPanel (5 cols / ~40%) ----------------- */}
            <div className="col-span-5 border-r border-slate-200/80 dark:border-border/60 flex flex-col justify-between bg-white dark:bg-card overflow-hidden">
              {/* Chat Panel Header */}
              <div className="h-12 xl:h-14 px-3 xl:px-4 border-b border-slate-200/80 dark:border-border/60 flex items-center justify-between bg-white dark:bg-card shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 xl:w-7 xl:h-7 rounded-lg bg-slate-100 dark:bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <ChevronLeft className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                  </div>
                  <span className="text-[11px] xl:text-xs font-bold text-foreground leading-tight truncate">Atelier Kroma — Flagship</span>
                </div>
                <div className="text-muted-foreground shrink-0 ml-1">
                  <PanelLeftClose className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                </div>
              </div>

              {/* Chat Turns Message List (Exact CepatUsaha styling: Generous spacing & authentic typography) */}
              <div className="flex-1 p-4 xl:p-5 space-y-6 overflow-hidden flex flex-col justify-start">
                {/* === TURN 1 === */}
                <div className="space-y-3">
                  {/* User Message Bubble (Exact CepatUsaha MessageBubble) */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-[12.5px] leading-relaxed text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
                      Buatkan website brand kopi artisan Atelier Kroma lengkap dengan katalog single origin, galeri peralatan seduh, dan sistem pre-order bakery.
                    </div>
                  </div>

                  {/* Worked Divider (Exact CepatUsaha WorkedByDivider) */}
                  <div className="flex items-center gap-3 py-1.5 my-1">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 shadow-2xs">
                      <Zap className="w-2.5 h-2.5 text-primary" />
                      Worked for 3.4s
                    </span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>

                  {/* AI Response Prose */}
                  <div className="space-y-2.5 text-xs sm:text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      Saya telah merancang landing page flagship untuk <strong>Atelier Kroma</strong>: hero section editorial beresolusi tinggi, navigasi minimalis, dan katalog produk mikro-lot.
                    </p>
                    {/* Changed Files Card */}
                    <div className="mt-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">3 file diubah</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">Hero, Catalog, Header</span>
                    </div>
                  </div>
                </div>

                {/* === TURN 2 === */}
                <div className="space-y-3">
                  {/* User Message Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-[12.5px] leading-relaxed text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
                      Tambahkan menu artisan bakery & specialty drinks di bawah katalog beans kopi.
                    </div>
                  </div>

                  {/* Worked Divider */}
                  <div className="flex items-center gap-3 py-1.5 my-1">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 shadow-2xs">
                      <Zap className="w-2.5 h-2.5 text-primary" />
                      Worked for 2.1s
                    </span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>

                  {/* AI Response Prose */}
                  <div className="space-y-2.5 text-xs sm:text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      Katalog bakery & minuman signature telah ditambahkan lengkap dengan <em>Almond Croissant</em>, <em>Kyoto Cold Drip</em>, dan <em>Truffle Brioche Toast</em>.
                    </p>
                    {/* Changed Files Card */}
                    <div className="mt-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">2 file diubah</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">✓ Siap</span>
                    </div>
                  </div>
                </div>

                {/* === TURN 3 === */}
                <div className="space-y-3">
                  {/* User Message Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-[12.5px] leading-relaxed text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
                      Rapikan tombol aksi hero agar lebih ramping dan pastikan layout responsif untuk desktop, tablet, dan smartphone.
                    </div>
                  </div>

                  {/* Worked Divider */}
                  <div className="flex items-center gap-3 py-1.5 my-1">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 shadow-2xs">
                      <Zap className="w-2.5 h-2.5 text-primary" />
                      Worked for 1.4s
                    </span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>

                  {/* AI Response Prose */}
                  <div className="space-y-2.5 text-xs sm:text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      Tombol aksi hero telah dioptimasi dengan pill ringkas, serta grid katalog telah disesuaikan adaptif dari 2-kolom mobile hingga 3-kolom desktop.
                    </p>
                    {/* Changed Files Card */}
                    <div className="mt-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">2 file diubah</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">✓ Live</span>
                    </div>
                  </div>
                </div>

                {/* === TURN 4 === */}
                <div className="space-y-3">
                  {/* User Message Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-[12.5px] leading-relaxed text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
                      Sempurnakan navigasi header dengan indikator keranjang belanja dan pasang badge Spring Reserve 2026.
                    </div>
                  </div>

                  {/* Worked Divider */}
                  <div className="flex items-center gap-3 py-1.5 my-1">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 shadow-2xs">
                      <Zap className="w-2.5 h-2.5 text-primary" />
                      Worked for 0.8s
                    </span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>

                  {/* AI Response Prose */}
                  <div className="space-y-2.5 text-xs sm:text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      Header telah diperbarui dengan badge <em>Bag (2)</em> dan tag eksklusif <em>Harvest 04 • Spring Reserve</em>. Website siap di-deploy!
                    </p>
                    {/* Changed Files Card */}
                    <div className="mt-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">1 file diubah</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">✓ Siap Deploy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Composer at Bottom */}
              <div className="p-2.5 xl:p-3.5 border-t border-slate-200/80 dark:border-border/60 bg-white dark:bg-card shrink-0 mt-auto">
                <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/80 dark:bg-muted/30 p-2 xl:p-2.5 flex flex-col gap-1.5 xl:gap-2">
                  <span className="text-[10px] xl:text-xs text-muted-foreground truncate">Ketik instruksi tambahan atau ubah styling...</span>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="inline-flex items-center gap-1 px-1.5 xl:px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-muted text-[9px] xl:text-[10px] font-mono font-medium text-foreground">
                      <Zap className="w-2.5 h-2.5 text-primary" /> Flash 2.5
                    </span>
                    <div className="h-5 w-5 xl:h-6 xl:w-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center cursor-default shrink-0">
                      <Send className="w-2.5 h-2.5 xl:w-3 xl:h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ----------------- RIGHT SPLIT: PreviewPanel (7 cols / ~60%) ----------------- */}
            <div className="col-span-7 flex flex-col bg-white dark:bg-card overflow-hidden">
              {/* Preview Toolbar (100% exact replica of CepatUsaha StandardPreviewToolbar) */}
              <div className="h-12 xl:h-14 px-3 xl:px-4 border-b border-slate-200/80 dark:border-border/60 flex items-center justify-between bg-white dark:bg-card shrink-0 gap-2">
                {/* Left Controls: Mode Toggles & Viewport Selectors */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Active Preview Toggle */}
                  <div className="h-8 sm:h-9 px-3 rounded-lg border border-slate-200/90 dark:border-border bg-slate-100/90 dark:bg-muted text-foreground flex items-center gap-1.5 text-xs font-semibold shadow-2xs">
                    <Globe className="w-3.5 h-3.5 text-foreground shrink-0" />
                    <span>Preview</span>
                  </div>

                  {/* Canvas Grid Toggle */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-200/90 dark:border-border bg-white dark:bg-card text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </div>

                  {/* Code Toggle */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-200/90 dark:border-border bg-white dark:bg-card text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0">
                    <Code2 className="w-3.5 h-3.5" />
                  </div>

                  {/* Separator */}
                  <div className="h-4 w-px bg-slate-200 dark:bg-border mx-1" />

                  {/* Viewport Selectors: Monitor & Smartphone */}
                  <div className="flex items-center gap-0.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 dark:bg-muted text-foreground flex items-center justify-center shrink-0">
                      <Monitor className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Right Controls: Refresh & Element Inspector Click */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0">
                    <MousePointerClick className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Preview Canvas: Fluid Responsive (Mobile, Tablet, Desktop) Showcase */}
              <div className="flex-1 w-full bg-[#fbfbfb] dark:bg-[#0c0d12] text-stone-900 dark:text-stone-100 overflow-hidden flex flex-col font-sans">
                {/* 1. Header: Adapts seamlessly across Mobile, Tablet, and Desktop */}
                <div className="px-4 xl:px-6 py-2.5 xl:py-3 border-b border-stone-200/70 dark:border-stone-800/80 bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-xs flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 xl:gap-4">
                    <span className="text-xs xl:text-sm font-serif font-black tracking-wider uppercase text-stone-900 dark:text-white">
                      ATELIER KROMA
                    </span>
                    <span className="hidden 2xl:inline-block text-[9px] font-mono tracking-widest text-stone-400 uppercase">
                      / Studio Edition 2026
                    </span>
                  </div>

                  <div className="flex items-center gap-3 xl:gap-4 text-[11px] font-medium text-stone-600 dark:text-stone-400">
                    <span className="hidden lg:inline hover:text-stone-900 dark:hover:text-white">Origins</span>
                    <span className="hidden lg:inline hover:text-stone-900 dark:hover:text-white">Gear</span>
                    <span className="hidden 2xl:inline hover:text-stone-900 dark:hover:text-white">Journal</span>
                    <span className="px-2 xl:px-2.5 py-0.5 xl:py-1 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[10px] font-bold font-mono">
                      Bag (2)
                    </span>
                  </div>
                </div>

                {/* 2. Hero Section: Flawless fluid layout (Stacked on mobile/tablet, Coffee on the Right on 2xl Desktop) */}
                <div className="p-4 xl:p-5 bg-white dark:bg-[#0c0d12] border-b border-stone-200/70 dark:border-stone-800/80 flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-3 xl:gap-4 shrink-0">
                  {/* Hero Typography & CTAs Block */}
                  <div className="space-y-2 min-w-0 2xl:flex-1 2xl:pr-4">
                    {/* Spring Reserve Tag (Guaranteed single line whitespace-nowrap) */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-900 text-[9px] font-mono tracking-wider text-stone-600 dark:text-stone-400 uppercase whitespace-nowrap leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>Spring Reserve • Harvest 04</span>
                    </div>

                    {/* Editorial Headline */}
                    <h4 className="text-sm sm:text-base xl:text-lg 2xl:text-xl font-serif font-bold leading-snug tracking-tight text-stone-900 dark:text-stone-50">
                      The Alchemy of <span className="italic font-normal text-amber-800 dark:text-amber-300">Pure Roasting.</span>
                    </h4>

                    {/* Subtitle */}
                    <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      Single-origin micro-lots from West Java volcanic slopes, roasted on low-emission infrared drums for sublime flavor clarity.
                    </p>

                    {/* CTAs */}
                    <div className="flex items-center gap-1.5 pt-0.5 whitespace-nowrap">
                      <span className="px-2.5 xl:px-3 py-1 xl:py-1.5 rounded-full bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-[9px] xl:text-[10px] font-semibold shadow-xs shrink-0 leading-none">
                        Explore Origins
                      </span>
                      <span className="px-2.5 xl:px-3 py-1 xl:py-1.5 rounded-full border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-[9px] xl:text-[10px] font-medium shrink-0 leading-none">
                        Read Story →
                      </span>
                    </div>
                  </div>

                  {/* Spotlight Studio Photo Banner (Landscape on < 2xl, Square/Portrait Card on the Right on 2xl Desktop) */}
                  <div className="relative w-full 2xl:w-44 h-28 sm:h-32 xl:h-36 2xl:h-40 rounded-xl xl:rounded-2xl overflow-hidden shadow-xs border border-stone-200/80 dark:border-stone-800/80 bg-stone-100 dark:bg-stone-900 shrink-0 mt-0.5 2xl:mt-0">
                    <img
                      src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=640&auto=format&fit=crop"
                      alt="Atelier Reserve Coffee"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-2.5 bottom-2.5 p-2 rounded-xl bg-stone-950/80 backdrop-blur-md text-white flex items-center justify-between shadow-md">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[9.5px] font-bold truncate">Puntang Washed Gesha</span>
                        <span className="text-[8px] text-stone-300 truncate">Jasmine • Bergamot • Raw Honey</span>
                      </div>
                      <span className="text-amber-400 font-mono font-bold text-[10px] shrink-0">Rp 160k</span>
                    </div>
                  </div>
                </div>

                {/* 3. Editorial Curated Catalog Grid: Coffee, Bakery, Specialty Drinks */}
                <div className="p-3.5 xl:p-5 flex-1 flex flex-col justify-start space-y-4 bg-[#fbfbfb] dark:bg-[#0c0d12] overflow-hidden">
                  {/* Category Section 1: Specialty Coffee & Craft Gear */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] xl:text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                          Specialty Beans & Gear
                        </span>
                        <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest hidden sm:inline">
                          — Harvest 2026
                        </span>
                      </div>
                      <span className="text-[9px] xl:text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                        Lihat Semua (8) →
                      </span>
                    </div>

                    {/* Responsive Grid: 3 Items */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 xl:gap-2.5">
                      {/* Item 1 */}
                      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 p-2 xl:p-2.5 bg-white dark:bg-stone-900/60 flex flex-col gap-1.5 shadow-2xs">
                        <div className="h-16 sm:h-18 lg:h-20 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                          <img
                            src="https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?q=80&w=280&auto=format&fit=crop"
                            alt="Titanium Grinder"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-stone-950/80 backdrop-blur-xs text-[7px] font-mono font-medium text-white">
                            GEAR
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] xl:text-[11px] font-bold text-stone-900 dark:text-stone-100 truncate">
                            Precision Hand Grinder
                          </span>
                          <span className="text-[8px] xl:text-[9px] text-stone-400 truncate">
                            48mm Titanium Burrs
                          </span>
                          <span className="text-[9px] xl:text-[10px] font-bold font-mono text-stone-900 dark:text-stone-200 mt-0.5">
                            Rp 1.850.000
                          </span>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 p-2 xl:p-2.5 bg-white dark:bg-stone-900/60 flex flex-col gap-1.5 shadow-2xs">
                        <div className="h-16 sm:h-18 lg:h-20 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                          <img
                            src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=280&auto=format&fit=crop"
                            alt="Aceh Gayo Coffee"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-stone-950/80 backdrop-blur-xs text-[7px] font-mono font-medium text-white">
                            BEANS
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] xl:text-[11px] font-bold text-stone-900 dark:text-stone-100 truncate">
                            Aceh Gayo Anaerobic
                          </span>
                          <span className="text-[8px] xl:text-[9px] text-stone-400 truncate">
                            Dark Cherry • Cacao
                          </span>
                          <span className="text-[9px] xl:text-[10px] font-bold font-mono text-stone-900 dark:text-stone-200 mt-0.5">
                            Rp 145.000
                          </span>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 p-2 xl:p-2.5 bg-white dark:bg-stone-900/60 flex flex-col gap-1.5 shadow-2xs hidden lg:flex">
                        <div className="h-16 sm:h-18 lg:h-20 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                          <img
                            src="https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=280&auto=format&fit=crop"
                            alt="Kasongan Dripper"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-stone-950/80 backdrop-blur-xs text-[7px] font-mono font-medium text-white">
                            CRAFT
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] xl:text-[11px] font-bold text-stone-900 dark:text-stone-100 truncate">
                            Kasongan Dripper Set
                          </span>
                          <span className="text-[8px] xl:text-[9px] text-stone-400 truncate">
                            Matte Sandstone Glaze
                          </span>
                          <span className="text-[9px] xl:text-[10px] font-bold font-mono text-stone-900 dark:text-stone-200 mt-0.5">
                            Rp 320.000
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Section 2: Artisan Patisserie & Specialty Drinks */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] xl:text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                          Artisan Bakery & Signature Drinks
                        </span>
                        <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest hidden sm:inline">
                          — Freshly Baked
                        </span>
                      </div>
                      <span className="text-[9px] xl:text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                        Menu Lengkap →
                      </span>
                    </div>

                    {/* Rich Food & Drinks Grid: 4 items (2x2 on mobile, 4 in row on wide desktop) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xl:gap-2.5">
                      {/* Food Item 1 */}
                      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 p-2 bg-white dark:bg-stone-900/60 flex flex-col gap-1.5 shadow-2xs">
                        <div className="h-16 sm:h-18 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                          <img
                            src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=280&auto=format&fit=crop"
                            alt="Almond Croissant"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-amber-600/90 backdrop-blur-xs text-[7px] font-mono font-bold text-white">
                            PASTRY
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] xl:text-[11px] font-bold text-stone-900 dark:text-stone-100 truncate">
                            Almond Croissant
                          </span>
                          <span className="text-[8px] xl:text-[9px] text-stone-400 truncate">
                            Normandy Butter
                          </span>
                          <span className="text-[9px] xl:text-[10px] font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                            Rp 44.000
                          </span>
                        </div>
                      </div>

                      {/* Drink Item 2 */}
                      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 p-2 bg-white dark:bg-stone-900/60 flex flex-col gap-1.5 shadow-2xs">
                        <div className="h-16 sm:h-18 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                          <img
                            src="https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=280&auto=format&fit=crop"
                            alt="Kyoto Cold Drip"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-stone-900/90 backdrop-blur-xs text-[7px] font-mono font-bold text-white">
                            COLD BREW
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] xl:text-[11px] font-bold text-stone-900 dark:text-stone-100 truncate">
                            Kyoto Cold Drip
                          </span>
                          <span className="text-[8px] xl:text-[9px] text-stone-400 truncate">
                            18h Slow Drip
                          </span>
                          <span className="text-[9px] xl:text-[10px] font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                            Rp 48.000
                          </span>
                        </div>
                      </div>

                      {/* Food Item 3 */}
                      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 p-2 bg-white dark:bg-stone-900/60 flex flex-col gap-1.5 shadow-2xs hidden lg:flex">
                        <div className="h-16 sm:h-18 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                          <img
                            src="https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=280&auto=format&fit=crop"
                            alt="Brioche Toast"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-amber-600/90 backdrop-blur-xs text-[7px] font-mono font-bold text-white">
                            BRUNCH
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] xl:text-[11px] font-bold text-stone-900 dark:text-stone-100 truncate">
                            Truffle Brioche Toast
                          </span>
                          <span className="text-[8px] xl:text-[9px] text-stone-400 truncate">
                            Wild Mushroom • Egg
                          </span>
                          <span className="text-[9px] xl:text-[10px] font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                            Rp 68.000
                          </span>
                        </div>
                      </div>

                      {/* Drink Item 4 */}
                      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 p-2 bg-white dark:bg-stone-900/60 flex flex-col gap-1.5 shadow-2xs hidden lg:flex">
                        <div className="h-16 sm:h-18 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                          <img
                            src="https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=280&auto=format&fit=crop"
                            alt="Matcha Latte"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-emerald-700/90 backdrop-blur-xs text-[7px] font-mono font-bold text-white">
                            TEA
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] xl:text-[11px] font-bold text-stone-900 dark:text-stone-100 truncate">
                            Matcha Cloud Latte
                          </span>
                          <span className="text-[8px] xl:text-[9px] text-stone-400 truncate">
                            Uji Ceremonial
                          </span>
                          <span className="text-[9px] xl:text-[10px] font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                            Rp 46.000
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Text Description with True Progressive Gradient Blur (Smooth Blur Mask) */}
      <div className="relative z-20 mt-auto w-full pt-28 pb-8 px-8 lg:px-10 overflow-hidden">
        {/* Progressive Deep Blur Layer */}
        <div
          className="absolute inset-0 pointer-events-none backdrop-blur-3xl bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/95 via-50% to-transparent dark:from-[#090b10] dark:via-[#090b10]/95 dark:via-50%"
          style={{
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Content: Clean Editorial Typography Layout */}
        <div className="relative z-10 max-w-2xl space-y-2.5">
          {/* Master Headline with Tasteful Serif Contrast */}
          <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-sans font-bold tracking-tight text-foreground leading-[1.2]">
            Ubah ide usahamu menjadi{' '}
            <span className="font-serif italic font-normal text-stone-800 dark:text-stone-200 underline decoration-amber-500/30 underline-offset-4">
              website bisnis profesional
            </span>{' '}
            dalam hitungan detik.
          </h3>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl font-normal">
            Cukup ceritakan konsep bisnismu. AI merancang antarmuka siap pakai, menyusun katalog produk, dan meluncurkannya ke domain publik secara instan.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------- main page ---------------------------------- */

export function AuthPage() {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [verifying, setVerifying] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Handle URL params ?mode=sign-up
  useEffect(() => {
    setMode(searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in')
    setVerifying(false)
  }, [location.search, searchParams])

  // Redirect if already signed in
  useEffect(() => {
    if (clerkLoaded && isSignedIn) {
      navigate('/', { replace: true })
    }
  }, [clerkLoaded, isSignedIn, navigate])

  if (!clerkLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isSignedIn) return null

  const isSignUp = mode === 'sign-up'

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* LEFT FORM PANEL (100% full-width on mobile/small screens, fixed split on md+) */}
      <div className="flex w-full md:w-[50%] lg:w-[44%] xl:w-[40%] 2xl:w-[36%] md:min-w-[380px] md:max-w-[620px] flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14 shrink-0 bg-background z-10 md:border-r border-border/60">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Brand />
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-2xs transition-all hover:bg-muted hover:text-foreground hover:border-muted-foreground/30 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>

        {/* Form Container (Expanded Max Width for Supreme Comfort) */}
        <div className="my-auto py-8 w-full max-w-[440px] mx-auto">
          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {verifying
                ? 'Verifikasi Email'
                : isSignUp
                ? 'Mulai Bangun Website AI'
                : 'Selamat Datang Kembali'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              {verifying
                ? 'Masukkan kode verifikasi yang dikirimkan ke email Anda.'
                : isSignUp
                ? 'Daftar sekarang dan publikasikan situs web dalam hitungan detik.'
                : 'Masuk untuk mengakses dan mengelola seluruh proyek web Anda.'}
            </p>
          </div>

          {/* Form Content */}
          {verifying ? (
            <VerifyEmailForm onBack={() => setVerifying(false)} />
          ) : isSignUp ? (
            <SignUpForm onRequireVerification={() => setVerifying(true)} />
          ) : (
            <SignInForm />
          )}

          {/* Bottom Switch Link */}
          {!verifying && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              {isSignUp ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}{' '}
              <button
                type="button"
                onClick={() => setMode(isSignUp ? 'sign-in' : 'sign-up')}
                className="font-semibold text-primary hover:underline cursor-pointer"
              >
                {isSignUp ? 'Masuk di sini' : 'Daftar gratis'}
              </button>
            </p>
          )}
        </div>

        {/* Footer Terms */}
        <div className="text-[11px] text-muted-foreground/80 text-center leading-relaxed">
          Dengan melanjutkan, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi CepatUsaha.
        </div>
      </div>

      {/* RIGHT 70% — Live Interactive Visual Showcase */}
      <RightShowcase />
    </div>
  )
}

