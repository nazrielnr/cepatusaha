/**
 * SimpleCodeEditor Component
 *
 * Modern, responsive code editor with syntax highlighting
 * Uses react-syntax-highlighter for code display
 * Minimalist design (White Theme)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, Save, Loader2, Edit3, Eye } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { File } from '@/types/preview'
import { apiPathUrl, jsonHeaders } from '@/lib/apiClient'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// Map file types to Prism language names
function getLanguage(fileType: string): string {
    const type = fileType.toLowerCase()
    const languageMap: Record<string, string> = {
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'sass': 'sass',
        'js': 'javascript',
        'javascript': 'javascript',
        'jsx': 'jsx',
        'ts': 'typescript',
        'typescript': 'typescript',
        'tsx': 'tsx',
        'json': 'json',
        'md': 'markdown',
        'markdown': 'markdown',
        'py': 'python',
        'python': 'python',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'sh': 'bash',
        'bash': 'bash',
        'sql': 'sql',
    }
    return languageMap[type] || 'plaintext'
}

interface SimpleCodeEditorProps {
    file: File
    onClose: () => void
    onSave?: () => void
    getToken?: () => Promise<string | null>
    className?: string
}

export function SimpleCodeEditor({
    file,
    onClose,
    onSave,
    getToken,
    className
}: SimpleCodeEditorProps) {
    const [content, setContent] = useState(file.content)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [isDirty, setIsDirty] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Reset content when file changes
    useEffect(() => {
        setContent(file.content)
        setIsDirty(false)
        setSaveStatus('idle')
        setErrorMessage(null)
        setIsEditing(false)
    }, [file.id, file.content])

    // Track if isDirty
    useEffect(() => {
        setIsDirty(content !== file.content)
    }, [content, file.content])

    // Auto-save logic
    const saveFile = useCallback(async (contentToSave: string) => {
        setSaveStatus('saving')
        setErrorMessage(null)
        try {
            const token = await getToken?.()
            if (!token) throw new Error('Sesi tidak valid. Silakan masuk kembali.')

            const response = await fetch(apiPathUrl('/files/update'), {
                method: 'POST',
                headers: jsonHeaders(token),
                body: JSON.stringify({
                    project_id: file.project_id,
                    file_path: file.file_path,
                    content: contentToSave,
                }),
            })

            if (!response.ok) throw new Error(await response.text())

            setSaveStatus('saved')
            setIsDirty(false)
            onSave?.()
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to save'
            setErrorMessage(errorMsg)
            setSaveStatus('error')
        }
    }, [file.project_id, file.file_path, getToken, onSave])

    // Debounced auto-save
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        if (isDirty) {
            saveTimeoutRef.current = setTimeout(() => saveFile(content), 2000)
        }
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        }
    }, [content, isDirty, saveFile])

    const handleManualSave = () => {
        if (isDirty) saveFile(content)
    }

    const handleClose = () => {
        if (isDirty && saveStatus !== 'saving') {
            if (!window.confirm('Unsaved changes. Close?')) return
        }
        onClose()
    }

    const handleToggleEdit = () => {
        setIsEditing(!isEditing)
        if (!isEditing) {
            // Focus textarea when switching to edit mode
            setTimeout(() => textareaRef.current?.focus(), 50)
        }
    }

    const language = getLanguage(file.file_type)
    const lineCount = content.split('\n').length

    return (
        <div className={cn("flex flex-col h-full bg-white", className)}>
            {/* Header Area */}
            <div className="flex items-center h-[42px] px-3 border-b border-gray-100 justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-t-lg -mb-px relative z-10 border border-gray-200 border-b-white min-w-[100px] shadow-[0_-1px_2px_rgba(0,0,0,0.02)]">
                        <span className="text-xs font-medium text-gray-800 truncate max-w-[150px]">
                            {file.file_path.split('/').pop()}
                        </span>
                        {isDirty && <div className="w-1.5 h-1.5 rounded-full bg-secondary" title="Unsaved" />}
                        {saveStatus === 'saving' && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
                        <button
                            onClick={handleClose}
                            className="text-muted-foreground hover:text-destructive rounded p-0.5 hover:bg-destructive/10 transition-colors ml-1"
                            aria-label="Close editor"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Mode Toggle & Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleEdit}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                            isEditing
                                ? "bg-primary text-primary-foreground border border-primary"
                                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                        )}
                    >
                        {isEditing ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {isEditing ? 'Editing' : 'View'}
                    </button>
                    <button
                        onClick={handleManualSave}
                        disabled={!isDirty || saveStatus === 'saving'}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Save (Ctrl+S)"
                        aria-label="Save file"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
                <div className="bg-destructive/10 px-4 py-1.5 text-xs text-destructive border-b border-destructive/20 flex items-center justify-between">
                    <span>{errorMessage}</span>
                    <button onClick={() => setErrorMessage(null)}><X className="w-3 h-3" /></button>
                </div>
            )}

            {/* Editor / Viewer Container */}
            <div className="flex-1 overflow-auto relative">
                {isEditing ? (
                    /* Edit Mode - Textarea */
                    <div className="w-full h-full flex">
                        {/* Gutter */}
                        <div className="flex-shrink-0 w-10 bg-gray-50 border-r border-gray-100 text-[11px] text-gray-500 font-mono text-right py-4 select-none leading-6 sticky left-0">
                            {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i} className="px-2">{i + 1}</div>
                            ))}
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-1 w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-white text-gray-800 leading-6"
                            style={{ tabSize: 2 }}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoComplete="off"
                            onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                                    e.preventDefault()
                                    handleManualSave()
                                }
                            }}
                        />
                    </div>
                ) : (
                    /* View Mode - Syntax Highlighted */
                    <SyntaxHighlighter
                        language={language}
                        style={oneLight}
                        showLineNumbers
                        lineNumberStyle={{
                            minWidth: '2.5em',
                            paddingRight: '1em',
                            textAlign: 'right',
                            color: '#bae6fd',
                            userSelect: 'none',
                            fontStyle: 'normal',
                        }}
                        customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            background: '#ffffff',
                            minHeight: '100%',
                        }}
                        codeTagProps={{
                            style: {
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            }
                        }}
                    >
                        {content}
                    </SyntaxHighlighter>
                )}
            </div>
        </div>
    )
}
