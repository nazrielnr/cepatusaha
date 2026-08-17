import { useEffect, useState, type ReactNode } from 'react'
import { Bot, Image as ImageIcon, Info, Save, SlidersHorizontal, Type, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CanvasEditorPatch, CanvasEditorSelection } from '@/utils/canvasEditorBridge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type CanvasInspectorProps = {
  selected: CanvasEditorSelection | null
  dirty: boolean
  onClose: () => void
  onPatch: (patch: CanvasEditorPatch) => void
  onSave: () => void
  onAskAI?: (selection: CanvasEditorSelection, prompt: string) => void
}

const textTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'LABEL', 'TD', 'TH'])
const boxTags = new Set(['DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'FORM'])

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-[11px] font-medium text-muted-foreground">{label}{children}</label>
}
function inputClass() { return 'h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground shadow-sm outline-none focus:ring-2 focus:ring-ring/10 focus:border-foreground/20' }
function Section({ icon: Icon, title, children }: { icon: any; title: string; children: ReactNode }) {
  return <section className="border-b border-border/70 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground"><Icon className="h-3.5 w-3.5 text-muted-foreground" />{title}</div><div className="space-y-3">{children}</div></section>
}

export function CanvasInspector({ selected, dirty, onClose, onPatch, onSave, onAskAI }: CanvasInspectorProps) {
  const [prompt, setPrompt] = useState('')
  const [text, setText] = useState('')
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')

  useEffect(() => {
    setPrompt('')
    setText(selected?.text || '')
    setSrc(selected?.src || '')
    setAlt(selected?.alt || '')
  }, [selected?.id])

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, onClose])

  if (!selected) {
    return (
      <aside className="hidden w-[320px] shrink-0 border-l border-border bg-background md:flex md:flex-col">
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/50"><SlidersHorizontal className="h-5 w-5 text-muted-foreground" /></div>
          <h3 className="text-sm font-semibold text-foreground">Inspector</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Klik elemen di preview untuk edit konten, style, gambar.</p>
        </div>
      </aside>
    )
  }

  const isText = textTags.has(selected.tag)
  const isImage = selected.tag === 'IMG'
  const isBox = boxTags.has(selected.tag)
  const classes = selected.classes.split(' ').filter(Boolean)

  return (
    <aside className="hidden w-[320px] shrink-0 border-l border-border bg-background md:flex md:flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-semibold text-background">{selected.tag.toLowerCase()}</span>
            <span className={cn('text-[10px] font-medium', dirty ? 'text-secondary' : 'text-muted-foreground')}>{dirty ? 'Unsaved' : 'Selected'}</span>
          </div>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{classes.slice(0, 2).join(' ') || 'no class'}</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close inspector"><X className="h-4 w-4" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isText && <Section icon={Type} title="Content"><textarea value={text} onChange={e => setText(e.target.value)} onBlur={() => onPatch({ text })} className="min-h-[88px] w-full resize-none rounded-md border border-border bg-background p-2 text-xs text-foreground shadow-sm outline-none focus:border-foreground/20 focus:ring-2 focus:ring-ring/10" /></Section>}

        {isImage && <Section icon={ImageIcon} title="Image">
          {src && <div className="overflow-hidden rounded-lg border border-border bg-muted"><img src={src} alt="" className="h-28 w-full object-cover" /></div>}
          <Field label="URL"><input value={src} onChange={e => setSrc(e.target.value)} onBlur={() => onPatch({ src })} className={inputClass()} /></Field>
          <Field label="Alt text"><input value={alt} onChange={e => setAlt(e.target.value)} onBlur={() => onPatch({ alt })} className={inputClass()} /></Field>
        </Section>}

        {(isText || isBox || isImage) && <Section icon={SlidersHorizontal} title="Style">
          {isText && <>
            <div className="rounded-md border border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">Existing: {selected.style.fontSize} · {selected.style.fontWeight}</div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Size"><input placeholder={selected.style.fontSize} onBlur={e => e.currentTarget.value && onPatch({ style: { fontSize: e.currentTarget.value } })} className={inputClass()} /></Field>
              <Field label="Weight">
                <Select defaultValue="" onValueChange={v => v && onPatch({ style: { fontWeight: v === 'keep' ? '' : v } })}>
                  <SelectTrigger className="h-8 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition-colors duration-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-1 focus-visible:outline-gray-300 dark:bg-transparent dark:border-border dark:text-foreground">
                    <SelectValue placeholder="Keep" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="600">600</SelectItem>
                    <SelectItem value="700">700</SelectItem>
                    <SelectItem value="800">800</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Text"><input type="color" value={selected.style.color || '#0f172a'} onChange={e => onPatch({ style: { color: e.currentTarget.value } })} className="h-8 w-full rounded-md border border-border bg-background p-1" /></Field>
              <Field label="Align">
                <Select defaultValue="" onValueChange={v => v && onPatch({ style: { textAlign: v === 'keep' ? '' : v } })}>
                  <SelectTrigger className="h-8 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition-colors duration-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-1 focus-visible:outline-gray-300 dark:bg-transparent dark:border-border dark:text-foreground">
                    <SelectValue placeholder="Keep" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep</SelectItem>
                    <SelectItem value="left">left</SelectItem>
                    <SelectItem value="center">center</SelectItem>
                    <SelectItem value="right">right</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </>}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Background"><input type="color" value={selected.style.backgroundColor || '#ffffff'} onChange={e => onPatch({ style: { backgroundColor: e.currentTarget.value } })} className="h-8 w-full rounded-md border border-border bg-background p-1" /></Field>
            <Field label="Radius"><input placeholder={selected.style.borderRadius || '0px'} onBlur={e => e.currentTarget.value && onPatch({ style: { borderRadius: e.currentTarget.value } })} className={inputClass()} /></Field>
          </div>
          <Field label="Padding"><input placeholder={selected.style.padding || '0px'} onBlur={e => e.currentTarget.value && onPatch({ style: { padding: e.currentTarget.value } })} className={inputClass()} /></Field>
          {isImage && <Field label="Width"><input placeholder={selected.style.width} onBlur={e => e.currentTarget.value && onPatch({ style: { width: e.currentTarget.value } })} className={inputClass()} /></Field>}
        </Section>}

        <Section icon={Bot} title="AI">
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: buat headline ini lebih premium" className="min-h-[76px] w-full resize-none rounded-md border border-border bg-background p-2 text-xs text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-foreground/20 focus:ring-2 focus:ring-ring/10" />
          <button disabled={!prompt.trim()} onClick={() => { onAskAI?.(selected, prompt.trim()); setPrompt('') }} className="w-full rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Ask AI for selected element</button>
        </Section>

        <Section icon={Info} title="Info">
          <dl className="grid grid-cols-[72px_1fr] gap-y-2 text-[11px]"><dt className="text-muted-foreground">Tag</dt><dd className="font-mono text-foreground">{selected.tag.toLowerCase()}</dd><dt className="text-muted-foreground">Class</dt><dd className="break-all font-mono text-foreground">{classes.join(' ') || '-'}</dd><dt className="text-muted-foreground">Size</dt><dd className="font-mono text-foreground">{Math.round(selected.rect.width)}×{Math.round(selected.rect.height)}</dd><dt className="text-muted-foreground">ID</dt><dd className="break-all font-mono text-foreground">{selected.id}</dd></dl>
        </Section>
      </div>

      <footer className="flex items-center gap-2 border-t border-border bg-muted/30 p-3">
        <button onClick={onClose} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">Close</button>
        <button onClick={onSave} disabled={!dirty} className="flex flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-3.5 w-3.5" />Save</button>
      </footer>
    </aside>
  )
}
