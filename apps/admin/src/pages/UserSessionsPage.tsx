import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AdminDataTable } from '@/components/AdminDataTable'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, MessageSquare, AlertCircle, RefreshCw, Clock, FileText } from 'lucide-react'
import adminApi from '@/api/admin-client'
import { format } from 'date-fns'

interface ChatSession {
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

export function UserSessionsPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  const loadSessions = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const response = await adminApi.chats.list({ userId, limit: 100 }) as any
      const data = response?.data?.sessions || []
      
      setSessions(data.map((s: any) => ({
        ...s,
        startedAt: new Date(s.startedAt),
        endedAt: s.endedAt ? new Date(s.endedAt) : null
      })))

      if (data.length > 0) {
        setUserEmail(data[0].userEmail)
      }
    } catch (err) {
      console.error('Failed to load sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [userId])

  const handleRowClick = (session: ChatSession) => {
    navigate(`/chats/sessions/${session.id}`)
  }

  const handleBack = () => {
    navigate('/chats')
  }

  const formatDuration = (startedAt: Date, endedAt: Date | null) => {
    if (!endedAt) return 'Active'
    
    const durationMs = endedAt.getTime() - startedAt.getTime()
    const minutes = Math.floor(durationMs / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const columns = [
    {
      header: 'Project',
      accessor: (session: ChatSession) => (
        <div>
          <div className="font-medium text-foreground">
            {session.projectTitle || 'No Project'}
          </div>
          <div className="text-xs text-muted-foreground">
            {session.projectId || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Started',
      accessor: (session: ChatSession) => (
        <div className="text-sm text-muted-foreground">
          {format(session.startedAt, 'MMM dd, yyyy HH:mm')}
        </div>
      ),
      sortable: true,
      sortKey: 'startedAt' as keyof ChatSession,
    },
    {
      header: 'Duration',
      accessor: (session: ChatSession) => (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="w-3 h-3" />
          {formatDuration(session.startedAt, session.endedAt)}
        </div>
      ),
    },
    {
      header: 'Messages',
      accessor: (session: ChatSession) => (
        <Badge variant="default" className="font-mono">
          {session.messageCount}
        </Badge>
      ),
      sortable: true,
      sortKey: 'messageCount' as keyof ChatSession,
    },
    {
      header: 'Function Calls',
      accessor: (session: ChatSession) => (
        <Badge variant="secondary" className="font-mono">
          {session.functionCallCount}
        </Badge>
      ),
      sortable: true,
      sortKey: 'functionCallCount' as keyof ChatSession,
    },
    {
      header: 'Files',
      accessor: (session: ChatSession) => (
        <div className="flex items-center gap-1 text-sm">
          <FileText className="w-3 h-3" />
          {session.filesCreated}
        </div>
      ),
      sortable: true,
      sortKey: 'filesCreated' as keyof ChatSession,
    },
    {
      header: 'Status',
      accessor: (session: ChatSession) => (
        <Badge variant={session.endedAt ? 'outline' : 'default'}>
          {session.endedAt ? 'Completed' : 'Active'}
        </Badge>
      ),
    },
  ]

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
        <Card className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

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
              Chat Sessions
            </h1>
          </div>
          <p className="text-muted-foreground">
            All chat sessions for {userEmail || 'user'}
          </p>
        </div>
        <Button onClick={loadSessions} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button 
              onClick={loadSessions}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Sessions
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {sessions.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Active Sessions
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {sessions.filter(s => !s.endedAt).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Messages
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {sessions.reduce((sum, s) => sum + s.messageCount, 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Files Created
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {sessions.reduce((sum, s) => sum + s.filesCreated, 0)}
          </div>
        </Card>
      </div>

      {/* Sessions Table */}
      <AdminDataTable
        data={sessions}
        columns={columns}
        onRowClick={handleRowClick}
        emptyMessage="No chat sessions found for this user"
        pageSize={50}
      />
    </div>
  )
}
