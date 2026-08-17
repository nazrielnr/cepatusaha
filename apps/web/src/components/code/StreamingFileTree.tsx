/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Loader2,
  CheckCircle2,
  FilePlus,
  FileEdit,
  FileX,
  Search,
  Globe,
  Eye
} from 'lucide-react'
import { StreamingContentAnimated } from '../chat/StreamingContentAnimated'

export interface StreamingFile {
  path: string
  type: 'file' | 'folder'
  content?: string
  isStreaming?: boolean
  isComplete?: boolean
  size?: number
  language?: string
  operation?: 'create' | 'edit' | 'delete' | 'search' | 'resource' | 'preview'
}

interface StreamingFileTreeProps {
  files: StreamingFile[]
  onFileSelect?: (file: StreamingFile) => void
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: TreeNode[]
  file?: StreamingFile
}

function buildTree(files: StreamingFile[]): TreeNode[] {
  const root: TreeNode[] = []

  files.forEach(file => {
    const parts = file.path.split('/')
    let currentLevel = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const existingNode = currentLevel.find(n => n.name === part)

      if (existingNode) {
        if (!isLast && existingNode.children) {
          currentLevel = existingNode.children
        }
      } else {
        const newNode: TreeNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isLast ? 'file' : 'folder',
          children: isLast ? undefined : [],
          file: isLast ? file : undefined,
        }

        currentLevel.push(newNode)

        if (!isLast && newNode.children) {
          currentLevel = newNode.children
        }
      }
    })
  })

  return root
}

function TreeNodeComponent({
  node,
  onFileSelect,
  level = 0
}: {
  node: TreeNode
  onFileSelect?: (file: StreamingFile) => void
  level?: number
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-expand files when they start streaming or have content
  useEffect(() => {
    if (node.type === 'file' && node.file?.content) {
      setIsExpanded(true)
    }
  }, [node.type, node.file?.content])

  // Auto-scroll code when streaming
  useEffect(() => {
    if (scrollRef.current && node.file?.isStreaming) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [node.file?.content, node.file?.isStreaming])

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded)
    } else if (node.type === 'file') {
      // Toggle expansion for files to show/hide content
      setIsExpanded(!isExpanded)
      // Also call onFileSelect if provided
      if (node.file && onFileSelect) {
        onFileSelect(node.file)
      }
    }
  }

  const getStatusIcon = () => {
    if (node.type === 'folder') return null
    if (!node.file) return null

    if (node.file.isComplete) {
      return <CheckCircle2 className="w-3 h-3 text-accent" />
    }
    if (node.file.isStreaming) {
      return <Loader2 className="w-3 h-3 text-primary animate-spin" />
    }
    return null
  }

  const getOperationIcon = () => {
    if (node.type === 'folder') return <Folder className="w-3 h-3 text-primary" />
    if (!node.file) return <File className="w-3 h-3 text-muted-foreground" />

    switch (node.file.operation) {
      case 'create':
        return <FilePlus className="w-3 h-3 text-accent" />
      case 'edit':
        return <FileEdit className="w-3 h-3 text-destructive" />
      case 'delete':
        return <FileX className="w-3 h-3 text-destructive" />
      case 'search':
        return <Search className="w-3 h-3 text-secondary" />
      case 'resource':
        return <Globe className="w-3 h-3 text-primary" />
      case 'preview':
        return <Eye className="w-3 h-3 text-primary" />
      default:
        return <File className="w-3 h-3 text-muted-foreground" />
    }
  }

  const hasContent = node.type === 'file' && node.file?.content
  const isStreaming = node.file?.isStreaming
  const isComplete = node.file?.isComplete

  return (
    <div className="mb-1">
      {/* File/Folder Header */}
      <div
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 hover:bg-muted/50 dark:hover:bg-muted/50 cursor-pointer text-xs rounded-md transition-colors",
          isStreaming && "bg-primary/50 dark:bg-primary/20",
          isComplete && "bg-accent/50 dark:bg-accent/20"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* Chevron for expandable items */}
        {(node.type === 'folder' || hasContent) && (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground dark:text-muted-foreground transition-transform" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground dark:text-muted-foreground transition-transform" />
            )}
          </>
        )}
        {node.type === 'file' && !hasContent && (
          <span className="w-3" />
        )}
        {getOperationIcon()}
        <span className="flex-1 truncate font-mono">{node.name}</span>
        {getStatusIcon()}
      </div>

      {/* File Content Display (similar to ActionBlock) */}
      {node.type === 'file' && hasContent && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out",
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <div className="overflow-hidden">
            <div className="px-2 pb-2 pt-1">
              <div className={cn(
                "rounded-lg border shadow-inner",
                isStreaming
                  ? "bg-primary/50 dark:bg-primary/30 border-primary dark:border-primary"
                  : isComplete
                    ? "bg-accent/50 dark:bg-accent/30 border-accent dark:border-accent"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              )}>
                <div
                  ref={scrollRef}
                  className={cn(
                    "max-h-64 overflow-y-auto p-3 font-mono text-[10px]",
                    isStreaming
                      ? "text-primary dark:text-primary"
                      : isComplete
                        ? "text-accent dark:text-accent"
                        : "text-slate-600 dark:text-slate-400"
                  )}
                  role="log"
                  aria-live={isStreaming ? "polite" : "off"}
                  aria-label={`File content: ${node.name}`}
                >
                  <StreamingContentAnimated
                    key={`file-${node.path}`}
                    content={node.file!.content!}
                    isStreaming={isStreaming || false}
                    className="whitespace-pre-wrap break-all"
                  />
                  {isStreaming && (
                    <span
                      className="inline-block w-1.5 h-3 bg-primary dark:bg-primary ml-1 align-middle animate-pulse"
                      aria-label="Currently streaming"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Children */}
      {node.type === 'folder' && isExpanded && hasChildren && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNodeComponent
              key={`${child.path}-${index}`}
              node={child}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function StreamingFileTree({ files, onFileSelect }: StreamingFileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([])

  useEffect(() => {
    setTree(buildTree(files))
  }, [files])

  if (files.length === 0) {
    return null
  }

  return (
    <div className="text-sm">
      {tree.map((node, index) => (
        <TreeNodeComponent
          key={`${node.path}-${index}`}
          node={node}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  )
}

// Hook for managing streaming files state
export function useStreamingFiles() {
  const [streamingFiles, setStreamingFiles] = useState<StreamingFile[]>([])

  const addFile = (file: StreamingFile) => {
    setStreamingFiles(prev => {
      const existing = prev.find(f => f.path === file.path)
      if (existing) return prev
      return [...prev, file]
    })
  }

  const updateFile = (path: string, updates: Partial<StreamingFile>) => {
    setStreamingFiles(prev =>
      prev.map(f => f.path === path ? { ...f, ...updates } : f)
    )
  }

  const removeFile = (path: string) => {
    setStreamingFiles(prev => prev.filter(f => f.path !== path))
  }

  const clearFiles = () => {
    setStreamingFiles([])
  }

  return {
    files: streamingFiles,
    addFile,
    updateFile,
    removeFile,
    clearFiles,
  }
}
