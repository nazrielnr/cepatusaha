import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare,
  User,
  Clock,
  Hash,
  Code,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import adminApi from '@/api/admin-client'

interface ChatSession {
  id: string
  user_id: string
  user_email: string
  project_id: string | null
  project_title: string | null
  started_at: string
  ended_at: string | null
  message_count: number
  duration_seconds: number | null
}

interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'ai' | 'tool'
  content: string
  timestamp: string
  metadata?: {
    function_call?: {
      name: string
      arguments: any
    }
    function_result?: {
      success: boolean
      data?: any
      error?: string
    }
  }
}

interface ChatDetailDialogProps {
  session: ChatSession
  open: boolean
  onClose: () => void
}

export function ChatDetailDialog({
  session,
  open,
  onClose,
}: ChatDetailDialogProps) {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && session) {
      loadMessages()
    }
  }, [open, session])

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.chats.get(session.id) as any
      setMessages(response.data?.messages || [])
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user'
    const isAI = message.role === 'ai'
    const isTool = message.role === 'tool'

    return (
      <div
        key={message.id}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-primary dark:bg-primary'
              : isAI
              ? 'bg-accent dark:bg-accent'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {isUser ? (
            <User className="h-4 w-4 text-primary dark:text-primary" />
          ) : isAI ? (
            <MessageSquare className="h-4 w-4 text-accent dark:text-accent" />
          ) : (
            <Code className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          {/* Role Badge */}
          <div className="mb-1">
            <Badge
              variant={isUser ? 'default' : isAI ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {message.role.toUpperCase()}
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formatDateTime(message.timestamp)}
            </span>
          </div>

          {/* Message Text */}
          <Card
            className={`p-3 ${
              isUser
                ? 'bg-primary dark:bg-primary border-primary dark:border-primary'
                : isAI
                ? 'bg-accent dark:bg-accent border-accent dark:border-accent'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
            }`}
          >
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {message.content}
            </p>

            {/* Function Call Display */}
            {message.metadata?.function_call && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Function Call: {message.metadata.function_call.name}
                  </span>
                </div>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                  {JSON.stringify(
                    message.metadata.function_call.arguments,
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {/* Function Result Display */}
            {message.metadata?.function_result && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  {message.metadata.function_result.success ? (
                    <CheckCircle className="h-4 w-4 text-accent dark:text-accent" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive dark:text-destructive" />
                  )}
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Function Result:{' '}
                    {message.metadata.function_result.success
                      ? 'Success'
                      : 'Error'}
                  </span>
                </div>
                {message.metadata.function_result.error && (
                  <p className="text-xs text-destructive dark:text-destructive mb-2">
                    {message.metadata.function_result.error}
                  </p>
                )}
                {message.metadata.function_result.data && (
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {JSON.stringify(
                      message.metadata.function_result.data,
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Chat Session Details</SheetTitle>
          <SheetDescription>
            View complete chat history and session statistics
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Session Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  User
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {session.user_email || 'Unknown'}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Project
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {session.project_title || 'No project'}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Messages
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {session.message_count}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Duration
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatDuration(session.duration_seconds)}
              </p>
            </Card>
          </div>

          {/* Session Status */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Status
                </p>
                <Badge variant={session.ended_at ? 'secondary' : 'default'}>
                  {session.ended_at ? 'Ended' : 'Active'}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Started
                </p>
                <p className="text-xs text-gray-900 dark:text-gray-100">
                  {formatDateTime(session.started_at)}
                </p>
                {session.ended_at && (
                  <>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 mt-2">
                      Ended
                    </p>
                    <p className="text-xs text-gray-900 dark:text-gray-100">
                      {formatDateTime(session.ended_at)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Messages */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Chat History
            </h3>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <Card className="p-4">
                <p className="text-sm text-destructive dark:text-destructive">
                  {error}
                </p>
              </Card>
            ) : messages.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  No messages in this session
                </p>
              </Card>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">{messages.map(renderMessage)}</div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
