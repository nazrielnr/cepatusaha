import { useState } from 'react'
import { Check, CornerDownRight, FileText, Globe, Layout, Map, Palette, Search, Sparkles, Target } from 'lucide-react'
import type { DesignBrief, PRDData, SEOPlan, SitemapPage } from '@/types/planning'
import { cn, PanelHeader } from './planningPreviewShared'

export function PRDPanel({ prd }: { prd: PRDData }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Executive Summary - Wide, Top Left */}
            <div className="md:col-span-4 bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
                <PanelHeader icon={Sparkles} title="Executive Summary" subtitle="Overview" />
                <p className="text-sm leading-relaxed text-zinc-600 font-light">
                    {prd.executive_summary}
                </p>
            </div>

            {/* Project Goals - Compact List, Top Right */}
            <div className="md:col-span-2 bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
                <PanelHeader icon={Target} title="Goals" subtitle="Objectives" />
                <ul className="space-y-2 mt-2">
                    {prd.goals.slice(0, 4).map((goal, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-600">
                            <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-[9px] font-bold border border-zinc-200">
                                {idx + 1}
                            </span>
                            <span className="leading-snug">{goal}</span>
                        </li>
                    ))}
                    {prd.goals.length > 4 && (
                        <li className="text-[10px] text-zinc-400 pl-7">+ {prd.goals.length - 4} more goals</li>
                    )}
                </ul>
            </div>

            {/* Features & User Stories - Side by Side */}
            <div className="md:col-span-3 bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
                <PanelHeader icon={Layout} title="Key Features" subtitle="Prioritized" />
                <div className="grid gap-2 text-left max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {prd.features.map((feature, idx) => (
                        <div key={idx} className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 group transition-colors">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-xs text-zinc-800">{feature.name}</span>
                                <span className={cn(
                                    "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border",
                                    feature.priority === 'must_have' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-zinc-200"
                                )}>
                                    {feature.priority === 'must_have' ? 'Core' : 'Nice'}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="md:col-span-3 bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
                <PanelHeader icon={FileText} title="User Stories" subtitle="Requirements" />
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {prd.user_stories?.map((story, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50/50 hover:bg-zinc-50 border border-transparent transition-colors">
                            <div className="mt-1.5 w-1 h-1 rounded-full bg-secondary flex-shrink-0" />
                            <span className="text-xs text-zinc-600 leading-snug">{story}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Compact visual tree sitemap
export function SitemapPanel({ sitemap }: { sitemap: { pages: SitemapPage[] } }) {
    // Flatten hierarchy for compact table view, with indentation level
    const flatPages: { page: SitemapPage | string, level: number }[] = []

    sitemap.pages.forEach(p => {
        flatPages.push({ page: p, level: 0 })
        if (p.sub_pages) {
            p.sub_pages.forEach(sub => flatPages.push({ page: sub, level: 1 }))
        }
    })

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-zinc-100">
                    <PanelHeader icon={Map} title="Site Structure" subtitle={`${sitemap.pages.length} Pages`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-100">
                    {sitemap.pages.map((page, idx) => (
                        <div key={idx} className="bg-white p-4 group hover:bg-zinc-50 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 group-hover:text-zinc-900 transition-all">
                                    <Layout className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-zinc-800">{page.name}</h4>
                                    <code className="text-[10px] text-zinc-400 font-mono bg-zinc-50 px-1 rounded">{page.path}</code>
                                </div>
                            </div>

                            {page.sub_pages && page.sub_pages.length > 0 && (
                                <div className="ml-11 mt-3 space-y-1.5 pt-3 border-t border-zinc-50">
                                    {page.sub_pages.map((sub, sIdx) => (
                                        <div key={sIdx} className="flex items-center gap-2 text-xs text-zinc-500">
                                            <CornerDownRight className="w-3 h-3 opacity-50" />
                                            <span>{sub}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-1 mt-3 ml-11">
                                {page.sections.slice(0, 3).map((section, sIdx) => (
                                    <span key={sIdx} className="text-[9px] text-zinc-400 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded">
                                        {section}
                                    </span>
                                ))}
                                {page.sections.length > 3 && (
                                    <span className="text-[9px] text-zinc-400 px-1">+{page.sections.length - 3}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Compact Design & SEO Panels
export function DesignPanel({ design }: { design: DesignBrief }) {
    const [copiedColor, setCopiedColor] = useState<string | null>(null)

    const handleCopy = (hex: string) => {
        navigator.clipboard.writeText(hex)
        setCopiedColor(hex)
        setTimeout(() => setCopiedColor(null), 2000)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Visual Identity */}
            <div className="md:col-span-2 bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
                <PanelHeader icon={Palette} title="Visual Identity" subtitle="Mood & Style" />
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <p className="flex-1 text-sm text-zinc-600 font-light leading-relaxed">
                        {design.mood}
                    </p>
                    <div className="flex flex-wrap gap-2 md:max-w-xs justify-end">
                        {design.inspiration_keywords?.map((keyword, idx) => (
                            <span key={idx} className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-medium rounded-full border border-zinc-200">
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Colors Compact */}
            <div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
                <h4 className="text-xs font-bold text-zinc-900 mb-4">Color Palette</h4>
                <div className="space-y-2">
                    {design.color_palette.map((color, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleCopy(color.hex)}
                            className="w-full h-10 flex items-center gap-3 p-1.5 pr-3 bg-zinc-50 rounded-lg border border-zinc-100 hover:bg-white transition-all group"
                        >
                            <div className="w-7 h-full rounded shadow-sm border border-black/5" style={{ backgroundColor: color.hex }} />
                            <div className="flex-1 text-left flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-700">{color.name}</span>
                                <div className="flex items-center gap-2">
                                    <code className="text-[10px] text-zinc-400 font-mono group-hover:text-zinc-600">{color.hex}</code>
                                    {copiedColor === color.hex && <Check className="w-3 h-3 text-accent" />}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Typography Compact */}
            <div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
                <h4 className="text-xs font-bold text-zinc-900 mb-4">Typography</h4>
                <div className="grid grid-cols-2 gap-3 h-[calc(100%-2rem)]">
                    <div className="bg-zinc-50 rounded-lg p-4 flex flex-col justify-center border border-zinc-100 items-center text-center">
                        <span className="text-[40px] leading-none mb-2 font-serif text-zinc-800">Aa</span>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Heading</span>
                        <span className="text-xs font-medium text-zinc-700">{design.typography.heading_font}</span>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-4 flex flex-col justify-center border border-zinc-100 items-center text-center">
                        <span className="text-[40px] leading-none mb-2 font-sans text-zinc-800">Aa</span>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Body</span>
                        <span className="text-xs font-medium text-zinc-700">{design.typography.body_font}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function SEOPanel({ seo }: { seo: SEOPlan }) {
    return (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Strategy */}
            <div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
                <PanelHeader icon={Globe} title="SEO Strategy" subtitle="Keywords" />
                <div className="space-y-4">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Primary Target</span>
                        <div className="flex flex-wrap gap-2">
                            {seo.primary_keywords.map((kw, idx) => (
                                <span key={idx} className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded shadow-sm">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Secondary Integration</span>
                        <div className="flex flex-wrap gap-1.5">
                            {seo.secondary_keywords.map((kw, idx) => (
                                <span key={idx} className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-medium rounded border border-zinc-200">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pages Table View */}
            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-zinc-100">
                    <PanelHeader icon={Search} title="On-Page Optimization" subtitle={`${seo.page_seo.length} Pages`} />
                </div>
                <div className="divide-y divide-zinc-100">
                    {seo.page_seo.map((page, idx) => (
                        <div key={idx} className="p-4 hover:bg-zinc-50 transition-colors group">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h5 className="text-sm font-semibold text-zinc-800">{page.page}</h5>
                                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">/{page.page.toLowerCase().replace(/\s+/g, '-')}</div>
                                </div>
                                <div className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Idx: {idx}
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3 text-xs mt-3 bg-zinc-50/50 p-2.5 rounded border border-zinc-100/50">
                                <div>
                                    <span className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Meta Title</span>
                                    <p className="text-zinc-600 leading-snug">{page.title}</p>
                                </div>
                                <div>
                                    <span className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">H1 Heading</span>
                                    <p className="text-zinc-600 leading-snug">{page.h1}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

