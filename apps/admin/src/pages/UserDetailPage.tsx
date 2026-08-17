import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminDataTable } from '@/components/AdminDataTable'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  FolderOpen, 
  MessageSquare,
  Clock,
  Activity
} from 'lucide-react'
import adminApi from '@/api/admin-client'

interface UserDetail {
  id: string
  email: string
  name: string
  clerkUserId: string
  createdAt: string
  projectCount: number
  sessionCount: number
  lastActiveAt: string | null
  totalTokens: number
  totalCost: number
}

interface Project {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface Session {
  id: string
  started_at: string
  ended_at: string | null
}

interface ActivityEvent {
  eventType: string
  eventDetail: string
  timestamp: string
}

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  
  const [user, setUser] = useState<UserDetail | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [timeline, setTimeline] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadUserDetail()
      loadUserTimeline()
    }
  }, [userId])

  const loadUserDetail = async () => {
    try {
      setLoading(true)
      const response: any = await adminApi.users.get(userId!)
      
      if (response.status === 'success') {
        const userData = response.data.user
        // Transform snake_case to camelCase
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          clerkUserId: userData.clerk_user_id,
          createdAt: userData.created_at,
          projectCount: userData.project_count || 0,
          sessionCount: userData.session_count || 0,
          lastActiveAt: userData.last_active,
          totalTokens: userData.total_tokens || 0,
          totalCost: userData.total_cost || 0
        })
        setProjects(response.data.recent_projects || [])
        setSessions(response.data.recent_sessions || [])
      } else {
        throw new Error(response.error?.message || 'Failed to load user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user detail')
      console.error('Failed to load user detail:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadUserTimeline = async () => {
    try {
      const response: any = await adminApi.analytics.getUserTimeline(userId!)
      
      if (response.status === 'success') {
        setTimeline(response.data.events || [])
      }
    } catch (err) {
      console.error('Failed to load user timeline:', err)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Unknown'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/users')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <div className="bg-destructive dark:bg-destructive/20 border border-destructive dark:border-destructive rounded-lg p-4">
          <p className="text-destructive dark:text-destructive">
            {error || 'User not found'}
          </p>
          <Button
            onClick={loadUserDetail}
            className="mt-2"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/users')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {user.name || 'User Detail'}
          </h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary dark:bg-primary/20 rounded-lg">
                <FolderOpen className="h-6 w-6 text-primary dark:text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{user.projectCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent dark:bg-accent/20 rounded-lg">
                <MessageSquare className="h-6 w-6 text-accent dark:text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{user.sessionCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent dark:bg-accent/20 rounded-lg">
                <Activity className="h-6 w-6 text-accent dark:text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">{(user.totalTokens || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive dark:bg-destructive/20 rounded-lg">
                <Clock className="h-6 w-6 text-destructive dark:text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Active</p>
                <p className="text-sm font-medium">
                  {user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Details */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user.name || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Registered</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="font-medium">${(user.totalCost || 0).toFixed(4)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <AdminDataTable
              data={projects}
              columns={[
                {
                  header: 'Title',
                  accessor: (project) => (
                    <span className="font-medium">{project.title}</span>
                  ),
                },
                {
                  header: 'Created',
                  accessor: (project) => formatDate(project.created_at),
                },
                {
                  header: 'Updated',
                  accessor: (project) => formatDate(project.updated_at),
                },
              ]}
              emptyMessage="No projects found"
              pageSize={10}
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No projects yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <AdminDataTable
              data={sessions}
              columns={[
                {
                  header: 'Started',
                  accessor: (session) => formatDateTime(session.started_at),
                },
                {
                  header: 'Ended',
                  accessor: (session) => formatDateTime(session.ended_at),
                },
                {
                  header: 'Status',
                  accessor: (session) => (
                    <Badge variant={session.ended_at ? 'secondary' : 'default'}>
                      {session.ended_at ? 'Completed' : 'Active'}
                    </Badge>
                  ),
                },
              ]}
              emptyMessage="No sessions found"
              pageSize={10}
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No sessions yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.slice(0, 20).map((event, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary0" />
                  <div className="flex-1">
                    <p className="font-medium">{event.eventType}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.eventDetail}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No activity yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
