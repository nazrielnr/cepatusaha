import * as React from "react"
import { RefreshCwIcon, ActivityIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/StatCard"
import { LineChart } from "@/components/charts/LineChart"
import { useAdminData } from "@/hooks/useAdminData"
import adminApi from "@/api/admin-client"

interface SystemHealthData {
  errorRates: {
    validationErrors: number
    authenticationErrors: number
    aiErrors: number
    databaseErrors: number
    totalErrors: number
    errorTrend: Array<{
      timestamp: string
      value: number
      label?: string
    }>
  }
  apiPerformance: {
    averageResponseTime: number
    endpointMetrics: Array<{
      endpoint: string
      averageResponseTime: number
      requestCount: number
      errorRate: number
    }>
    performanceTrend: Array<{
      timestamp: string
      value: number
      label?: string
    }>
  }
  databaseHealth: {
    connectionPoolStatus: {
      active: number
      idle: number
      total: number
    }
    slowQueries: Array<{
      query: string
      executionTime: number
      timestamp: string
    }>
  }
  activeSessions: number
  timestamp: string
}

/**
 * Get health status based on metrics
 */
function getHealthStatus(data: SystemHealthData | undefined): {
  status: 'healthy' | 'warning' | 'critical'
  message: string
} {
  if (!data) {
    return { status: 'warning', message: 'Loading health data...' }
  }

  const { errorRates, apiPerformance } = data

  // Critical: High error rate or very slow response time
  if (errorRates.totalErrors > 100 || apiPerformance.averageResponseTime > 5000) {
    return { status: 'critical', message: 'System experiencing issues' }
  }

  // Warning: Moderate errors or slow response
  if (errorRates.totalErrors > 20 || apiPerformance.averageResponseTime > 2000) {
    return { status: 'warning', message: 'System performance degraded' }
  }

  return { status: 'healthy', message: 'All systems operational' }
}

/**
 * Format milliseconds to readable time
 */
function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

export function SystemHealthPage() {
  // Fetch system health (manual refresh only, no auto-polling)
  const {
    data: healthData,
    loading: healthLoading,
    error: healthError,
    refresh: refreshHealth,
  } = useAdminData<{ status: string; data: SystemHealthData }>(
    () => adminApi.health.getSystemHealth(),
    { 
      cacheTTL: 60 * 1000, // 60 seconds
      // pollInterval removed - user must manually refresh
    }
  )

  const health = healthData?.data
  const healthStatus = getHealthStatus(health)

  if (healthLoading && !health) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor system performance and service status
          </p>
        </div>
        <Button onClick={refreshHealth} variant="outline" size="sm">
          <RefreshCwIcon className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {healthError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {healthError}
        </div>
      )}

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {healthStatus.status === 'healthy' && (
              <CheckCircleIcon className="size-6 text-accent0" />
            )}
            {healthStatus.status === 'warning' && (
              <AlertTriangleIcon className="size-6 text-secondary0" />
            )}
            {healthStatus.status === 'critical' && (
              <XCircleIcon className="size-6 text-destructive0" />
            )}
            System Status
          </CardTitle>
          <CardDescription>{healthStatus.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                healthStatus.status === 'healthy'
                  ? 'default'
                  : healthStatus.status === 'warning'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {healthStatus.status.toUpperCase()}
            </Badge>
            {health && (
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date(health.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Errors (24h)"
          value={health ? health.errorRates.totalErrors.toLocaleString() : "0"}
          icon={<AlertTriangleIcon className="size-10" />}
          loading={healthLoading}
        />
        <StatCard
          title="Avg Response Time"
          value={health ? formatResponseTime(health.apiPerformance.averageResponseTime) : "0ms"}
          icon={<ActivityIcon className="size-10" />}
          loading={healthLoading}
        />
        <StatCard
          title="Active Sessions"
          value={health ? health.activeSessions.toLocaleString() : "0"}
          icon={<ActivityIcon className="size-10" />}
          loading={healthLoading}
        />
        <StatCard
          title="API Endpoints"
          value={health ? health.apiPerformance.endpointMetrics.length.toLocaleString() : "0"}
          icon={<ActivityIcon className="size-10" />}
          loading={healthLoading}
        />
      </div>

      {/* Error Trend Chart */}
      {health && health.errorRates.errorTrend && health.errorRates.errorTrend.length > 0 && (
        <LineChart
          data={health.errorRates.errorTrend.map((item) => ({
            date: item.label || item.timestamp,
            value: item.value,
          }))}
          title="Error Rate Trend"
          description="Number of errors over the last 24 hours"
          loading={healthLoading}
          valueFormatter={(value) => `${value} errors`}
        />
      )}

      {/* Performance Trend Chart */}
      {health && health.apiPerformance.performanceTrend && health.apiPerformance.performanceTrend.length > 0 && (
        <LineChart
          data={health.apiPerformance.performanceTrend.map((item) => ({
            date: item.label || item.timestamp,
            value: item.value,
          }))}
          title="API Performance Trend"
          description="Average response time over the last 24 hours"
          loading={healthLoading}
          valueFormatter={formatResponseTime}
        />
      )}

      {/* Error Breakdown */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>Error Breakdown (24h)</CardTitle>
            <CardDescription>Errors by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Validation Errors</p>
                <p className="text-2xl font-bold">{health.errorRates.validationErrors}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Authentication Errors</p>
                <p className="text-2xl font-bold">{health.errorRates.authenticationErrors}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">AI Errors</p>
                <p className="text-2xl font-bold">{health.errorRates.aiErrors}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Database Errors</p>
                <p className="text-2xl font-bold">{health.errorRates.databaseErrors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoint Performance */}
      {health && health.apiPerformance.endpointMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Performance</CardTitle>
            <CardDescription>Performance metrics by endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {health.apiPerformance.endpointMetrics
                .sort((a, b) => b.requestCount - a.requestCount)
                .slice(0, 10)
                .map((endpoint) => (
                  <div
                    key={endpoint.endpoint}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{endpoint.endpoint}</p>
                      <p className="text-sm text-muted-foreground">
                        {endpoint.requestCount} requests
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatResponseTime(endpoint.averageResponseTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">avg response</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            endpoint.errorRate > 5
                              ? 'destructive'
                              : endpoint.errorRate > 1
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {endpoint.errorRate.toFixed(1)}% errors
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
