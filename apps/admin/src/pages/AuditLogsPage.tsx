import * as React from "react"
import { RefreshCwIcon, ShieldCheckIcon, ActivityIcon, UserIcon } from "lucide-react"
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
import { BarChart } from "@/components/charts/BarChart"
import { useAdminData } from "@/hooks/useAdminData"
import adminApi from "@/api/admin-client"

interface AuditLog {
  id: string
  admin_user_id: string
  action_type: string
  resource_type: string
  resource_id: string | null
  action_details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface AuditLogStats {
  totalLogs: number
  logsByActionType: Record<string, number>
  logsByResourceType: Record<string, number>
  mostActiveAdmins: Array<{
    userId: string
    actionCount: number
  }>
  recentActivity: Record<string, number>
}

interface AuditLogsResponse {
  logs: AuditLog[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [actionFilter, setActionFilter] = React.useState<string>('all')
  const [resourceFilter, setResourceFilter] = React.useState<string>('all')

  // Fetch audit log stats
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useAdminData<{ status: string; data: AuditLogStats }>(
    () => adminApi.auditLogs.getStats(),
    { cacheTTL: 5 * 60 * 1000 }
  )

  // Fetch audit logs
  const {
    data: logsData,
    loading: logsLoading,
    error: logsError,
    refresh: refreshLogs,
  } = useAdminData<{ status: string; data: AuditLogsResponse }>(
    () => adminApi.auditLogs.list({
      limit: 50,
      offset: 0,
      action_type: actionFilter !== 'all' ? actionFilter : undefined,
      resource_type: resourceFilter !== 'all' ? resourceFilter : undefined,
    }),
    { cacheTTL: 5 * 60 * 1000 }
  )

  const stats = statsData?.data
  const logs = logsData?.data?.logs || []

  // Get unique action types for filter
  const actionTypes = React.useMemo(() => {
    if (!stats) return []
    return Object.keys(stats.logsByActionType)
  }, [stats])

  // Get unique resource types for filter
  const resourceTypes = React.useMemo(() => {
    if (!stats) return []
    return Object.keys(stats.logsByResourceType)
  }, [stats])

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([refreshStats(), refreshLogs()])
  }

  // Handle view details
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  // Format action type for display
  const formatActionType = (action: string): string => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Audit logs table columns
  const logColumns: Column<AuditLog>[] = [
    {
      header: "Action",
      accessor: (log) => (
        <div className="font-medium">{formatActionType(log.action_type)}</div>
      ),
    },
    {
      header: "Resource",
      accessor: (log) => (
        <Badge variant="outline">{log.resource_type}</Badge>
      ),
    },
    {
      header: "Admin User",
      accessor: (log) => (
        <div className="text-sm font-mono">{log.admin_user_id.substring(0, 8)}...</div>
      ),
    },
    {
      header: "Timestamp",
      accessor: (log) =>
        new Date(log.created_at).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      sortable: true,
      sortKey: "created_at" as any,
    },
    {
      header: "Actions",
      accessor: (log) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(log)}
        >
          View Details
        </Button>
      ),
      className: "w-32",
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
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track administrative actions and system changes
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCwIcon className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {(statsError || logsError) && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {statsError || logsError}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Audit Logs"
          value={stats ? stats.totalLogs.toLocaleString() : "0"}
          icon={<ShieldCheckIcon className="size-10" />}
          loading={statsLoading}
        />
        <StatCard
          title="Action Types"
          value={stats ? Object.keys(stats.logsByActionType).length.toLocaleString() : "0"}
          icon={<ActivityIcon className="size-10" />}
          loading={statsLoading}
        />
        <StatCard
          title="Active Admins"
          value={stats ? stats.mostActiveAdmins.length.toLocaleString() : "0"}
          icon={<UserIcon className="size-10" />}
          loading={statsLoading}
        />
      </div>

      {/* Actions by Type Chart */}
      {stats && Object.keys(stats.logsByActionType).length > 0 && (
        <BarChart
          data={Object.entries(stats.logsByActionType).map(([action, count]) => ({
            name: formatActionType(action),
            value: count,
          }))}
          title="Actions by Type"
          description="Distribution of admin actions"
          loading={statsLoading}
        />
      )}

      {/* Most Active Admins */}
      {stats && stats.mostActiveAdmins.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-semibold mb-4">Most Active Admins</h3>
          <div className="space-y-2">
            {stats.mostActiveAdmins.slice(0, 5).map((admin, index) => (
              <div key={admin.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <span className="text-sm font-mono">{admin.userId.substring(0, 12)}...</span>
                </div>
                <Badge variant="secondary">{admin.actionCount} actions</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Audit Log History</h2>
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((action) => (
              <SelectItem key={action} value={action}>
                {formatActionType(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {resourceTypes.map((resource) => (
              <SelectItem key={resource} value={resource}>
                {resource}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs Table */}
      <AdminDataTable
        data={logs}
        columns={logColumns}
        loading={logsLoading}
        emptyMessage="No audit logs found"
      />

      {/* Log Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this administrative action
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action Type</p>
                  <p className="text-sm font-medium">{formatActionType(selectedLog.action_type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resource Type</p>
                  <Badge variant="outline">{selectedLog.resource_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admin User ID</p>
                  <p className="text-sm font-mono">{selectedLog.admin_user_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedLog.resource_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resource ID</p>
                    <p className="text-sm font-mono">{selectedLog.resource_id}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                    <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {/* Action Details */}
              {selectedLog.action_details && Object.keys(selectedLog.action_details).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Action Details</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                    {JSON.stringify(selectedLog.action_details, null, 2)}
                  </pre>
                </div>
              )}

              {/* User Agent */}
              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">User Agent</p>
                  <p className="text-xs bg-muted p-3 rounded-md break-all">
                    {selectedLog.user_agent}
                  </p>
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
