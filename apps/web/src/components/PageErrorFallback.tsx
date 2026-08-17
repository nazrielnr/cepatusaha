/**
 * PageErrorFallback Component
 *
 * Custom error fallback UI for page-level errors.
 * Provides user-friendly error messages and recovery options.
 */

import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

interface PageErrorFallbackProps {
  error?: Error
  resetError?: () => void
  pageName?: string
}

export function PageErrorFallback({ error, resetError, pageName = 'page' }: PageErrorFallbackProps) {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/', { replace: true })
    if (resetError) {
      resetError()
    }
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleReset = () => {
    if (resetError) {
      resetError()
    }
  }

  // Log error for debugging
  if (error) {
    console.error(`[${pageName}] Error caught by boundary:`, error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-lg w-full shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive rounded-full">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription className="mt-1">
                An error occurred while loading this {pageName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-1">Error Details:</p>
              <p className="text-sm font-mono text-gray-600 break-all">
                {error.message || 'Unknown error'}
              </p>
            </div>
          )}

          <div className="mt-4 p-4 bg-primary rounded-md border border-primary">
            <p className="text-sm text-primary">
              <strong>What you can do:</strong>
            </p>
            <ul className="mt-2 text-sm text-primary space-y-1 list-disc list-inside">
              <li>Try refreshing the page</li>
              <li>Go back to the home page</li>
              <li>If the problem persists, contact support</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 flex-wrap">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={handleGoHome} variant="default" className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
          <Button onClick={handleReload} variant="secondary" className="w-full">
            Reload Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
