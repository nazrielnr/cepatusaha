import * as React from "react"
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ErrorMessageProps {
  error: string | Error
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({
  error,
  title = "Error",
  onRetry,
  className,
}: ErrorMessageProps) {
  const errorMessage = typeof error === "string" ? error : error.message

  return (
    <Alert variant="destructive" className={cn("", className)}>
      <AlertCircleIcon className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-start justify-between gap-4">
        <span className="flex-1">{errorMessage}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
            <RefreshCwIcon className="size-4" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
