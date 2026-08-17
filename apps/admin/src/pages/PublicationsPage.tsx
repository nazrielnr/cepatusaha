import * as React from "react"
import { RefreshCwIcon, ExternalLinkIcon, TrendingUpIcon, FolderIcon } from "lucide-react"
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
import { StatCard } from "@/components/StatCard"
import { AdminDataTable, type Column } from "@/components/AdminDataTable"
import { LineChart } from "@/components/charts/LineChart"
import { useAdminData } from "@/hooks/useAdminData"
import adminApi from "@/api/admin-client"

interface Publication {
  id: string
  projectId: string
  projectTitle: string
  userId: string
  userName: string
  publishedUrl: string
  publishedAt: string
  metadata?: Record<string, any>
}

interface PublicationStats {
  totalPublications: number
  publicationFrequency: Array<{
    timestamp: string
    value: number
    label?: string
  }>
  topPublishedProjects: Array<{
    projectId: string
    projectTitle: string
    publicationCount: number
    lastPublished: string
  }>
  recentPublications: Publication[]
}

interface PublicationsResponse {
  publications: Publication[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export function PublicationsPage() {
  const [selectedPublication, setSelectedPublication] = React.useState<Publication | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  // Fetch publication stats
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useAdminData<{ status: string; data: PublicationStats }>(
    () => adminApi.publications.getStats(),
    { cacheTTL: 5 * 60 * 1000 }
  )

  // Fetch publications list
  const {
    data: publicationsData,
    loading: publicationsLoading,
    error: publicationsError,
    refresh: refreshPublications,
  } = useAdminData<{ status: string; data: PublicationsResponse }>(
    () => adminApi.publications.list({ page: 1, limit: 50 }),
    { cacheTTL: 5 * 60 * 1000 }
  )

  const stats = statsData?.data
  const publications = publicationsData?.data?.publications || []

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([refreshStats(), refreshPublications()])
  }

  // Handle view details
  const handleViewDetails = (publication: Publication) => {
    setSelectedPublication(publication)
    setDetailsOpen(true)
  }

  // Publications table columns
  const publicationColumns: Column<Publication>[] = [
    {
      header: "Project",
      accessor: (pub) => (
        <div>
          <div className="font-medium">{pub.projectTitle}</div>
          <div className="text-sm text-muted-foreground">{pub.userName}</div>
        </div>
      ),
    },
    {
      header: "Published URL",
      accessor: (pub) => (
        <a
          href={pub.publishedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          {pub.publishedUrl.replace(/^https?:\/\//, "")}
          <ExternalLinkIcon className="size-3" />
        </a>
      ),
    },
    {
      header: "Published At",
      accessor: (pub) =>
        new Date(pub.publishedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      sortable: true,
      sortKey: "publishedAt" as any,
    },
    {
      header: "Status",
      accessor: () => <Badge variant="secondary">Active</Badge>,
    },
    {
      header: "Actions",
      accessor: (pub) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(pub)}
        >
          View Details
        </Button>
      ),
      className: "w-32",
    },
  ]

  // Top projects table columns
  const topProjectsColumns: Column<PublicationStats["topPublishedProjects"][0]>[] = [
    {
      header: "Project",
      accessor: (project) => (
        <div className="font-medium">{project.projectTitle}</div>
      ),
    },
    {
      header: "Publications",
      accessor: (project) => (
        <Badge variant="outline">{project.publicationCount}</Badge>
      ),
      sortable: true,
      sortKey: "publicationCount" as any,
    },
    {
      header: "Last Published",
      accessor: (project) =>
        new Date(project.lastPublished).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sortable: true,
      sortKey: "lastPublished" as any,
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
          <h1 className="text-3xl font-bold tracking-tight">Publications</h1>
          <p className="text-muted-foreground">
            Track website deployments and publication history
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCwIcon className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {(statsError || publicationsError) && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {statsError || publicationsError}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Publications"
          value={stats ? stats.totalPublications.toLocaleString() : "0"}
          icon={<FolderIcon className="size-10" />}
          loading={statsLoading}
        />
        <StatCard
          title="Recent Publications"
          value={stats ? stats.recentPublications.length.toLocaleString() : "0"}
          icon={<TrendingUpIcon className="size-10" />}
          loading={statsLoading}
        />
        <StatCard
          title="Active Projects"
          value={stats ? stats.topPublishedProjects.length.toLocaleString() : "0"}
          icon={<FolderIcon className="size-10" />}
          loading={statsLoading}
        />
      </div>

      {/* Publication Frequency Chart */}
      {stats && stats.publicationFrequency && stats.publicationFrequency.length > 0 && (
        <LineChart
          data={stats.publicationFrequency.map((item) => ({
            date: item.label || item.timestamp,
            value: item.value,
          }))}
          title="Publication Frequency"
          description="Number of publications over the last 30 days"
          loading={statsLoading}
          valueFormatter={(value) => `${value} publications`}
        />
      )}

      {/* Top Published Projects */}
      {stats && stats.topPublishedProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Top Published Projects</h2>
          <AdminDataTable
            data={stats.topPublishedProjects}
            columns={topProjectsColumns}
            loading={statsLoading}
            emptyMessage="No projects found"
          />
        </div>
      )}

      {/* All Publications Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Publications</h2>
        <AdminDataTable
          data={publications}
          columns={publicationColumns}
          loading={publicationsLoading}
          emptyMessage="No publications found"
        />
      </div>

      {/* Publication Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publication Details</DialogTitle>
            <DialogDescription>
              Detailed information about this publication
            </DialogDescription>
          </DialogHeader>
          {selectedPublication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project</p>
                  <p className="text-sm">{selectedPublication.projectTitle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-sm">{selectedPublication.userName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Published URL</p>
                  <a
                    href={selectedPublication.publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {selectedPublication.publishedUrl}
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Published At</p>
                  <p className="text-sm">
                    {new Date(selectedPublication.publishedAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              {selectedPublication.metadata && Object.keys(selectedPublication.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadata</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                    {JSON.stringify(selectedPublication.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedPublication.publishedUrl, "_blank")}
                >
                  <ExternalLinkIcon className="mr-2 size-4" />
                  Visit Site
                </Button>
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
