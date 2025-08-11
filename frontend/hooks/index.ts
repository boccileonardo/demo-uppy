/**
 * Custom React hooks for the application
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationState, UploadStats, UploadedFile } from '../types';
import { UI } from '../config/constants';

/**
 * Hook for managing notifications
 */
export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info',
  });

  const showNotification = useCallback((
    message: string, 
    type: NotificationState['type'] = 'info',
    duration = UI.NOTIFICATION_DURATION
  ) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
};

/**
 * Hook for managing upload statistics
 */
export const useUploadStats = () => {
  const [stats, setStats] = useState<UploadStats>({
    total: 0,
    successful: 0,
    failed: 0,
    totalSize: 0,
  });

  const updateStats = useCallback((files: UploadedFile[]) => {
    const successful = files.filter(f => f.status === 'success').length;
    const failed = files.filter(f => f.status === 'error').length;
    const totalSize = files
      .filter(f => f.status === 'success')
      .reduce((sum, f) => sum + f.size, 0);

    setStats({
      total: files.length,
      successful,
      failed,
      totalSize,
    });
  }, []);

  const incrementStats = useCallback((type: 'success' | 'failed', size = 0) => {
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      successful: prev.successful + (type === 'success' ? 1 : 0),
      failed: prev.failed + (type === 'failed' ? 1 : 0),
      totalSize: (prev.totalSize || 0) + (type === 'success' ? size : 0),
    }));
  }, []);

  return {
    stats,
    updateStats,
    incrementStats,
  };
};

/**
 * Hook for managing form state
 */
export const useFormState = <T extends Record<string, any>>(initialState: T) => {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when value changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setIsSubmitting(false);
  }, [initialState]);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    setError,
    clearErrors,
    setIsSubmitting,
    reset,
  };
};

/**
 * Hook for managing loading states
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await fn();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    setIsLoading,
    withLoading,
  };
};

/**
 * Hook for debounced values
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Re-export new hooks
export { useApi, usePaginatedApi } from './useApi';
export { useForm, validators } from './useForm';
export { useUserManagement } from './useUserManagement';
export { useStorageManagement } from './useStorageManagement';

/**
 * Hook for managing previous value
 */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
