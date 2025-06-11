
import { useState, useEffect, useRef, useMemo } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
  staleWhileRevalidate?: boolean; // Return stale data while fetching new
}

export function useCache<T>(
  fetcher: () => Promise<T>,
  options: CacheOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number; isStale: boolean }>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());

  const { ttl = 15 * 60 * 1000, key, staleWhileRevalidate = true } = options; // Default 15 minutes TTL

  const fetchData = useMemo(() => async (forceRefresh = false) => {
    // Prevent duplicate fetches
    if (fetchingRef.current.has(key) && !forceRefresh) {
      return;
    }

    const cached = cacheRef.current.get(key);
    const now = Date.now();

    // Return stale data immediately if available and staleWhileRevalidate is enabled
    if (cached && !forceRefresh && staleWhileRevalidate) {
      if ((now - cached.timestamp) < ttl) {
        // Fresh data
        setData(cached.data);
        setLoading(false);
        return;
      } else if (!cached.isStale) {
        // Stale data - return it but fetch fresh data in background
        setData(cached.data);
        setLoading(false);
        cached.isStale = true;
      }
    }

    // Check if we have valid cached data and don't need background refresh
    if (cached && (now - cached.timestamp) < ttl && !forceRefresh) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    try {
      fetchingRef.current.add(key);
      if (!cached || forceRefresh) {
        setLoading(true);
      }
      
      const result = await fetcher();
      
      // Cache the result
      cacheRef.current.set(key, { data: result, timestamp: now, isStale: false });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
      if (!cached) {
        setData(null);
      }
    } finally {
      fetchingRef.current.delete(key);
      setLoading(false);
    }
  }, [fetcher, key, ttl, staleWhileRevalidate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidateCache = () => {
    cacheRef.current.delete(key);
  };

  const refetch = async () => {
    await fetchData(true);
  };

  return { data, loading, error, refetch, invalidateCache };
}
