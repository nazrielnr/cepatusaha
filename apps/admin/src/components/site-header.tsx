import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChevronRight } from "lucide-react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useMemo, useState, useEffect } from "react"
import adminApi from "@/api/admin-client"

interface BreadcrumbItem {
  label: string
  href?: string
}

export function SiteHeader() {
  const location = useLocation()
  const params = useParams()
  const [userEmail, setUserEmail] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')

  // Fetch user email if userId is in params
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (params.userId) {
        try {
          const response: any = await adminApi.users.get(params.userId)
          if (response?.data?.user?.email) {
            setUserEmail(response.data.user.email)
          }
        } catch (error) {
          console.error('Failed to fetch user email:', error)
        }
      } else {
        setUserEmail('')
      }
    }

    fetchUserEmail()
  }, [params.userId])

  // Store session ID if in params
  useEffect(() => {
    if (params.sessionId) {
      setSessionId(params.sessionId)
    } else {
      setSessionId('')
    }
  }, [params.sessionId])

  const breadcrumbs = useMemo(() => {
    const items: BreadcrumbItem[] = []
    const pathSegments = location.pathname.split('/').filter(Boolean)

    // Always start with Dashboard
    items.push({ label: 'Dashboard', href: '/' })

    // Map path segments to breadcrumb items
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      const isLast = i === pathSegments.length - 1

      // Skip 'users' and 'sessions' intermediate segments
      if (segment === 'users' && pathSegments[i - 1] === 'chats') {
        continue
      }
      if (segment === 'sessions' && pathSegments[i - 1] === 'chats') {
        continue
      }
      if (segment === 'users' && pathSegments[i - 1] === 'analytics') {
        continue
      }

      // Map segment to readable label
      let label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      // Handle special cases
      if (segment === 'chats') {
        label = 'Chat Sessions'
      } else if (segment === 'models') {
        label = 'AI Models'
      } else if (segment === 'tokens') {
        label = 'Token Usage'
      } else if (segment === 'audit-logs') {
        label = 'Audit Logs'
      } else if (segment === 'health') {
        label = 'System Health'
      } else if (segment === 'analytics') {
        label = 'User Analytics'
      } else if (segment === 'dependencies') {
        label = 'Dependencies'
      } else if (segment === 'functions') {
        label = 'Functions'
      } else if (segment === 'publications') {
        label = 'Publications'
      } else if (segment === 'storage') {
        label = 'Storage'
      }

      // Handle dynamic segments (UUIDs)
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // This is a UUID
        if (pathSegments[i - 1] === 'users' || (pathSegments[i - 2] === 'chats' && pathSegments[i - 1] === 'users')) {
          // User ID - use email if available
          label = userEmail || 'User Detail'
        } else if (pathSegments[i - 1] === 'sessions' || (pathSegments[i - 2] === 'chats' && pathSegments[i - 1] === 'sessions')) {
          // Session ID
          label = 'Session Detail'
        } else {
          // Generic detail
          label = 'Detail'
        }
      }

      // Build href for this segment
      const href = isLast ? undefined : '/' + pathSegments.slice(0, i + 1).join('/')

      items.push({ label, href })
    }

    return items
  }, [location.pathname, userEmail, sessionId])

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear lg:px-6">
      <div className="flex w-full items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-5"
        />
        <nav className="flex items-center space-x-1 text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
              {item.href ? (
                <Link
                  to={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  )
}
