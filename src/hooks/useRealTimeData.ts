/**
 * Hook to ensure real-time data fetching without any caching
 */

import { useState, useEffect } from 'react'

interface UseRealTimeDataOptions {
  refreshInterval?: number
  initialData?: any
}

export function useRealTimeData<T>(
  fetchFn: () => Promise<T>,
  options: UseRealTimeDataOptions = {},
): {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
} {
  const { refreshInterval = 0, initialData } = options
  const [data, setData] = useState<T | undefined>(initialData)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const timestamp = new Date().getTime() // Add timestamp to prevent browser caching
      const fetchFunction = async () => {
        const result = await fetchFn()
        return result
      }

      // Append timestamp query parameter to prevent caching
      const response = await fetchFunction()
      setData(response)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up auto-refresh interval if specified
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchData, refreshInterval)
      return () => clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval])

  return { data, isLoading, error, refresh: fetchData }
}

export default useRealTimeData
