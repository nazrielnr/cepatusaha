/**
 * CodeViewPane Component
 *
 * Wrapper component that combines SimpleFileTree and SimpleCodeEditor
 * Modern minimalist layout (White Theme) - Refined
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Code, Loader2, PanelLeft, Search, Upload } from 'lucide-react'
import { SimpleFileTree } from './SimpleFileTree'
import { SimpleCodeEditor } from './SimpleCodeEditor'
import { getProjectFiles, updateProjectFile } from '@/api/files'
import { uploadProductImage } from '@/api/assets'
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
    userId,
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
    const [isUploadingAsset, setIsUploadingAsset] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const assetFileInputRef = useRef<HTMLInputElement>(null)
    const displayFiles = files.length ? files : fetchedFiles

    const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !projectId || !getToken) return
        setIsUploadingAsset(true)
        setUploadError(null)
        try {
            const token = await getToken()
            if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.')
            const uploadedUrl = await uploadProductImage(userId || '', file, token)
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'image.png'
            const hasSrc = displayFiles.some(f => f.file_path.startsWith('src/'))
            const targetPath = hasSrc ? `src/assets/images/${safeName}` : `assets/${safeName}`
            await updateProjectFile(projectId, targetPath, uploadedUrl, token)
            onRefresh?.()
            const refreshed = await getProjectFiles(projectId, token)
            if (refreshed) {
                setFetchedFiles(refreshed as File[])
                const newlyAdded = (refreshed as File[]).find(f => f.file_path === targetPath)
                if (newlyAdded) setSelectedFile(newlyAdded)
            }
        } catch (err: any) {
            setUploadError(err?.message || 'Gagal mengunggah asset.')
        } finally {
            setIsUploadingAsset(false)
            if (assetFileInputRef.current) assetFileInputRef.current.value = ''
        }
    }

    useEffect(() => {
        if (files.length || !projectId || !getToken) return
        let cancelled = false
        getToken().then((token) => token && getProjectFiles(projectId, token)).then((next) => {
            if (!cancelled && next) setFetchedFiles(next as File[])
        }).catch(console.error)
        return () => { cancelled = true }
    }, [files.length, getToken, projectId])

    // Filter out internal/hidden artifacts from user view
    const visibleFiles = displayFiles.filter(f =>
        !f.file_path.startsWith('.artifacts/') &&
        !f.file_path.startsWith('artifacts/') &&
        !f.file_path.startsWith('.env') &&
        !f.file_path.startsWith('.git')
    )

    // Filter files based on search
    const filteredFiles = visibleFiles.filter(f =>
        f.file_path.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        setSelectedFile((selected) => selected ? visibleFiles.find((f) => f.file_path === selected.file_path) ?? null : null)
    }, [visibleFiles])

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
                {/* Search & Upload Header */}
                <div className="p-3 flex flex-col gap-2 border-b border-gray-100">
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-gray-700" />
                        <input
                            type="text"
                            placeholder="Search files"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white text-gray-900 placeholder:text-gray-500 transition-all"
                        />
                    </div>
                    <input
                        ref={assetFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAssetUpload}
                    />
                    <button
                        type="button"
                        disabled={isUploadingAsset}
                        onClick={() => assetFileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        title="Unggah gambar ke folder assets"
                    >
                        {isUploadingAsset ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                <span>Mengunggah...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-3.5 h-3.5 text-gray-500" />
                                <span>Unggah Asset</span>
                            </>
                        )}
                    </button>
                    {uploadError && (
                        <p className="text-[11px] text-destructive leading-tight px-1">{uploadError}</p>
                    )}
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
