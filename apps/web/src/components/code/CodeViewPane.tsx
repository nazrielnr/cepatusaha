/**
 * CodeViewPane Component
 *
 * Wrapper component that combines SimpleFileTree and SimpleCodeEditor
 * Modern minimalist layout (White Theme) - Refined
 */

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Code, PanelLeft, Search } from 'lucide-react'
import { SimpleFileTree } from './SimpleFileTree'
import { SimpleCodeEditor } from './SimpleCodeEditor'
import { getProjectFiles } from '@/api/files'
import type { File } from '@/types/preview'

interface CodeViewPaneProps {
    projectId: string
    userId: string
    files: File[]
    onRefresh?: () => void
    getToken?: () => Promise<string | null>
    className?: string
}

export function CodeViewPane({
    projectId,
    userId: _userId,
    files,
    onRefresh,
    getToken,
    className,
}: CodeViewPaneProps) {
    // Internal state for file selection
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [fetchedFiles, setFetchedFiles] = useState<File[]>([])
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const displayFiles = files.length ? files : fetchedFiles

    useEffect(() => {
        if (files.length || !projectId || !getToken) return
        let cancelled = false
        getToken().then((token) => token && getProjectFiles(projectId, token)).then((next) => {
            if (!cancelled && next) setFetchedFiles(next as File[])
        }).catch(console.error)
        return () => { cancelled = true }
    }, [files.length, getToken, projectId])

    // Filter files based on search
    const filteredFiles = displayFiles.filter(f =>
        f.file_path.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        setSelectedFile((selected) => selected ? displayFiles.find((f) => f.file_path === selected.file_path) ?? null : null)
    }, [displayFiles])

    useEffect(() => {
        if (!selectedFile && filteredFiles.length > 0) setSelectedFile(filteredFiles[0])
    }, [filteredFiles, selectedFile])

    // Handle file select from tree
    const handleFileSelect = useCallback((file: File) => {
        setSelectedFile(file)
    }, [])

    // Handle file save
    const handleFileSave = useCallback(() => {
        onRefresh?.()
        if (!projectId || !getToken) return
        getToken().then((token) => token && getProjectFiles(projectId, token)).then((next) => {
            if (next) setFetchedFiles(next as File[])
        }).catch(console.error)
    }, [getToken, onRefresh, projectId])

    // Handle editor close
    const handleEditorClose = useCallback(() => {
        setSelectedFile(null)
    }, [])

    return (
        <div
            className={cn("flex h-full w-full bg-white", className)}
            style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%' }}
        >
            {/* File Tree Sidebar */}
            <div
                className="flex flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out"
                style={{
                    width: isSidebarCollapsed ? '0px' : '260px',
                    minWidth: isSidebarCollapsed ? '0px' : '260px',
                    maxWidth: isSidebarCollapsed ? '0px' : '260px',
                    height: '100%',
                    overflow: 'hidden',
                    opacity: isSidebarCollapsed ? 0 : 1
                }}
            >
                {/* Search Input Only - Removed Header text and Close button */}
                <div className="p-4 flex flex-col gap-3">
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 group-focus-within:text-gray-700" />
                        <input
                            type="text"
                            placeholder="Search files"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white text-gray-900 placeholder:text-gray-600 transition-all"
                        />
                    </div>
                </div>

                {/* File Tree - Adjusted padding */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 scrollbar-hide">
                    <SimpleFileTree
                        files={filteredFiles}
                        selectedFilePath={selectedFile?.file_path}
                        onFileSelect={handleFileSelect}
                    />
                </div>
            </div>

            {/* Code Editor Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* Toggle Sidebar Button (Only visible when collapsed) */}
                {isSidebarCollapsed && (
                    <button
                        onClick={() => setIsSidebarCollapsed(false)}
                        className="absolute left-4 bottom-4 z-20 p-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors"
                        title="Expand sidebar"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                )}

                {selectedFile ? (
                    <SimpleCodeEditor
                        key={`${selectedFile.file_path}:${selectedFile.updated_at ?? ''}:${selectedFile.content.length}`}
                        file={selectedFile}
                        onClose={handleEditorClose}
                        onSave={handleFileSave}
                        getToken={getToken}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-white">
                        <div className="text-center p-8 max-w-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Code className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Select a file to start editing
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
