/**
 * Custom hook for fetching container data
 */
import { useQuery } from './useQuery';
import { cachedApiService } from '../services/cachedApi';
import type { ContainerWithAccount } from '../types';

export function useContainers(isAdmin: boolean = false) {
  // Use the appropriate API endpoint based on whether the user is admin
  const fetchFunction = isAdmin 
    ? cachedApiService.getContainersWithAccounts 
    : cachedApiService.getContainers;
  
  const { 
    data: containers, 
    loading, 
    error, 
    refetch 
  } = useQuery<ContainerWithAccount[]>(
    fetchFunction,
    [],
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: true
    }
  );
  
  return {
    containers: containers || [],
    loading,
    error,
    refetch,
  };
}
