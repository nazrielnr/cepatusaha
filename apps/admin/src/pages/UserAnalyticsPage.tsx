import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/StatCard'
import { AdminDataTable } from '@/components/AdminDataTable'
import { BarChart } from '@/components/BarChart'
import { Users, MessageSquare, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import adminApi from '@/api/admin-client'

interface EngagementMetrics {
  totalUsers: number
  activeUsers: number
  averageSessionDuration: number
  averageMessagesPerSession: number
  retentionRate: number
}

interface ActiveUser {
  id: string
  email: string
  name: string
  sessionCount: number
  messageCount: number
  lastActive: string
}

interface FeatureUsage {
  name: string
  value: number
}

interface UserJourney {
  step: string
  users: number
  conversionRate: number
}

export function UserAnalyticsPage() {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null)
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([])
  const [userJourney, setUserJourney] = useState<UserJourney[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const response = await adminApi.analytics.getUsers()
      
      // Extract data from response
      const data = response?.data || {}
      
      // Calculate total and active users from mostActiveUsers
      const activeUsersList = data.mostActiveUsers || []
      const totalUsers = activeUsersList.length
      const activeUsers = activeUsersList.filter((u: any) => {
        const lastActive = new Date(u.lastActive)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return lastActive >= thirtyDaysAgo
      }).length

      // Calculate retention rate from user journeys
      const journeys = data.userJourneys || []
      const retentionRate = journeys.length > 0 && journeys[0].userCount > 0
        ? ((journeys[journeys.length - 1]?.userCount || 0) / journeys[0].userCount) * 100
        : 0

      setMetrics({
        totalUsers,
        activeUsers,
        averageSessionDuration: data.engagementMetrics?.averageSessionDuration || 0,
        averageMessagesPerSession: data.engagementMetrics?.averageMessagesPerSession || 0,
        retentionRate,
      })

      // Set most active users
      setActiveUsers(activeUsersList)

      // Transform feature usage for chart
      const features = data.featureUsage || []
      setFeatureUsage(features.map((f: any) => ({
        name: f.feature,
        value: f.usageCount
      })))

      // Transform user journeys
      const journeyData = data.userJourneys || []
      setUserJourney(journeyData.map((j: any) => ({
        step: j.stage,
        users: j.userCount,
        conversionRate: j.conversionRate
      })))
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
      console.error('Failed to load user analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-destructive dark:bg-destructive/20 border border-destructive dark:border-destructive rounded-lg p-4">
          <p className="text-destructive dark:text-destructive">Error: {error}</p>
          <button
            onClick={loadMetrics}
            className="mt-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Advanced user behavior and retention analysis
        </p>
      </div>

      {/* Engagement Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          icon={<Users className="h-8 w-8" />}
          loading={loading}
        />
        <StatCard
          title="Active Users"
          value={metrics?.activeUsers || 0}
          icon={<TrendingUp className="h-8 w-8" />}
          loading={loading}
        />
        <StatCard
          title="Avg Session Duration"
          value={metrics ? `${Math.round(metrics.averageSessionDuration / 60)}m` : '0m'}
          icon={<Clock className="h-8 w-8" />}
          loading={loading}
        />
        <StatCard
          title="Avg Messages/Session"
          value={metrics?.averageMessagesPerSession.toFixed(1) || '0'}
          icon={<MessageSquare className="h-8 w-8" />}
          loading={loading}
        />
      </div>

      {/* Retention Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Retention</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Retention Rate</span>
                <span className="text-2xl font-bold text-gray-900">
                  {metrics?.retentionRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary0 h-2 rounded-full transition-all"
                  style={{ width: `${metrics?.retentionRate || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Percentage of users who return after their first session
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Active Users Section */}
      <Card>
        <CardHeader>
          <CardTitle>Most Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <AdminDataTable
              data={activeUsers}
              columns={[
                {
                  header: 'Email',
                  accessor: (user) => user.email,
                },
                {
                  header: 'Name',
                  accessor: (user) => user.name || '-',
                },
                {
                  header: 'Sessions',
                  accessor: (user) => (
                    <span className="font-semibold text-primary">
                      {user.sessionCount}
                    </span>
                  ),
                },
                {
                  header: 'Messages',
                  accessor: (user) => (
                    <span className="font-semibold text-accent">
                      {user.messageCount}
                    </span>
                  ),
                },
                {
                  header: 'Last Active',
                  accessor: (user) => new Date(user.lastActive).toLocaleDateString(),
                },
              ]}
              emptyMessage="No active users found"
            />
          )}
        </CardContent>
      </Card>

      {/* Feature Usage Section */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px]" />
          ) : featureUsage.length > 0 ? (
            <BarChart
              data={featureUsage}
              title="Feature Usage"
              color="#6366f1"
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No feature usage data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Journey Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>User Journey</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Typical user path from registration to publication
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64" />
          ) : userJourney.length > 0 ? (
            <div className="space-y-4">
              {userJourney.map((step, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{step.step}</p>
                        <p className="text-sm text-gray-600">{step.users} users</p>
                      </div>
                    </div>
                    <Badge
                      variant={step.conversionRate >= 50 ? 'default' : 'secondary'}
                      className="text-sm"
                    >
                      {step.conversionRate.toFixed(1)}% conversion
                    </Badge>
                  </div>
                  {index < userJourney.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No user journey data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
