import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  MessageSquare, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  FileText,
  User,
  FolderOpen,
  Code,
  Terminal
} from 'lucide-react'
import adminApi from '@/api/admin-client'
import { format } from 'date-fns'

interface ChatMessage {
  id: string
  role: 'user' | 'ai' | 'tool'
  content: string
  timestamp: Date
  toolCalls?: Array<{
    id: string
    functionName: string
    parameters: Record<string, any>
  }>
  toolResults?: Array<{
    toolCallId: string
    result: any
    status: 'success' | 'error'
    errorMessage?: string
  }>
  metadata?: Record<string, any>
}

interface ProjectFile {
  id: string
  filePath: string
  fileType: string
  content: string
  createdAt: Date
  updatedAt: Date
}

interface SessionDetail {
  session: {
    id: string
    userId: string
    userName: string
    userEmail: string
    projectId: string | null
    projectTitle: string | null
    startedAt: Date
    endedAt: Date | null
    messageCount: number
    functionCallCount: number
    filesCreated: number
  }
  messages: ChatMessage[]
  files: ProjectFile[]
  statistics: {
    totalMessages: number
    userMessages: number
    aiMessages: number
    toolMessages: number
    functionCallsExecuted: number
    filesCreated: number
    filesModified: number
    duration: number | null
  }
}

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)

  const loadSessionDetail = async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      setError(null)

      const response = await adminApi.chats.get(sessionId) as any
      const data = response?.data
      
      if (data) {
        setSessionDetail({
          ...data,
          session: {
            ...data.session,
            startedAt: new Date(data.session.startedAt),
            endedAt: data.session.endedAt ? new Date(data.session.endedAt) : null
          },
          messages: data.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })),
          files: data.files.map((f: any) => ({
            ...f,
            createdAt: new Date(f.createdAt),
            updatedAt: new Date(f.updatedAt)
          }))
        })
      }
    } catch (err) {
      console.error('Failed to load session detail:', err)
      setError(err instanceof Error ? err.message : 'Failed to load session detail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessionDetail()
  }, [sessionId])

  const handleBack = () => {
    if (sessionDetail?.session.userId) {
      navigate(`/chats/users/${sessionDetail.session.userId}`)
    } else {
      navigate('/chats')
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return 'Active'
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'user':
        return 'default'
      case 'ai':
        return 'secondary'
      case 'tool':
        return 'outline'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !sessionDetail) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Session not found'}
            <button 
              onClick={loadSessionDetail}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { session, messages, files, statistics } = sessionDetail

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">
              Session Detail
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {session.userEmail}
            </div>
            {session.projectTitle && (
              <div className="flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                {session.projectTitle}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(session.startedAt, 'MMM dd, yyyy HH:mm')}
            </div>
          </div>
        </div>
        <Button onClick={loadSessionDetail} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Messages
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {statistics.totalMessages}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {statistics.userMessages} user, {statistics.aiMessages} AI, {statistics.toolMessages} tool
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Function Calls
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {statistics.functionCallsExecuted}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Files
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {statistics.filesCreated}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {statistics.filesModified} modified
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Duration
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatDuration(statistics.duration)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {session.endedAt ? 'Completed' : 'Active'}
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="w-4 h-4 mr-2" />
            Files ({files.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(message.role)}>
                      {message.role.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(message.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Message Content */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">
                    {message.content}
                  </pre>
                </div>

                {/* Tool Calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Function Calls
                    </div>
                    {message.toolCalls.map((toolCall) => (
                      <Card key={toolCall.id} className="bg-muted">
                        <CardContent className="p-3">
                          <div className="text-sm font-mono mb-2">
                            {toolCall.functionName}
                          </div>
                          <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                            {JSON.stringify(toolCall.parameters, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Tool Results */}
                {message.toolResults && message.toolResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Results</div>
                    {message.toolResults.map((result, idx) => (
                      <Card 
                        key={idx} 
                        className={result.status === 'error' ? 'border-destructive0' : 'border-accent0'}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={result.status === 'error' ? 'destructive' : 'default'}>
                              {result.status}
                            </Badge>
                          </div>
                          {result.errorMessage && (
                            <div className="text-sm text-destructive dark:text-destructive mb-2">
                              {result.errorMessage}
                            </div>
                          )}
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {messages.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No messages in this session
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* File List */}
            <Card>
              <CardHeader>
                <CardTitle>Project Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      selectedFile?.id === file.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.filePath}</div>
                        <div className="text-xs text-muted-foreground">
                          {file.fileType} • Updated {format(file.updatedAt, 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {files.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No files in this project
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Content */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedFile ? selectedFile.filePath : 'Select a file'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFile ? (
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-[600px] overflow-y-auto">
                    <code>{selectedFile.content}</code>
                  </pre>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a file to view its content
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
