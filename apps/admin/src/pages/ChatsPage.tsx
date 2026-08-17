import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminDataTable } from '@/components/AdminDataTable'
import { SearchBar } from '@/components/SearchBar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'

interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  projectCount: number
  sessionCount: number
  lastActiveAt: Date | null
}

export function ChatsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch users with session counts
  const { users, loading, error, refresh } = useUsers({
    page: 1,
    limit: 100,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  // Filter users with sessions only
  const usersWithSessions = users.filter(user => user.sessionCount > 0)

  // Apply search filter
  const filteredUsers = searchQuery
    ? usersWithSessions.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : usersWithSessions

  const handleRowClick = (user: User) => {
    navigate(`/chats/users/${user.id}`)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'Never'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const columns = [
    {
      header: 'User Email',
      accessor: (user: User) => (
        <div className="font-medium text-foreground">
          {user.email}
        </div>
      ),
      sortable: true,
      sortKey: 'email' as keyof User,
    },
    {
      header: 'Name',
      accessor: (user: User) => (
        <div className="text-sm text-muted-foreground">
          {user.name || 'Not set'}
        </div>
      ),
      sortable: true,
      sortKey: 'name' as keyof User,
    },
    {
      header: 'Total Sessions',
      accessor: (user: User) => (
        <Badge variant="default" className="font-mono">
          {user.sessionCount}
        </Badge>
      ),
      sortable: true,
      sortKey: 'sessionCount' as keyof User,
    },
    {
      header: 'Total Projects',
      accessor: (user: User) => (
        <Badge variant="secondary" className="font-mono">
          {user.projectCount}
        </Badge>
      ),
      sortable: true,
      sortKey: 'projectCount' as keyof User,
    },
    {
      header: 'Last Active',
      accessor: (user: User) => (
        <div className="text-xs text-muted-foreground">
          {formatDateTime(user.lastActiveAt)}
        </div>
      ),
      sortable: true,
      sortKey: 'lastActiveAt' as keyof User,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Chat Sessions
        </h1>
        <p className="text-muted-foreground">
          Monitor all chat sessions across the platform
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button 
              onClick={refresh}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <Card className="p-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by user email or name..."
        />
      </Card>

      {/* Users Table */}
      <AdminDataTable
        data={filteredUsers}
        columns={columns}
        onRowClick={handleRowClick}
        emptyMessage={searchQuery ? "No users found matching your search" : "No users with chat sessions"}
        pageSize={50}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Users with Sessions
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {usersWithSessions.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Sessions
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {usersWithSessions.reduce((sum, u) => sum + u.sessionCount, 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Projects
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {usersWithSessions.reduce((sum, u) => sum + u.projectCount, 0)}
          </div>
        </Card>
      </div>
    </div>
  )
}
