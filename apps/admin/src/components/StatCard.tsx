import * as React from "react"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("@container/card", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              {trend && <Skeleton className="h-4 w-16" />}
            </div>
            {icon && <Skeleton className="size-10 rounded-full" />}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("@container/card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums mt-2">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                    trend.isPositive
                      ? "text-accent dark:text-accent"
                      : "text-destructive dark:text-destructive"
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUpIcon className="size-3" />
                  ) : (
                    <TrendingDownIcon className="size-3" />
                  )}
                  <span className="font-medium">
                    {trend.isPositive ? "+" : ""}
                    {trend.value}%
                  </span>
                </Badge>
              </div>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
