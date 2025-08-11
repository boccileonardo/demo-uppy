/**
 * Custom hook for API operations with loading and error handling
 */

import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiActions<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
  setData: (data: T) => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>
): ApiState<T> & ApiActions<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction(...args);
      setState(prev => ({ ...prev, data: result, loading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

/**
 * Hook for paginated API calls
 */
interface PaginatedState<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  loading: boolean;
  error: string | null;
}

interface PaginatedActions<T> {
  fetchPage: (page: number, search?: string) => Promise<void>;
  refresh: () => Promise<void>;
  updateItem: (id: string, updater: (item: T) => T) => void;
  removeItem: (id: string) => void;
  addItem: (item: T) => void;
}

export function usePaginatedApi<T extends { id: string }>(
  apiFunction: (search?: string, page?: number) => Promise<{
    items: T[];
    page: number;
    pages: number;
    total: number;
  }>
): PaginatedState<T> & PaginatedActions<T> {
  const [state, setState] = useState<PaginatedState<T>>({
    items: [],
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    loading: false,
    error: null,
  });

  const fetchPage = useCallback(async (page: number, search?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction(search, page);
      setState(prev => ({
        ...prev,
        items: result.items,
        currentPage: result.page,
        totalPages: result.pages,
        totalItems: result.total,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [apiFunction]);

  const refresh = useCallback(() => {
    return fetchPage(state.currentPage);
  }, [fetchPage, state.currentPage]);

  const updateItem = useCallback((id: string, updater: (item: T) => T) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? updater(item) : item
      ),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
      totalItems: prev.totalItems - 1,
    }));
  }, []);

  const addItem = useCallback((item: T) => {
    setState(prev => ({
      ...prev,
      items: [item, ...prev.items],
      totalItems: prev.totalItems + 1,
    }));
  }, []);

  return {
    ...state,
    fetchPage,
    refresh,
    updateItem,
    removeItem,
    addItem,
  };
}
