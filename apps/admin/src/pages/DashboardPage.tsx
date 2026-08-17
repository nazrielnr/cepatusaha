import { RefreshCwIcon, UsersIcon, FolderIcon, MessageSquareIcon, HardDriveIcon, TrendingUpIcon, ActivityIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/StatCard"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Skeleton } from "@/components/ui/skeleton"
import { GrowthChart } from "@/components/GrowthChart"
import { useAdminData } from "@/hooks/useAdminData"
import adminApi from "@/api/admin-client"
import { Link } from "react-router-dom"

interface Statistics {
  totalUsers: number
  totalProjects: number
  totalSessions: number
  storageUsed: number
  userGrowth?: number
  projectGrowth?: number
  sessionGrowth?: number
  userGrowthData?: Array<{ date: string; value: number }>
  projectGrowthData?: Array<{ date: string; value: number }>
}

interface StatisticsResponse {
  status: string
  data: Statistics
}

export function DashboardPage() {
  const { data, loading, error, refresh } = useAdminData<StatisticsResponse>(
    () => adminApi.statistics.getAll() as Promise<StatisticsResponse>,
    { pollInterval: 30000 } // Auto-refresh every 30 seconds
  )

  const stats = data?.data
  
  console.log('[DashboardPage] data:', data)
  console.log('[DashboardPage] loading:', loading)
  console.log('[DashboardPage] error:', error)
  console.log('[DashboardPage] stats:', stats)

  // Helper function to format trend data
  const formatTrend = (value?: number) => {
    if (value === undefined) return undefined
    return {
      value: Math.abs(value),
      isPositive: value >= 0,
    }
  }

  // Helper function to format storage size
  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 B'
    if (bytes < 1024) return `${bytes.toFixed(2)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCwIcon className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <ErrorMessage
          error={error}
          title="Failed to load statistics"
          onRetry={refresh}
          className="mb-6"
        />
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading && !stats ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<UsersIcon className="size-6" />}
              trend={formatTrend(stats.userGrowth)}
              loading={loading}
            />
            <StatCard
              title="Total Projects"
              value={stats.totalProjects}
              icon={<FolderIcon className="size-6" />}
              trend={formatTrend(stats.projectGrowth)}
              loading={loading}
            />
            <StatCard
              title="Total Sessions"
              value={stats.totalSessions}
              icon={<MessageSquareIcon className="size-6" />}
              trend={formatTrend(stats.sessionGrowth)}
              loading={loading}
            />
            <StatCard
              title="Storage Used"
              value={formatStorage(stats.storageUsed)}
              icon={<HardDriveIcon className="size-6" />}
              loading={loading}
            />
          </>
        ) : null}
      </div>

      {/* Growth Trend Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GrowthChart
          title="User Growth"
          description="New users over time"
          data={stats?.userGrowthData || []}
          dataKey="value"
          color="hsl(var(--chart-1))"
          loading={loading && !stats}
        />
        <GrowthChart
          title="Project Creation"
          description="New projects over time"
          data={stats?.projectGrowthData || []}
          dataKey="value"
          color="hsl(var(--chart-2))"
          loading={loading && !stats}
        />
      </div>

      {/* Quick Actions & System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="size-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/users">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <UsersIcon className="size-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link to="/chats">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <MessageSquareIcon className="size-4 mr-2" />
                Monitor Chats
              </Button>
            </Link>
            <Link to="/tokens">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <ActivityIcon className="size-4 mr-2" />
                View Token Usage
              </Button>
            </Link>
            <Link to="/audit-logs">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <AlertCircleIcon className="size-4 mr-2" />
                Audit Logs
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* System Health Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="size-5" />
              System Health
            </CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Status</span>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-accent0" />
                <span className="text-sm font-medium">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-accent0" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">AI Providers</span>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-accent0" />
                <span className="text-sm font-medium">Available</span>
              </div>
            </div>
            <Link to="/health">
              <Button variant="link" className="w-full p-0 h-auto text-sm" size="sm">
                View Detailed Health →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="size-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest administrative actions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && (stats.totalUsers > 0 || stats.totalProjects > 0 || stats.totalSessions > 0) ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Users</span>
                  <span className="font-medium">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Projects</span>
                  <span className="font-medium">{stats.totalProjects}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Sessions</span>
                  <span className="font-medium">{stats.totalSessions}</span>
                </div>
                <Link to="/analytics">
                  <Button variant="link" className="w-full p-0 h-auto text-sm" size="sm">
                    View Full Analytics →
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  No activity data available yet
                </p>
                <Link to="/users">
                  <Button variant="outline" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty State Helper */}
      {stats && stats.totalUsers === 0 && stats.totalProjects === 0 && stats.totalSessions === 0 && (
        <Card className="mt-6 border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUpIcon className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome to CepatUsaha Admin Dashboard</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your dashboard is ready! As users start creating projects and chatting with the AI, 
                you'll see activity and statistics appear here.
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/users">
                  <Button>
                    <UsersIcon className="size-4 mr-2" />
                    View Users
                  </Button>
                </Link>
                <Link to="/models">
                  <Button variant="outline">
                    Configure AI Models
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
