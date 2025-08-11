/**
 * Query Cache Implementation
 * 
 * This provides automatic request deduplication and caching to prevent
 * multiple identical API calls from overwhelming the backend.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

interface QueryOptions {
  staleTime?: number; // How long data stays fresh (default: 5 minutes)
  cacheTime?: number; // How long to keep data in cache (default: 30 minutes)
  refetchOnWindowFocus?: boolean;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultStaleTime = 5 * 60 * 1000; // 5 minutes
  private defaultCacheTime = 30 * 60 * 1000; // 30 minutes

  private generateKey(queryFn: Function, args: any[]): string {
    // Create a unique key based on function name and arguments
    const fnName = queryFn.name || 'anonymous';
    const argsKey = JSON.stringify(args);
    return `${fnName}_${argsKey}`;
  }

  private isStale(entry: CacheEntry<any>, staleTime: number): boolean {
    return Date.now() - entry.timestamp > staleTime;
  }

  // Expose method for checking cached data without fetching
  getCachedData<T>(queryFn: Function, args: any[] = [], staleTime?: number): T | null {
    const key = this.generateKey(queryFn, args);
    const entry = this.cache.get(key);
    const effectiveStaleTime = staleTime ?? this.defaultStaleTime;
    
    if (entry && !this.isStale(entry, effectiveStaleTime)) {
      return entry.data;
    }
    
    return null;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultCacheTime) {
        this.cache.delete(key);
      }
    }
  }

  async query<T>(
    queryFn: (...args: any[]) => Promise<T>,
    args: any[] = [],
    options: QueryOptions = {}
  ): Promise<T> {
    const key = this.generateKey(queryFn, args);
    const staleTime = options.staleTime ?? this.defaultStaleTime;
    
    // Cleanup old entries periodically
    if (Math.random() < 0.1) { // 10% chance
      this.cleanup();
    }

    const existingEntry = this.cache.get(key);

    // Return cached data if it's still fresh
    if (existingEntry && !this.isStale(existingEntry, staleTime)) {
      console.log(`[QueryCache] Cache HIT for ${key}`);
      return existingEntry.data;
    }

    // If there's already a pending request, return that promise
    if (existingEntry?.promise) {
      console.log(`[QueryCache] Deduplicating request for ${key}`);
      return existingEntry.promise;
    }

    // Execute the query
    console.log(`[QueryCache] Cache MISS for ${key} - fetching data`);
    const promise = queryFn(...args);

    // Store the promise to deduplicate concurrent requests
    this.cache.set(key, {
      data: existingEntry?.data || null,
      timestamp: existingEntry?.timestamp || 0,
      promise,
    });

    try {
      const data = await promise;
      
      // Store the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      // Remove failed promise from cache
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.set(key, {
          data: entry.data,
          timestamp: entry.timestamp,
        });
      }
      throw error;
    }
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      console.log('[QueryCache] Cleared all cache');
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        console.log(`[QueryCache] Invalidated ${key}`);
      }
    }
  }

  prefetch<T>(
    queryFn: (...args: any[]) => Promise<T>,
    args: any[] = []
  ): void {
    // Fire and forget prefetch
    this.query(queryFn, args).catch(() => {
      // Ignore prefetch errors
    });
  }
}

// Global query cache instance
export const queryCache = new QueryCache();

/**
 * Hook to use the query cache
 */
import { useState, useEffect, useCallback } from 'react';

interface UseQueryOptions extends QueryOptions {
  enabled?: boolean; // Whether to auto-fetch
}

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuery<T>(
  queryFn: (...args: any[]) => Promise<T>,
  args: any[] = [],
  options: UseQueryOptions = {}
): UseQueryResult<T> {
  const { enabled = true } = options;
  
  const getCachedData = useCallback((): T | null => {
    if (!enabled) return null;
    return queryCache.getCachedData<T>(queryFn, args, options.staleTime);
  }, [queryFn, args, enabled, options.staleTime]);
  
  const initialData = getCachedData();
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!initialData && enabled);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async () => {
    if (!enabled) return;
    
    // Check if we already have fresh cached data
    const cachedData = getCachedData();
    if (cachedData !== null) {
      setData(cachedData);
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const result = await queryCache.query(queryFn, args, options);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [queryFn, args, enabled, options, getCachedData]);

  const refetch = useCallback(async () => {
    // Force refetch by invalidating cache first
    const key = `${queryFn.name}_${JSON.stringify(args)}`;
    queryCache.invalidate(key);
    await executeQuery();
  }, [executeQuery, queryFn, args]);

  useEffect(() => {
    // Only execute query if we don't already have cached data
    const cachedData = getCachedData();
    if (cachedData === null) {
      executeQuery();
    }
  }, [executeQuery, getCachedData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
