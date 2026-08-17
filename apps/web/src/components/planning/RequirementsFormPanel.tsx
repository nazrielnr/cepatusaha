import { useState } from 'react'
import { ArrowRight, Check, FileText, Layout, Sparkles } from 'lucide-react'
import type { RequirementsAnswers, RequirementsFormData } from '@/types/planning'
import { cn } from './planningPreviewShared'

interface RequirementsFormPanelProps {
    data: RequirementsFormData
    onSubmit: (answers: RequirementsAnswers) => void
    onSkip: () => void
}

// Premium Wizard Form
export function RequirementsFormPanel({ data, onSubmit, onSkip }: RequirementsFormPanelProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({
        selected_template: '',
        answers: {},
    })

    const totalSteps = 1 + data.questions.length

    const handleTemplateSelect = (template: string) => {
        setAnswers(prev => ({ ...prev, selected_template: template }))
        setCurrentStep(1)
    }

    const handleAnswer = (questionId: string, answer: any) => {
        setAnswers(prev => ({
            ...prev,
            answers: { ...prev.answers, [questionId]: answer }
        }))
    }

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleSubmit = () => {
        onSubmit({
            selected_template: answers.selected_template,
            business_name: data.business_name || '',
            ...answers.answers,
            skip_planning: false,
        })
    }

    const getTemplateVisual = (template: string) => {
        const t = template.toLowerCase()
        if (t.includes('modern')) return <Layout className="w-10 h-10 text-zinc-900" />
        if (t.includes('classic')) return <FileText className="w-10 h-10 text-zinc-600" />
        if (t.includes('store') || t.includes('shop')) return <Sparkles className="w-10 h-10 text-secondary" />
        return <Layout className="w-10 h-10 text-zinc-400" />
    }

    return (
        <div className="flex flex-col h-full bg-zinc-50 font-sans relative overflow-hidden">
            {/* Simple Process Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-zinc-100">
                <div
                    className="h-full bg-zinc-900 transition-all duration-500 ease-out"
                    style={{ width: `${((currentStep) / (totalSteps - 1)) * 100}%` }}
                />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Header Info */}
                    <div className="text-center mb-10">
                        {currentStep === 0 ? (
                            <>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider mb-4">
                                    <Sparkles className="w-3 h-3" />
                                    Step 1 of {totalSteps}
                                </div>
                                <h2 className="text-3xl font-serif font-medium text-zinc-900 mb-3">Choose your clean canvas</h2>
                                <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
                                    Select a starting point that best represents your brand's vision.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 text-[10px] font-bold uppercase tracking-wider mb-4">
                                    Step {currentStep + 1} of {totalSteps}
                                </div>
                                <h2 className="text-2xl font-medium text-zinc-900 mb-3 leading-tight">
                                    {data.questions[currentStep - 1].question}
                                </h2>
                            </>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[200px]">
                        {currentStep === 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.suggested_templates.map((template) => {
                                    const isSelected = answers.selected_template === template
                return (
                                        <button
                                            key={template}
                                            onClick={() => handleTemplateSelect(template)}
                                            className={cn(
                                                'group relative p-6 rounded-xl border text-left transition-all duration-300',
                                                isSelected
                                                    ? 'border-zinc-900 bg-white shadow-lg ring-1 ring-zinc-900'
                                                    : 'border-zinc-200 bg-white'
                                            )}
                                        >
                                            <div className="mb-4">{getTemplateVisual(template)}</div>
                                            <div className="font-semibold text-zinc-900 capitalize text-lg mb-1">{template.replace(/-/g, ' ')}</div>
                                            <div className="text-xs text-zinc-500">Optimized layout structure</div>
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 text-zinc-900">
                                                    <Check className="w-5 h-5" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="w-full max-w-xl mx-auto">
                                {data.questions[currentStep - 1].type === 'text' ? (
                                    <div className="relative group">
                                        <textarea
                                            className="w-full p-5 bg-white border border-zinc-200 rounded-xl text-zinc-800 text-lg placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-sm min-h-[160px] resize-none"
                                            placeholder="Type your answer here..."
                                            value={answers.answers[data.questions[currentStep - 1].id] || ''}
                                            onChange={(e) => handleAnswer(data.questions[currentStep - 1].id, e.target.value)}
                                            autoFocus
                                        />
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] text-zinc-400 font-medium bg-zinc-50 px-2 py-1 rounded border border-zinc-100 pointer-events-none">
                                            <span>Hint: Be specific</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        {data.questions[currentStep - 1].options?.map((option) => {
                                            const isMultiple = data.questions[currentStep - 1].type === 'multiple_choice'
                                            const isSelected = isMultiple
                                                ? (answers.answers[data.questions[currentStep - 1].id] || []).includes(option)
                                                : answers.answers[data.questions[currentStep - 1].id] === option

                        return (
                                                <button
                                                    key={option}
                                                    onClick={() => {
                                                        if (isMultiple) {
                                                            const current = answers.answers[data.questions[currentStep - 1].id] || []
                                                            const newValue = isSelected
                                                                ? current.filter((v: string) => v !== option)
                                                                : [...current, option]
                                                            handleAnswer(data.questions[currentStep - 1].id, newValue)
                                                        } else {
                                                            handleAnswer(data.questions[currentStep - 1].id, option)
                                                        }
                                                    }}
                                                    className={cn(
                                                        'w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group',
                                                        isSelected
                                                            ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                                                            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                                                    )}
                                                >
                                                    <span className="font-medium">{option}</span>
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Floating Footer Controls */}
            <div className="p-6 flex items-center justify-center pointer-events-none sticky bottom-0 z-30">
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-200/80 shadow-xl shadow-zinc-200/50 pointer-events-auto">
                    <button
                        onClick={currentStep === 0 ? onSkip : handleBack}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                    >
                        {currentStep === 0 ? 'Skip' : 'Back'}
                    </button>

                    <div className="w-px h-4 bg-zinc-200 mx-1" />

                    {currentStep < totalSteps - 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={currentStep === 0 && !answers.selected_template}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            Next Step
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl hover:bg-secondary/80 transition-all shadow-sm"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Finish
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
