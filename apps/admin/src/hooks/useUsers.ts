import { useState, useEffect, useCallback } from 'react'
import adminApi from '@/api/admin-client'

export interface User {
  id: string
  email: string
  name: string
  clerkUserId: string
  createdAt: Date
  projectCount: number
  sessionCount: number
  lastActiveAt: Date | null
}

interface UseUsersOptions {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  autoFetch?: boolean
}

interface UseUsersReturn {
  users: User[]
  loading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  page: number
  limit: number
  refresh: () => Promise<void>
  setPage: (page: number) => void
  setSearch: (search: string) => void
}

/**
 * Hook for fetching and managing users data
 * 
 * @param options - Configuration options
 * @returns Users data and control functions
 */
export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const {
    page: initialPage = 1,
    limit: initialLimit = 50,
    search: initialSearch = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    autoFetch = true
  } = options

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const [search, setSearch] = useState(initialSearch)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response: any = await adminApi.users.list({
        page,
        limit,
        search: search || undefined,
        sortBy,
        sortOrder
      })

      if (response.status === 'success') {
        // Convert date strings to Date objects
        const usersData = response.data.users.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt) : null
        }))

        setUsers(usersData)
        setTotalCount(response.data.totalCount)
        setTotalPages(response.data.totalPages)
      } else {
        throw new Error(response.error?.message || 'Failed to fetch users')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
      setError(errorMessage)
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, sortBy, sortOrder])

  useEffect(() => {
    if (autoFetch) {
      fetchUsers()
    }
  }, [fetchUsers, autoFetch])

  return {
    users,
    loading,
    error,
    totalCount,
    totalPages,
    page,
    limit,
    refresh: fetchUsers,
    setPage,
    setSearch
  }
}
