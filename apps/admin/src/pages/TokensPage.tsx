import { useState, useEffect } from "react"
import { RefreshCwIcon, CoinsIcon, DollarSignIcon, TrendingUpIcon, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminDataTable } from "@/components/AdminDataTable"
import { LineChart } from "@/components/LineChart"
import { AlertCircle } from "lucide-react"
import adminApi from "@/api/admin-client"
import { format } from "date-fns"

interface TokenUsageByUser {
  userId: string
  userEmail: string
  userName: string
  totalTokens: number
  sessionCount: number
  estimatedCost: number
}

interface TokenTrend {
  timestamp: Date
  value: number
}

interface TokenData {
  totalTokens: number
  totalCost: number
  tokensByUser?: TokenUsageByUser[]
  tokenTrend?: TokenTrend[]
}

export function TokensPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TokenData | null>(null)
  const [dateRange, setDateRange] = useState("7d")

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case "7d":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "30d":
          startDate.setDate(startDate.getDate() - 30)
          break
        case "90d":
          startDate.setDate(startDate.getDate() - 90)
          break
      }

      const response = await adminApi.tokens.getAll({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        group_by: "user"
      }) as any

      if (response?.data) {
        setData({
          totalTokens: response.data.totalTokens || 0,
          totalCost: response.data.totalCost || 0,
          tokensByUser: response.data.tokensByUser || [],
          tokenTrend: response.data.tokenTrend || []
        })
      }
    } catch (err) {
      console.error("Failed to load token data:", err)
      setError(err instanceof Error ? err.message : "Failed to load token data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateRange])

  const handleExport = () => {
    if (!data?.tokensByUser) return

    const csv = [
      ["User Email", "User Name", "Total Tokens", "Sessions", "Estimated Cost"],
      ...data.tokensByUser.map(u => [
        u.userEmail,
        u.userName || "Unknown",
        u.totalTokens.toString(),
        u.sessionCount.toString(),
        `$${(u.estimatedCost || 0).toFixed(4)}`
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `token-usage-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      header: "User",
      accessor: (item: TokenUsageByUser) => (
        <div>
          <div className="font-medium">{item.userName || "Unknown"}</div>
          <div className="text-sm text-muted-foreground">{item.userEmail || "N/A"}</div>
        </div>
      ),
      sortable: true,
      sortKey: "userName" as keyof TokenUsageByUser,
    },
    {
      header: "Total Tokens",
      accessor: (item: TokenUsageByUser) => (
        <span className="font-mono">{(item.totalTokens || 0).toLocaleString()}</span>
      ),
      sortable: true,
      sortKey: "totalTokens" as keyof TokenUsageByUser,
    },
    {
      header: "Sessions",
      accessor: (item: TokenUsageByUser) => (
        <span className="font-mono">{(item.sessionCount || 0).toLocaleString()}</span>
      ),
      sortable: true,
      sortKey: "sessionCount" as keyof TokenUsageByUser,
    },
    {
      header: "Estimated Cost",
      accessor: (item: TokenUsageByUser) => (
        <span className="font-mono">${(item.estimatedCost || 0).toFixed(4)}</span>
      ),
      sortable: true,
      sortKey: "estimatedCost" as keyof TokenUsageByUser,
    },
  ]

  if (loading && !data) {
    return (
      <div className="space-y-6">
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

  const avgCostPerSession = data?.tokensByUser && data.tokensByUser.length > 0
    ? data.totalCost / data.tokensByUser.reduce((sum, u) => sum + u.sessionCount, 0)
    : 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Token Usage Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor AI token consumption and costs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!data?.tokensByUser || data.tokensByUser.length === 0}
          >
            <Download className="size-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCwIcon className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button 
              onClick={loadData}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Tokens Consumed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(data?.totalTokens || 0).toLocaleString()}
              </p>
            </div>
            <CoinsIcon className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Estimated Cost
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${(data?.totalCost || 0).toFixed(2)}
              </p>
            </div>
            <DollarSignIcon className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Average Cost per Session
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${avgCostPerSession.toFixed(4)}
              </p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Token Usage Chart */}
      {data?.tokenTrend && data.tokenTrend.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Token Usage Over Time</h2>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <LineChart
            data={data.tokenTrend.map(t => ({
              date: format(new Date(t.timestamp), "MMM dd"),
              value: t.value
            }))}
            dataKey="value"
            xAxisKey="date"
            color="#3b82f6"
          />
        </Card>
      )}

      {/* Token Usage Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Token Usage by User</h2>
        {data?.tokensByUser && data.tokensByUser.length > 0 ? (
          <AdminDataTable
            data={data.tokensByUser}
            columns={columns}
            emptyMessage="No token usage data found"
            pageSize={50}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CoinsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No token usage data available</p>
            <p className="text-sm mt-2">Token data will appear once users start using the AI chat</p>
          </div>
        )}
      </Card>
    </div>
  )
}
