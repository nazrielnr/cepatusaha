import * as React from "react"
import { RefreshCwIcon, ActivityIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatCard } from "@/components/StatCard"
import { AdminDataTable, type Column } from "@/components/AdminDataTable"
import { LineChart } from "@/components/charts/LineChart"
import { useAdminData } from "@/hooks/useAdminData"
import adminApi from "@/api/admin-client"

interface FunctionExecution {
  id: string
  session_id: string
  project_id?: string
  function_name: string
  parameters: Record<string, any>
  result?: any
  status: 'pending' | 'running' | 'success' | 'error'
  error_message?: string
  executed_at: string
  execution_time_ms?: number
}

interface FunctionStats {
  functionName: string
  totalCalls: number
  successCount: number
  errorCount: number
  averageExecutionTime: number
  successRate: number
}

interface FunctionMetrics {
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
  functionStats: FunctionStats[]
  executionTrend: Array<{
    timestamp: string
    value: number
    label?: string
  }>
  recentFailures: FunctionExecution[]
}

interface ExecutionsResponse {
  executions: FunctionExecution[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Format execution time
 */
function formatExecutionTime(ms: number | undefined): string {
  if (ms === undefined || ms === null) return 'N/A'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function FunctionsPage() {
  const [selectedExecution, setSelectedExecution] = React.useState<FunctionExecution | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [functionFilter, setFunctionFilter] = React.useState<string>('all')

  // Fetch function stats
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useAdminData<{ status: string; data: FunctionMetrics }>(
    () => adminApi.functions.getStats(),
    { cacheTTL: 5 * 60 * 1000 }
  )

  // Fetch function executions
  const {
    data: executionsData,
    loading: executionsLoading,
    error: executionsError,
    refresh: refreshExecutions,
  } = useAdminData<{ status: string; data: ExecutionsResponse }>(
    () => adminApi.functions.list({
      page: 1,
      limit: 50,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      function_name: functionFilter !== 'all' ? functionFilter : undefined,
    }),
    { cacheTTL: 5 * 60 * 1000 }
  )

  const stats = statsData?.data
  const executions = executionsData?.data?.executions || []

  // Get unique function names for filter
  const functionNames = React.useMemo(() => {
    if (!stats) return []
    return stats.functionStats.map(f => f.functionName)
  }, [stats])

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([refreshStats(), refreshExecutions()])
  }

  // Handle view details
  const handleViewDetails = (execution: FunctionExecution) => {
    setSelectedExecution(execution)
    setDetailsOpen(true)
  }

  // Function executions table columns
  const executionColumns: Column<FunctionExecution>[] = [
    {
      header: "Function",
      accessor: (exec) => (
        <div className="font-medium">{exec.function_name}</div>
      ),
    },
    {
      header: "Status",
      accessor: (exec) => (
        <Badge
          variant={
            exec.status === 'success'
              ? 'default'
              : exec.status === 'error'
              ? 'destructive'
              : 'secondary'
          }
        >
          {exec.status === 'success' && <CheckCircleIcon className="mr-1 size-3" />}
          {exec.status === 'error' && <XCircleIcon className="mr-1 size-3" />}
          {exec.status}
        </Badge>
      ),
    },
    {
      header: "Execution Time",
      accessor: (exec) => formatExecutionTime(exec.execution_time_ms),
      sortable: true,
      sortKey: "execution_time_ms" as any,
    },
    {
      header: "Executed At",
      accessor: (exec) =>
        new Date(exec.executed_at).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      sortable: true,
      sortKey: "executed_at" as any,
    },
    {
      header: "Actions",
      accessor: (exec) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(exec)}
        >
          View Details
        </Button>
      ),
      className: "w-32",
    },
  ]

  // Function stats table columns
  const statsColumns: Column<FunctionStats>[] = [
    {
      header: "Function Name",
      accessor: (stat) => (
        <div className="font-medium">{stat.functionName}</div>
      ),
    },
    {
      header: "Total Calls",
      accessor: (stat) => stat.totalCalls.toLocaleString(),
      sortable: true,
      sortKey: "totalCalls" as any,
    },
    {
      header: "Success Rate",
      accessor: (stat) => (
        <Badge
          variant={
            stat.successRate >= 95
              ? 'default'
              : stat.successRate >= 80
              ? 'secondary'
              : 'destructive'
          }
        >
          {stat.successRate.toFixed(1)}%
        </Badge>
      ),
      sortable: true,
      sortKey: "successRate" as any,
    },
    {
      header: "Avg Execution Time",
      accessor: (stat) => formatExecutionTime(stat.averageExecutionTime),
      sortable: true,
      sortKey: "averageExecutionTime" as any,
    },
    {
      header: "Errors",
      accessor: (stat) => (
        <span className={stat.errorCount > 0 ? "text-destructive font-medium" : ""}>
          {stat.errorCount}
        </span>
      ),
      sortable: true,
      sortKey: "errorCount" as any,
    },
  ]

  if (statsLoading && !stats) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
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
          <h1 className="text-3xl font-bold tracking-tight">Function Executions</h1>
          <p className="text-muted-foreground">
            Monitor function call logs and performance
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCwIcon className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {(statsError || executionsError) && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {statsError || executionsError}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Executions"
          value={stats ? stats.totalExecutions.toLocaleString() : "0"}
          icon={<ActivityIcon className="size-10" />}
          loading={statsLoading}
        />
        <StatCard
          title="Success Rate"
          value={stats ? `${stats.successRate.toFixed(1)}%` : "0%"}
          icon={<CheckCircleIcon className="size-10" />}
          loading={statsLoading}
        />
        <StatCard
          title="Avg Execution Time"
          value={stats ? formatExecutionTime(stats.averageExecutionTime) : "0ms"}
          icon={<ClockIcon className="size-10" />}
          loading={statsLoading}
        />
      </div>

      {/* Execution Trend Chart */}
      {stats && stats.executionTrend && stats.executionTrend.length > 0 && (
        <LineChart
          data={stats.executionTrend.map((item) => ({
            date: item.label || item.timestamp,
            value: item.value,
          }))}
          title="Function Execution Trend"
          description="Number of function executions over the last 30 days"
          loading={statsLoading}
          valueFormatter={(value) => `${value} executions`}
        />
      )}

      {/* Function Statistics Table */}
      {stats && stats.functionStats.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Function Statistics</h2>
          <AdminDataTable
            data={stats.functionStats}
            columns={statsColumns}
            loading={statsLoading}
            emptyMessage="No function statistics found"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Recent Executions</h2>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={functionFilter} onValueChange={setFunctionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by function" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Functions</SelectItem>
            {functionNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Executions Table */}
      <AdminDataTable
        data={executions}
        columns={executionColumns}
        loading={executionsLoading}
        emptyMessage="No function executions found"
      />

      {/* Execution Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Function Execution Details</DialogTitle>
            <DialogDescription>
              Detailed information about this function execution
            </DialogDescription>
          </DialogHeader>
          {selectedExecution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Function Name</p>
                  <p className="text-sm font-mono">{selectedExecution.function_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedExecution.status === 'success'
                        ? 'default'
                        : selectedExecution.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {selectedExecution.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Execution Time</p>
                  <p className="text-sm">{formatExecutionTime(selectedExecution.execution_time_ms)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Executed At</p>
                  <p className="text-sm">
                    {new Date(selectedExecution.executed_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Parameters */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Parameters</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                  {JSON.stringify(selectedExecution.parameters, null, 2)}
                </pre>
              </div>

              {/* Result */}
              {selectedExecution.result && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Result</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                    {JSON.stringify(selectedExecution.result, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Message */}
              {selectedExecution.error_message && (
                <div>
                  <p className="text-sm font-medium text-destructive mb-2">Error Message</p>
                  <pre className="text-xs bg-destructive/10 text-destructive p-3 rounded-md overflow-auto max-h-48">
                    {selectedExecution.error_message}
                  </pre>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
