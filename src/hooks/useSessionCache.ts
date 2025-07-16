import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';

interface SessionCacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
  staleWhileRevalidate?: boolean; // Return stale data while fetching new
}

export function useSessionCache<T>(
  fetcher: () => Promise<T>,
  options: SessionCacheOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getSessionKey, setSessionData, getSessionData, isSessionReady } = useSession();
  const fetchingRef = useRef<Set<string>>(new Set());

  const { ttl = 15 * 60 * 1000, key, staleWhileRevalidate = true } = options; // Default 15 minutes TTL

  const sessionKey = useMemo(() => {
    return isSessionReady ? getSessionKey(`cache_${key}`) : '';
  }, [getSessionKey, key, isSessionReady]);

  const fetchData = useMemo(() => async (forceRefresh = false) => {
    if (!isSessionReady || !sessionKey) return;

    // Prevent duplicate fetches
    if (fetchingRef.current.has(sessionKey) && !forceRefresh) {
      return;
    }

    const cached = getSessionData<{ data: T; timestamp: number; isStale: boolean }>(`cache_${key}`);
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
        setSessionData(`cache_${key}`, { ...cached, isStale: true });
      }
    }

    // Check if we have valid cached data and don't need background refresh
    if (cached && (now - cached.timestamp) < ttl && !forceRefresh) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    try {
      fetchingRef.current.add(sessionKey);
      if (!cached || forceRefresh) {
        setLoading(true);
      }
      
      const result = await fetcher();
      
      // Cache the result with session isolation
      setSessionData(`cache_${key}`, { data: result, timestamp: now, isStale: false });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
      if (!cached) {
        setData(null);
      }
    } finally {
      fetchingRef.current.delete(sessionKey);
      setLoading(false);
    }
  }, [fetcher, key, ttl, staleWhileRevalidate, sessionKey, isSessionReady, getSessionData, setSessionData]);

  useEffect(() => {
    if (isSessionReady) {
      fetchData();
    }
  }, [fetchData, isSessionReady]);

  const invalidateCache = () => {
    if (isSessionReady) {
      setSessionData(`cache_${key}`, null);
    }
  };

  const refetch = async () => {
    await fetchData(true);
  };

  return { data, loading, error, refetch, invalidateCache };
}