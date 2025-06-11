
import { useState, useEffect, useRef } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
}

export function useCache<T>(
  fetcher: () => Promise<T>,
  options: CacheOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const { ttl = 5 * 60 * 1000, key } = options; // Default 5 minutes TTL

  useEffect(() => {
    const fetchData = async () => {
      const cached = cacheRef.current.get(key);
      const now = Date.now();

      // Check if we have valid cached data
      if (cached && (now - cached.timestamp) < ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await fetcher();
        
        // Cache the result
        cacheRef.current.set(key, { data: result, timestamp: now });
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, ttl]);

  const invalidateCache = () => {
    cacheRef.current.delete(key);
  };

  const refetch = async () => {
    invalidateCache();
    setLoading(true);
    try {
      const result = await fetcher();
      const now = Date.now();
      cacheRef.current.set(key, { data: result, timestamp: now });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch, invalidateCache };
}
