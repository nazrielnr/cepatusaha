/**
 * SimpleFileTree Component
 *
 * Modern, responsive file tree component
 * Minimalist design (White Theme) - Refined alignment (Tighter layout)
 */

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
    Image,
    FileCode,
    FileText
} from 'lucide-react'
import type { File as FileType } from '@/types/preview'

interface TreeNode {
    name: string
    path: string
    type: 'file' | 'folder'
    children?: TreeNode[]
    file?: FileType
}

interface SimpleFileTreeProps {
    files: FileType[]
    selectedFilePath?: string
    onFileSelect: (file: FileType) => void
    className?: string
}

function getFileIcon(fileType: string) {
    const type = fileType.toLowerCase()
    if (['tsx', 'jsx', 'ts', 'js', 'css', 'html', 'json'].includes(type)) return FileCode
    if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(type)) return Image
    return FileText
}

function buildTree(files: FileType[]): TreeNode[] {
    const root: TreeNode[] = []

    const sortedFiles = [...files].sort((a, b) => a.file_path.localeCompare(b.file_path))

    for (const file of sortedFiles) {
        const parts = file.file_path.split('/')
        let currentLevel = root

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            const isFile = i === parts.length - 1
            const currentPath = parts.slice(0, i + 1).join('/')

            let existing = currentLevel.find(node => node.name === part)

            if (!existing) {
                const newNode: TreeNode = {
                    name: part,
                    path: currentPath,
                    type: isFile ? 'file' : 'folder',
                    children: isFile ? undefined : [],
                    file: isFile ? file : undefined,
                }
                currentLevel.push(newNode)
                existing = newNode
            }

            if (!isFile && existing.children) {
                currentLevel = existing.children
            }
        }
    }

    const sortNodes = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
            return a.name.localeCompare(b.name)
        })
        nodes.forEach(node => {
            if (node.children) sortNodes(node.children)
        })
    }

    sortNodes(root)
    return root
}

function TreeNodeItem({
    node,
    selectedPath,
    onSelect,
    level = 0
}: {
    node: TreeNode
    selectedPath?: string
    onSelect: (file: FileType) => void
    level?: number
}) {
    const [isOpen, setIsOpen] = useState(true)
    const isFolder = node.type === 'folder'
    const isSelected = node.path === selectedPath
    const hasChildren = isFolder && node.children && node.children.length > 0

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isFolder) {
            setIsOpen(!isOpen)
        } else if (node.file) {
            onSelect(node.file)
        }
    }

    let Icon = File
    if (isFolder) {
        Icon = isOpen ? FolderOpen : Folder
    } else {
        Icon = getFileIcon(node.file?.file_type || '')
    }

    // Adjusted Indentation Logic
    // baseIndent: 4px (very tight to left edge)
    // levelIndent: 12px (per depth level)
    // arrowSlot: 16px (width of the toggle icon space)
    const baseIndent = 4
    const levelIndent = 12
    const arrowSlotSize = 16

    // If it's a folder, it needs to leave space for its own arrow (which is rendered inside the padding area effectively due to -ml)
    // If it's a file, it needs to pad left to align with folder *icon* position.
    // Folder Icon Position = base + level*indent + arrowSlot
    // File Icon Position   = base + level*indent + arrowSlot
    const paddingLeft = baseIndent + (level * levelIndent) + (isFolder ? 0 : arrowSlotSize)

    return (
        <div>
            <div
                role="button"
                onClick={handleClick}
                className={cn(
                    "flex items-center gap-1.5 py-1.5 pr-2 text-[13px] border-l-2 border-transparent transition-colors cursor-pointer select-none rounded-r-md mr-1 group relative",
                    "hover:bg-gray-100",
                    isSelected
                        ? "text-primary bg-primary/10 border-primary/20 font-medium"
                        : "text-gray-600 hover:text-gray-900 border-transparent"
                )}
                style={{ paddingLeft: `${paddingLeft}px` }}
            >
                {/* Toggle Icon (Only for Folders) */}
                {isFolder && (
                    <div className="w-4 h-4 flex items-center justify-center shrink-0 text-gray-600 group-hover:text-gray-700">
                        {hasChildren && (
                            isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                        )}
                    </div>
                )}

                {/* File/Folder Icon */}
                <Icon
                    className={cn(
                        "w-4 h-4 shrink-0 stroke-[1.5]",
                        isSelected ? "text-primary" : "text-gray-600 group-hover:text-gray-700",
                        // If folder, pull icon slightly closer to arrow if desired, but standard is fine
                    )}
                />

                <span className="truncate leading-tight translate-y-[0.5px]">{node.name}</span>
            </div>

            {isFolder && isOpen && hasChildren && (
                <div className="flex flex-col">
                    {node.children!.map((child) => (
                        <TreeNodeItem
                            key={child.path}
                            node={child}
                            selectedPath={selectedPath}
                            onSelect={onSelect}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function SimpleFileTree({
    files,
    selectedFilePath,
    onFileSelect,
    className
}: SimpleFileTreeProps) {
    const tree = useMemo(() => buildTree(files), [files])

    if (files.length === 0) {
        return (
            <div className={cn("p-4 text-center text-gray-600 text-xs", className)}>
                No files
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col gap-px pt-1", className)}>
            {tree.map((node) => (
                <TreeNodeItem
                    key={node.path}
                    node={node}
                    selectedPath={selectedFilePath}
                    onSelect={onFileSelect}
                />
            ))}
        </div>
    )
}
