import * as React from "react"
import { XIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminDataTable } from "@/components/AdminDataTable"
import type { Column } from "@/components/AdminDataTable"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminData } from "@/hooks/useAdminData"
import adminApi from "@/api/admin-client"

interface SessionTokenUsage {
  sessionId: string
  projectTitle: string
  modelName: string
  totalTokens: number
  promptTokens: number
  completionTokens: number
  estimatedCost: number
  messageCount: number
  startedAt: string
}

interface UserTokenDetailResponse {
  status: string
  data: {
    userId: string
    userEmail: string
    userName: string
    totalTokens: number
    totalCost: number
    sessions: SessionTokenUsage[]
  }
}

interface UserTokenDetailDialogProps {
  userId: string | null
  userEmail: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserTokenDetailDialog({
  userId,
  userEmail,
  userName,
  open,
  onOpenChange,
}: UserTokenDetailDialogProps) {
  const { data, loading, error } = useAdminData<UserTokenDetailResponse>(
    () => {
      if (!userId) return Promise.resolve({ status: "success", data: { userId: "", userEmail: "", userName: "", totalTokens: 0, totalCost: 0, sessions: [] } })
      return adminApi.tokens.getByUser(userId) as Promise<UserTokenDetailResponse>
    },
    { cacheTTL: 60000 } // Cache for 1 minute
  )

  const userTokenData = data?.data

  // Define table columns for sessions
  const columns: Column<SessionTokenUsage>[] = [
    {
      header: "Project",
      accessor: (item) => (
        <div>
          <div className="font-medium">{item.projectTitle || "Untitled"}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(item.startedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      ),
    },
    {
      header: "Model",
      accessor: (item) => (
        <Badge variant="outline" className="font-mono text-xs">
          {item.modelName}
        </Badge>
      ),
    },
    {
      header: "Total Tokens",
      accessor: (item) => item.totalTokens.toLocaleString(),
      sortable: true,
      sortKey: "totalTokens",
      className: "text-right",
    },
    {
      header: "Prompt",
      accessor: (item) => item.promptTokens.toLocaleString(),
      sortable: true,
      sortKey: "promptTokens",
      className: "text-right",
    },
    {
      header: "Completion",
      accessor: (item) => item.completionTokens.toLocaleString(),
      sortable: true,
      sortKey: "completionTokens",
      className: "text-right",
    },
    {
      header: "Cost",
      accessor: (item) => `$${item.estimatedCost.toFixed(4)}`,
      sortable: true,
      sortKey: "estimatedCost",
      className: "text-right",
    },
    {
      header: "Messages",
      accessor: (item) => item.messageCount.toLocaleString(),
      sortable: true,
      sortKey: "messageCount",
      className: "text-right",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Token Usage Details</DialogTitle>
              <DialogDescription className="mt-2">
                <div className="font-medium text-foreground">{userName || "Unknown User"}</div>
                <div className="text-sm">{userEmail}</div>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onOpenChange(false)}
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Summary */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : userTokenData ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Total Tokens</div>
                <div className="text-2xl font-semibold mt-1">
                  {userTokenData.totalTokens.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="text-2xl font-semibold mt-1">
                  ${userTokenData.totalCost.toFixed(4)}
                </div>
              </div>
            </div>
          ) : null}

          {/* Session Breakdown */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Session-Level Breakdown</h3>
            {error ? (
              <div className="text-sm text-destructive">
                Failed to load session details: {error}
              </div>
            ) : (
              <AdminDataTable
                data={userTokenData?.sessions || []}
                columns={columns}
                loading={loading}
                emptyMessage="No session data found"
                pageSize={10}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
