/**
 * PlanningPreview Component
 *
 * Displays planning docs/form in preview panel.
 */

import { Sparkles } from 'lucide-react'
import { usePlanningStore } from '@/stores/planning-store'
import type { RequirementsAnswers } from '@/types/planning'
import { PRDPanel, SitemapPanel, DesignPanel, SEOPanel } from './PlanningDocsPanels'
import { RequirementsFormPanel } from './RequirementsFormPanel'
import { cn } from './planningPreviewShared'

interface PlanningPreviewProps {
    onSubmitToChat?: (message: string) => void
    className?: string
}

export function PlanningPreview({ onSubmitToChat, className }: PlanningPreviewProps) {
    const requirementsData = usePlanningStore((state) => state.requirementsData)
    const planningData = usePlanningStore((state) => state.planningData)
    const userAnswers = usePlanningStore((state) => state.userAnswers)
    const activePlanningTab = usePlanningStore((state) => state.activePlanningTab)
    const setUserAnswers = usePlanningStore((state) => state.setUserAnswers)
    const reset = usePlanningStore((state) => state.reset)

    const phase = planningData ? 'review' : userAnswers ? 'waiting' : requirementsData ? 'form' : 'idle'

    const formatAnswersAsMessage = (answers: RequirementsAnswers): string => {
        const lines = [
            'Jawaban form perencanaan website:',
            `- Template yang dipilih: ${answers.selected_template}`,
            `- Nama bisnis: ${answers.business_name || 'Belum diisi'}`,
        ]

        Object.entries(answers).forEach(([key, value]) => {
            if (!['selected_template', 'business_name', 'skip_planning'].includes(key) && value) {
                const formattedValue = Array.isArray(value) ? value.join(', ') : String(value)
                lines.push(`- ${key.replace(/_/g, ' ')}: ${formattedValue}`)
            }
        })
        lines.push('')
        lines.push('Silakan lanjutkan dengan membuat dokumen perencanaan lengkap (PRD, Sitemap, Design Brief, SEO Plan).')
        return lines.join('\n')
    }

    if (phase === 'form' && requirementsData) {
        return (
            <div className={cn('flex flex-col h-full bg-brand-surface font-sans selection:bg-brand-primary selection:text-white', className)}>
                <RequirementsFormPanel
                    data={requirementsData}
                    onSubmit={(answers) => {
                        setUserAnswers(answers)
                        onSubmitToChat?.(formatAnswersAsMessage(answers))
                    }}
                    onSkip={() => reset()}
                />
            </div>
        )
    }

    if (phase === 'waiting') {
        return (
            <div className={cn('flex items-center justify-center h-full bg-brand-subtle selection:bg-brand-primary selection:text-white', className)}>
                <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 rounded-full border-[3px] border-brand-border/30"></div>
                        <div className="absolute inset-0 rounded-full border-[3px] border-t-secondary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-secondary0 animate-pulse fill-secondary0" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-serif font-medium text-brand-primary mb-3">Merancang Konsep</h3>
                    <p className="text-sm text-brand-secondary/80 max-w-xs mx-auto leading-relaxed">
                        AI sedang menyusun strategi komprehensif untuk bisnis Anda...
                    </p>
                </div>
            </div>
        )
    }

    if (!planningData) {
        return (
            <div className={cn('flex items-center justify-center h-full bg-brand-subtle selection:bg-brand-primary selection:text-white', className)}>
                <div className="text-center max-w-sm px-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-2xl border border-brand-border shadow-sm flex items-center justify-center transform transition-transform duration-300">
                        <Sparkles className="w-8 h-8 text-secondary0 fill-secondary0" />
                    </div>
                    <h3 className="text-xl font-serif font-medium text-brand-primary mb-3">Mode Perencanaan</h3>
                    <p className="text-sm text-brand-secondary leading-relaxed">
                        Kirim pesan dengan mode perencanaan aktif untuk memulai proses perancangan website profesional.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={cn('flex flex-col h-full bg-zinc-50/50 font-sans selection:bg-secondary selection:text-secondary-foreground', className)}>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth focus:outline-none custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-4 pb-20">
                    {activePlanningTab === 'prd' && <PRDPanel prd={planningData.prd} />}
                    {activePlanningTab === 'sitemap' && <SitemapPanel sitemap={planningData.sitemap} />}
                    {activePlanningTab === 'design' && <DesignPanel design={planningData.design_brief} />}
                    {activePlanningTab === 'seo' && <SEOPanel seo={planningData.seo_plan} />}
                </div>
            </div>
        </div>
    )
}
