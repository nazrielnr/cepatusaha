import * as React from "react"
import { RefreshCwIcon, HardDriveIcon, FolderIcon, UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatCard } from "@/components/StatCard"
import { AdminDataTable, type Column } from "@/components/AdminDataTable"
import { PieChart } from "@/components/charts/PieChart"
import { LineChart } from "@/components/charts/LineChart"
import { useAdminData } from "@/hooks/useAdminData"
import adminApi from "@/api/admin-client"

interface StorageMetrics {
  totalStorage: number
  totalAssets: number
  storageByUser: Array<{
    userId: string
    userEmail: string
    userName: string
    totalStorage: number
    assetCount: number
    projectCount: number
  }>
  assetTypeDistribution: Array<{
    category: string
    value: number
    percentage?: number
  }>
  storageTrend: Array<{
    timestamp: string
    value: number
    label?: string
  }>
}

interface Asset {
  id: string
  projectId: string
  projectTitle: string
  assetType: string
  filePath: string
  storageUrl: string
  fileSize: number
  uploadedAt: string
  isOrphaned: boolean
}

interface AssetsResponse {
  assets: Asset[]
  total: number
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function StoragePage() {
  const [showAssets, setShowAssets] = React.useState(false)
  const [selectedAssets, setSelectedAssets] = React.useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  // Fetch storage metrics
  const {
    data: metricsData,
    loading: metricsLoading,
    error: metricsError,
    refresh: refreshMetrics,
  } = useAdminData<{ status: string; data: StorageMetrics }>(
    () => adminApi.storage.getMetrics(),
    { cacheTTL: 5 * 60 * 1000 }
  )

  // Fetch assets list
  const {
    data: assetsData,
    loading: assetsLoading,
    error: assetsError,
    refresh: refreshAssets,
  } = useAdminData<{ status: string; data: AssetsResponse }>(
    () => adminApi.storage.listAssets(),
    { cacheTTL: 5 * 60 * 1000 }
  )

  const metrics = metricsData?.data
  const assets = assetsData?.data?.assets || []

  // Calculate average storage per user
  const avgStoragePerUser = metrics
    ? metrics.storageByUser.length > 0
      ? metrics.totalStorage / metrics.storageByUser.length
      : 0
    : 0

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([refreshMetrics(), refreshAssets()])
  }

  // Handle asset selection
  const handleSelectAsset = (assetId: string, checked: boolean) => {
    const newSelected = new Set(selectedAssets)
    if (checked) {
      newSelected.add(assetId)
    } else {
      newSelected.delete(assetId)
    }
    setSelectedAssets(newSelected)
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(new Set(assets.map((a) => a.id)))
    } else {
      setSelectedAssets(new Set())
    }
  }

  // Handle delete assets
  const handleDeleteAssets = async () => {
    try {
      await adminApi.storage.deleteAssets(Array.from(selectedAssets))
      setSelectedAssets(new Set())
      setDeleteDialogOpen(false)
      await handleRefresh()
    } catch (error) {
      console.error("Failed to delete assets:", error)
    }
  }

  // Storage by user table columns
  const userColumns: Column<StorageMetrics["storageByUser"][0]>[] = [
    {
      header: "User",
      accessor: (user) => (
        <div>
          <div className="font-medium">{user.userName || "Unknown"}</div>
          <div className="text-sm text-muted-foreground">{user.userEmail}</div>
        </div>
      ),
    },
    {
      header: "Storage Used",
      accessor: (user) => formatBytes(user.totalStorage),
      sortable: true,
      sortKey: "totalStorage" as any,
    },
    {
      header: "Assets",
      accessor: (user) => (user.assetCount || 0).toLocaleString(),
      sortable: true,
      sortKey: "assetCount" as any,
    },
    {
      header: "Projects",
      accessor: (user) => (user.projectCount || 0).toLocaleString(),
      sortable: true,
      sortKey: "projectCount" as any,
    },
  ]

  // Assets table columns
  const assetColumns: Column<Asset>[] = [
    {
      header: "Select",
      accessor: (asset) => (
        <Checkbox
          checked={selectedAssets.has(asset.id)}
          onCheckedChange={(checked) =>
            handleSelectAsset(asset.id, checked as boolean)
          }
        />
      ),
      className: "w-12",
    },
    {
      header: "File",
      accessor: (asset) => (
        <div>
          <div className="font-medium">{asset.filePath}</div>
          <div className="text-sm text-muted-foreground">
            {asset.projectTitle}
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (asset) => (
        <Badge variant="outline">{asset.assetType}</Badge>
      ),
    },
    {
      header: "Size",
      accessor: (asset) => formatBytes(asset.fileSize),
      sortable: true,
      sortKey: "fileSize" as any,
    },
    {
      header: "Uploaded",
      accessor: (asset) =>
        new Date(asset.uploadedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sortable: true,
      sortKey: "uploadedAt" as any,
    },
    {
      header: "Status",
      accessor: (asset) =>
        asset.isOrphaned ? (
          <Badge variant="destructive">Orphaned</Badge>
        ) : (
          <Badge variant="secondary">Active</Badge>
        ),
    },
  ]

  if (metricsLoading && !metrics) {
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
          <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
          <p className="text-muted-foreground">
            Monitor storage usage and manage assets
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCwIcon className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {(metricsError || assetsError) && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {metricsError || assetsError}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Storage Used"
          value={metrics ? formatBytes(metrics.totalStorage) : "0 B"}
          icon={<HardDriveIcon className="size-10" />}
          loading={metricsLoading}
        />
        <StatCard
          title="Total Assets"
          value={metrics ? (metrics.totalAssets || 0).toLocaleString() : "0"}
          icon={<FolderIcon className="size-10" />}
          loading={metricsLoading}
        />
        <StatCard
          title="Average per User"
          value={formatBytes(avgStoragePerUser)}
          icon={<UsersIcon className="size-10" />}
          loading={metricsLoading}
        />
      </div>

      {/* Storage Trend Chart */}
      {metrics && metrics.storageTrend && metrics.storageTrend.length > 0 && (
        <LineChart
          data={metrics.storageTrend.map((item) => ({
            date: item.label || item.timestamp,
            value: item.value,
          }))}
          title="Storage Growth Trend"
          description="Storage usage over the last 30 days"
          loading={metricsLoading}
          valueFormatter={formatBytes}
        />
      )}

      {/* Asset Type Distribution Chart */}
      {metrics && metrics.assetTypeDistribution.length > 0 && (
        <PieChart
          data={metrics.assetTypeDistribution.map((item) => ({
            name: item.category,
            value: item.value,
          }))}
          title="Asset Type Distribution"
          description="Distribution of assets by type"
          loading={metricsLoading}
          valueFormatter={(value) => `${value} assets`}
        />
      )}

      {/* Storage by User Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Storage by User</h2>
        <AdminDataTable
          data={metrics?.storageByUser || []}
          columns={userColumns}
          loading={metricsLoading}
          emptyMessage="No users found"
        />
      </div>

      {/* Assets Browser */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Assets</h2>
          <div className="flex items-center gap-2">
            {selectedAssets.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Selected ({selectedAssets.size})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssets(!showAssets)}
            >
              {showAssets ? "Hide Assets" : "Show Assets"}
            </Button>
          </div>
        </div>

        {showAssets && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  assets.length > 0 && selectedAssets.size === assets.length
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all assets
              </span>
            </div>
            <AdminDataTable
              data={assets}
              columns={assetColumns}
              loading={assetsLoading}
              emptyMessage="No assets found"
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assets</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAssets.size} asset(s)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssets}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
