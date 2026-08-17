import * as React from "react"
import { RefreshCwIcon, PackageIcon, TrendingUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatCard } from "@/components/StatCard"
import { AdminDataTable, type Column } from "@/components/AdminDataTable"
import { PieChart } from "@/components/charts/PieChart"
import { useAdminData } from "@/hooks/useAdminData"
import adminApi from "@/api/admin-client"

interface Dependency {
  id: string
  projectId: string
  projectTitle: string
  depType: string
  depName: string
  version?: string
  addedAt: string
}

interface DependencyStats {
  totalDependencies: number
  dependencyTypeDistribution: Array<{
    category: string
    value: number
    percentage?: number
  }>
  mostUsedDependencies: Array<{
    depName: string
    depType: string
    usageCount: number
    versions: string[]
  }>
}

interface DependenciesResponse {
  dependencies: Dependency[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export function DependenciesPage() {
  const [typeFilter, setTypeFilter] = React.useState<string>('all')

  // Fetch dependency stats
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useAdminData<{ status: string; data: DependencyStats }>(
    () => adminApi.dependencies.getStats(),
    { cacheTTL: 5 * 60 * 1000 }
  )

  // Fetch dependencies list
  const {
    data: depsData,
    loading: depsLoading,
    error: depsError,
    refresh: refreshDeps,
  } = useAdminData<{ status: string; data: DependenciesResponse }>(
    () => adminApi.dependencies.list({
      page: 1,
      limit: 50,
      depType: typeFilter !== 'all' ? typeFilter : undefined,
    }),
    { cacheTTL: 5 * 60 * 1000 }
  )

  const stats = statsData?.data
  const dependencies = depsData?.data?.dependencies || []

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([refreshStats(), refreshDeps()])
  }

  // Dependencies table columns
  const dependencyColumns: Column<Dependency>[] = [
    {
      header: "Name",
      accessor: (dep) => (
        <div className="font-medium font-mono text-sm">{dep.depName}</div>
      ),
    },
    {
      header: "Type",
      accessor: (dep) => (
        <Badge variant="outline">{dep.depType}</Badge>
      ),
    },
    {
      header: "Version",
      accessor: (dep) => (
        <span className="text-sm text-muted-foreground">
          {dep.version || 'N/A'}
        </span>
      ),
    },
    {
      header: "Project",
      accessor: (dep) => (
        <div className="text-sm">{dep.projectTitle}</div>
      ),
    },
    {
      header: "Added At",
      accessor: (dep) =>
        new Date(dep.addedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sortable: true,
      sortKey: "addedAt" as any,
    },
  ]

  // Most used dependencies table columns
  const mostUsedColumns: Column<DependencyStats["mostUsedDependencies"][0]>[] = [
    {
      header: "Dependency",
      accessor: (dep) => (
        <div className="font-medium font-mono text-sm">{dep.depName}</div>
      ),
    },
    {
      header: "Type",
      accessor: (dep) => (
        <Badge variant="outline">{dep.depType}</Badge>
      ),
    },
    {
      header: "Usage Count",
      accessor: (dep) => (
        <Badge variant="secondary">{dep.usageCount} projects</Badge>
      ),
      sortable: true,
      sortKey: "usageCount" as any,
    },
    {
      header: "Versions",
      accessor: (dep) => (
        <div className="text-sm text-muted-foreground">
          {dep.versions.length > 0 ? dep.versions.join(', ') : 'N/A'}
        </div>
      ),
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
          <h1 className="text-3xl font-bold tracking-tight">Dependencies</h1>
          <p className="text-muted-foreground">
            Track project dependencies and usage patterns
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCwIcon className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {(statsError || depsError) && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {statsError || depsError}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Dependencies"
          value={stats ? stats.totalDependencies.toLocaleString() : "0"}
          icon={<PackageIcon className="size-10" />}
          loading={statsLoading}
        />
        <StatCard
          title="Dependency Types"
          value={stats ? stats.dependencyTypeDistribution.length.toLocaleString() : "0"}
          icon={<TrendingUpIcon className="size-10" />}
          loading={statsLoading}
        />
        <StatCard
          title="Unique Packages"
          value={stats ? stats.mostUsedDependencies.length.toLocaleString() : "0"}
          icon={<PackageIcon className="size-10" />}
          loading={statsLoading}
        />
      </div>

      {/* Dependency Type Distribution Chart */}
      {stats && stats.dependencyTypeDistribution.length > 0 && (
        <PieChart
          data={stats.dependencyTypeDistribution.map((item) => ({
            name: item.category,
            value: item.value,
          }))}
          title="Dependency Type Distribution"
          description="Distribution of dependencies by type"
          loading={statsLoading}
          valueFormatter={(value) => `${value} dependencies`}
        />
      )}

      {/* Most Used Dependencies */}
      {stats && stats.mostUsedDependencies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Most Used Dependencies</h2>
          <AdminDataTable
            data={stats.mostUsedDependencies}
            columns={mostUsedColumns}
            loading={statsLoading}
            emptyMessage="No dependencies found"
          />
        </div>
      )}

      {/* All Dependencies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Dependencies</h2>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="npm">NPM</SelectItem>
              <SelectItem value="cdn">CDN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AdminDataTable
          data={dependencies}
          columns={dependencyColumns}
          loading={depsLoading}
          emptyMessage="No dependencies found"
        />
      </div>
    </div>
  )
}
