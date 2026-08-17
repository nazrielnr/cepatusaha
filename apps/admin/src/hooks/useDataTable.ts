import { useState, useMemo, useCallback } from 'react'

interface UseDataTableOptions<T> {
  initialData?: T[]
  pageSize?: number
}

interface UseDataTableReturn<T> {
  data: T[]
  page: number
  pageSize: number
  totalPages: number
  sortBy: string | null
  sortOrder: 'asc' | 'desc'
  filters: Record<string, any>
  setData: (data: T[]) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSorting: (key: string) => void
  setFilters: (filters: Record<string, any>) => void
  paginatedData: T[]
  filteredData: T[]
}

/**
 * Custom hook for managing table state (sorting, filtering, pagination)
 * 
 * @param options - Configuration options
 * @returns Object with table state and control functions
 */
export function useDataTable<T extends Record<string, any>>(
  options: UseDataTableOptions<T> = {}
): UseDataTableReturn<T> {
  const [data, setData] = useState<T[]>(options.initialData || [])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(options.pageSize || 50)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, any>>({})
  
  // Apply filters to data
  const filteredData = useMemo(() => {
    let result = [...data]
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter(item => {
          const itemValue = item[key]
          
          // Handle different value types
          if (typeof value === 'string') {
            return String(itemValue).toLowerCase().includes(value.toLowerCase())
          }
          
          if (typeof value === 'number') {
            return itemValue === value
          }
          
          if (typeof value === 'boolean') {
            return itemValue === value
          }
          
          return true
        })
      }
    })
    
    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]
        
        // Handle null/undefined values
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        
        // Compare values
        let comparison = 0
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal)
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal
        } else {
          comparison = String(aVal).localeCompare(String(bVal))
        }
        
        return sortOrder === 'asc' ? comparison : -comparison
      })
    }
    
    return result
  }, [data, filters, sortBy, sortOrder])
  
  // Apply pagination
  const paginatedData = useMemo(() => {
    const start = page * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])
  
  const totalPages = Math.ceil(filteredData.length / pageSize)
  
  // Toggle sorting
  const setSorting = useCallback((key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
    setPage(0) // Reset to first page when sorting changes
  }, [sortBy, sortOrder])
  
  // Update filters and reset page
  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters)
    setPage(0) // Reset to first page when filters change
  }, [])
  
  // Update page size and reset page
  const updatePageSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(0) // Reset to first page when page size changes
  }, [])
  
  return {
    data,
    page,
    pageSize,
    totalPages,
    sortBy,
    sortOrder,
    filters,
    setData,
    setPage,
    setPageSize: updatePageSize,
    setSorting,
    setFilters: updateFilters,
    paginatedData,
    filteredData,
  }
}
