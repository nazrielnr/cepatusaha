import { useState, useCallback } from 'react'

type ExportFormat = 'csv' | 'json'

interface UseExportReturn {
  exporting: boolean
  error: string | null
  exportData: (data: any[], filename: string, format: ExportFormat) => void
}

/**
 * Custom hook for exporting data to CSV or JSON
 * 
 * @returns Object with export state and export function
 */
export function useExport(): UseExportReturn {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          
          // Handle null/undefined
          if (value === null || value === undefined) {
            return ''
          }
          
          // Handle objects/arrays
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          
          // Handle strings with commas or quotes
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          
          return stringValue
        }).join(',')
      )
    ].join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])
  
  const exportToJSON = useCallback((data: any[], filename: string) => {
    if (!data) {
      throw new Error('No data to export')
    }
    
    // Create JSON content
    const jsonContent = JSON.stringify(data, null, 2)
    
    // Create blob and download
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])
  
  const exportData = useCallback((data: any[], filename: string, format: ExportFormat) => {
    setExporting(true)
    setError(null)
    
    try {
      if (format === 'csv') {
        exportToCSV(data, filename)
      } else if (format === 'json') {
        exportToJSON(data, filename)
      } else {
        throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data'
      setError(errorMessage)
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }, [exportToCSV, exportToJSON])
  
  return { exporting, error, exportData }
}
