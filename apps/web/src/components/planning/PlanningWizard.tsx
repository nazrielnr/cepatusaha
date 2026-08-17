/**
 * PlanningWizard - Full-Screen Planning Wizard
 *
 * Premium UI/UX matching landing page design.
 * Steps: Welcome → Template → Questions → Generating → Review
 */

import { useState, useCallback, useEffect } from 'react'
import {
    X,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Check,
    Lightbulb,
    FileText,
    Map,
    Palette,
    Target,
    Loader2,
    Briefcase,
    Utensils,
    ShoppingBag,
    Globe,
} from 'lucide-react'
import type { RequirementsFormData, RequirementsAnswers, PlanningData } from '@/types/planning'

// Template cards with icons and descriptions
const TEMPLATE_OPTIONS = [
    {
        id: 'landing-page',
        name: 'Landing Page',
        description: 'Halaman tunggal yang powerful untuk konversi',
        icon: Globe,
        color: 'from-primary0 to-primary0',
    },
    {
        id: 'e-commerce',
        name: 'E-Commerce',
        description: 'Toko online dengan katalog produk',
        icon: ShoppingBag,
        color: 'from-accent0 to-accent0',
    },
    {
        id: 'business-portfolio',
        name: 'Business Portfolio',
        description: 'Profil perusahaan profesional',
        icon: Briefcase,
        color: 'from-secondary to-destructive',
    },
    {
        id: 'restaurant',
        name: 'Restaurant & Cafe',
        description: 'Menu digital dan reservasi',
        icon: Utensils,
        color: 'from-destructive0 to-destructive0',
    },
]

type WizardStep = 'welcome' | 'template' | 'questions' | 'generating' | 'review'

interface PlanningWizardProps {
    isOpen: boolean
    onClose: () => void
    requirementsData: RequirementsFormData | null
    planningData: PlanningData | null
    onSubmitAnswers: (answers: RequirementsAnswers) => void
    onExecutePlan: () => void
}

export function PlanningWizard({
    isOpen,
    onClose,
    requirementsData,
    planningData,
    onSubmitAnswers,
    onExecutePlan,
}: PlanningWizardProps) {
    const [step, setStep] = useState<WizardStep>('welcome')
    const [selectedTemplate, setSelectedTemplate] = useState('')
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})

    const questions = requirementsData?.questions || []
    const totalQuestions = questions.length

    // Auto-advance to generating when in questions and user submits
    const handleSubmit = useCallback(() => {
        const formattedAnswers: RequirementsAnswers = {
            selected_template: selectedTemplate,
            business_name: requirementsData?.business_name || '',
            ...answers,
            skip_planning: false,
        }
        onSubmitAnswers(formattedAnswers)
        setStep('generating')
    }, [selectedTemplate, answers, requirementsData, onSubmitAnswers])

    // Watch for planningData to move to review
    useEffect(() => {
        if (step === 'generating' && planningData) {
            setStep('review')
        }
    }, [step, planningData])

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setStep('welcome')
            setSelectedTemplate('')
            setCurrentQuestionIndex(0)
            setAnswers({})
        }
    }, [isOpen])

    // Skip to template if requirementsData exists
    useEffect(() => {
        if (isOpen && requirementsData && step === 'welcome') {
            setStep('template')
        }
    }, [isOpen, requirementsData, step])

    if (!isOpen) return null

    const handleAnswer = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const handleNextQuestion = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        } else {
            setStep('template')
        }
    }

    const currentQuestion = questions[currentQuestionIndex]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Wizard Container */}
            <div className="relative w-full max-w-3xl mx-4 max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="relative px-8 pt-8 pb-4 border-b border-slate-100">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent0 flex items-center justify-center shadow-lg shadow-accent">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">
                                AI Website Planner
                            </h2>
                            <p className="text-sm text-slate-500">
                                {step === 'welcome' && 'Mari buat rencana website impian Anda'}
                                {step === 'template' && 'Pilih jenis website'}
                                {step === 'questions' && `Pertanyaan ${currentQuestionIndex + 1} dari ${totalQuestions}`}
                                {step === 'generating' && 'AI sedang menyusun rencana...'}
                                {step === 'review' && 'Rencana website siap!'}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {step !== 'welcome' && (
                        <div className="mt-6 flex gap-2">
                            {['template', 'questions', 'generating', 'review'].map((s, idx) => (
                                <div
                                    key={s}
                                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${['template', 'questions', 'generating', 'review'].indexOf(step) >= idx
                                            ? 'bg-gradient-to-r from-accent to-accent0'
                                            : 'bg-slate-200'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[60vh]">

                    {/* Welcome Step */}
                    {step === 'welcome' && (
                        <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                                <Lightbulb className="w-12 h-12 text-accent0" />
                            </div>
                            <h3 className="text-2xl font-semibold text-slate-800 mb-3">
                                Selamat Datang di Planning Mode
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-8">
                                AI akan membantu Anda membuat dokumen perencanaan lengkap: PRD, Sitemap, Design Brief, dan SEO Plan.
                            </p>
                            <button
                                onClick={() => setStep('template')}
                                className="px-8 py-4 bg-gradient-to-r from-accent0 to-accent0 text-white font-medium rounded-2xl shadow-lg shadow-accent transition-all duration-300 flex items-center gap-2 mx-auto"
                            >
                                Mulai Perencanaan
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Template Step */}
                    {step === 'template' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-lg font-semibold text-slate-800 mb-6">
                                Pilih Jenis Website
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {(requirementsData?.suggested_templates || TEMPLATE_OPTIONS.map(t => t.id)).map((templateId) => {
                                    const template = TEMPLATE_OPTIONS.find(t => t.id === templateId) || {
                                        id: templateId,
                                        name: templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                        description: 'Template website',
                                        icon: Globe,
                                        color: 'from-slate-500 to-slate-600',
                                    }
                                    const Icon = template.icon
                                    const isSelected = selectedTemplate === templateId

                return (
                                        <button
                                            key={templateId}
                                            onClick={() => setSelectedTemplate(templateId)}
                                            className={`
                        relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group
                        ${isSelected
                                                    ? 'border-accent0 bg-accent shadow-lg shadow-accent'
                                                    : 'border-slate-200'
                                                }
                      `}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-accent0 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-4 shadow-md transition-transform`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <h4 className="font-semibold text-slate-800 mb-1">{template.name}</h4>
                                            <p className="text-sm text-slate-500">{template.description}</p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Questions Step */}
                    {step === 'questions' && currentQuestion && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-lg font-semibold text-slate-800 mb-6">
                                {currentQuestion.question}
                            </h3>

                            {currentQuestion.type === 'text' && (
                                <textarea
                                    className="w-full p-4 border border-slate-200 rounded-2xl text-slate-700 resize-none focus:outline-none focus:ring-4 focus:ring-accent focus:border-accent transition-all"
                                    rows={4}
                                    placeholder="Ketik jawaban Anda..."
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                                />
                            )}

                            {currentQuestion.type === 'single_choice' && (
                                <div className="space-y-3">
                                    {currentQuestion.options?.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => handleAnswer(currentQuestion.id, option)}
                                            className={`
                        w-full p-4 rounded-2xl border-2 text-left transition-all duration-300
                        ${answers[currentQuestion.id] === option
                                                    ? 'border-accent0 bg-accent'
                                                    : 'border-slate-200'
                                                }
                      `}
                                        >
                                            <span className="font-medium text-slate-700">{option}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQuestion.type === 'multiple_choice' && (
                                <div className="grid grid-cols-2 gap-3">
                                    {currentQuestion.options?.map((option) => {
                                        const selected = (answers[currentQuestion.id] || []).includes(option)
                    return (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    const current = answers[currentQuestion.id] || []
                                                    const newValue = selected
                                                        ? current.filter((v: string) => v !== option)
                                                        : [...current, option]
                                                    handleAnswer(currentQuestion.id, newValue)
                                                }}
                                                className={`
                          p-4 rounded-2xl border-2 text-left transition-all duration-300
                          ${selected
                                                        ? 'border-accent0 bg-accent'
                                                        : 'border-slate-200'
                                                    }
                        `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? 'bg-accent0 border-accent0' : 'border-slate-300'}`}>
                                                        {selected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="font-medium text-slate-700">{option}</span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Generating Step */}
                    {step === 'generating' && (
                        <div className="text-center py-12 animate-in fade-in duration-500">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-accent0 animate-spin" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">
                                Menyusun Rencana Website...
                            </h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                AI sedang membuat PRD, Sitemap, Design Brief, dan SEO Plan untuk Anda.
                            </p>

                            <div className="mt-8 flex justify-center gap-4">
                                {[
                                    { icon: FileText, label: 'PRD' },
                                    { icon: Map, label: 'Sitemap' },
                                    { icon: Palette, label: 'Design' },
                                    { icon: Target, label: 'SEO' },
                                ].map(({ icon: Icon, label }, idx) => (
                                    <div
                                        key={label}
                                        className="flex flex-col items-center gap-2 opacity-50 animate-pulse"
                                        style={{ animationDelay: `${idx * 200}ms` }}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <Icon className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <span className="text-xs text-slate-400">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Review Step */}
                    {step === 'review' && planningData && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-accent0 flex items-center justify-center">
                                    <Check className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800">
                                    Rencana Website Siap!
                                </h3>
                                <p className="text-slate-500">
                                    {planningData.business_info.name} - {planningData.selected_template}
                                </p>
                            </div>

                            {/* Quick Summary Cards */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-2xl bg-primary border border-primary">
                                    <FileText className="w-6 h-6 text-primary0 mb-2" />
                                    <h4 className="font-medium text-slate-800">PRD</h4>
                                    <p className="text-xs text-slate-500">{planningData.prd.features.length} fitur direncanakan</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-secondary border border-secondary">
                                    <Map className="w-6 h-6 text-secondary mb-2" />
                                    <h4 className="font-medium text-slate-800">Sitemap</h4>
                                    <p className="text-xs text-slate-500">{planningData.sitemap.pages.length} halaman</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-destructive border border-destructive">
                                    <Palette className="w-6 h-6 text-destructive0 mb-2" />
                                    <h4 className="font-medium text-slate-800">Design</h4>
                                    <p className="text-xs text-slate-500">{planningData.design_brief.color_palette.length} warna</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-accent border border-accent">
                                    <Target className="w-6 h-6 text-accent0 mb-2" />
                                    <h4 className="font-medium text-slate-800">SEO</h4>
                                    <p className="text-xs text-slate-500">{planningData.seo_plan.primary_keywords.length} keywords</p>
                                </div>
                            </div>

                            <p className="text-sm text-center text-slate-500">
                                Lihat detail lengkap di panel Preview →
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (step === 'template') setStep('welcome')
                            else if (step === 'questions') handlePrevQuestion()
                        }}
                        className={`px-4 py-2 text-slate-500 hover:text-slate-700 flex items-center gap-2 transition-all ${step === 'welcome' || step === 'generating' || step === 'review' ? 'invisible' : ''
                            }`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </button>

                    <div className="flex items-center gap-3">
                        {step === 'template' && (
                            <button
                                onClick={() => selectedTemplate && setStep('questions')}
                                disabled={!selectedTemplate}
                                className="px-6 py-3 bg-gradient-to-r from-accent0 to-accent0 text-white font-medium rounded-xl shadow-lg shadow-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                Lanjut
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}

                        {step === 'questions' && (
                            <button
                                onClick={handleNextQuestion}
                                className="px-6 py-3 bg-gradient-to-r from-accent0 to-accent0 text-white font-medium rounded-xl shadow-lg shadow-accent transition-all flex items-center gap-2"
                            >
                                {currentQuestionIndex < totalQuestions - 1 ? (
                                    <>
                                        Lanjut
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        Buat Rencana
                                        <Sparkles className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}

                        {step === 'review' && (
                            <button
                                onClick={() => {
                                    onExecutePlan()
                                    onClose()
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-accent0 to-accent0 text-white font-medium rounded-xl shadow-lg shadow-accent transition-all flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Website
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
