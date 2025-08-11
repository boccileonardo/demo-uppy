/**
 * Custom hooks for storage management operations with caching
 */

import { useState, useCallback } from 'react';
import { cachedApiService } from '../services/cachedApi';
import { useQuery } from './useQuery';
import { useNotification } from './index';
import type { 
  StorageAccountCreateRequest, 
  StorageAccountUpdateRequest,
  ContainerCreateRequest
} from '../types';

export function useStorageManagement() {
  const { showNotification } = useNotification();

  // Use cached query for storage accounts
  const {
    data: accounts,
    loading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts
  } = useQuery(
    cachedApiService.getStorageAccounts,
    [],
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - storage config changes less frequently
      enabled: true
    }
  );

  const storageAccounts = accounts || [];
  
  // Container management for selected account
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Get containers for the selected account (they're already included in StorageAccountData)
  const selectedAccount = storageAccounts.find(acc => acc.id === selectedAccountId);
  const containers = selectedAccount?.containers || [];

  // Account management methods
  const createStorageAccount = useCallback(async (accountData: StorageAccountCreateRequest) => {
    try {
      const newAccount = await cachedApiService.createStorageAccount(accountData);
      showNotification('Storage account created successfully', 'success');
      refetchAccounts();
      return newAccount;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create storage account';
      showNotification(message, 'error');
      throw error;
    }
  }, [showNotification, refetchAccounts]);

  const updateStorageAccount = useCallback(async (accountId: string, accountData: StorageAccountUpdateRequest) => {
    try {
      const updatedAccount = await cachedApiService.updateStorageAccount(accountId, accountData);
      showNotification('Storage account updated successfully', 'success');
      refetchAccounts();
      return updatedAccount;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update storage account';
      showNotification(message, 'error');
      throw error;
    }
  }, [showNotification, refetchAccounts]);

  const deleteStorageAccount = useCallback(async (accountId: string) => {
    try {
      await cachedApiService.deleteStorageAccount(accountId);
      showNotification('Storage account deleted successfully', 'success');
      refetchAccounts();
      // If this was the selected account, clear selection
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete storage account';
      showNotification(message, 'error');
      throw error;
    }
  }, [showNotification, refetchAccounts, selectedAccountId]);

  // Container management methods
  const selectAccount = useCallback((accountId: string | null) => {
    setSelectedAccountId(accountId);
  }, []);

  const createContainer = useCallback(async (containerData: ContainerCreateRequest) => {
    try {
      const newContainer = await cachedApiService.createContainer(containerData);
      showNotification('Container created successfully', 'success');
      refetchAccounts(); // Refresh to get updated container list
      return newContainer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create container';
      showNotification(message, 'error');
      throw error;
    }
  }, [showNotification, refetchAccounts]);

  const deleteContainer = useCallback(async (containerId: string) => {
    try {
      await cachedApiService.deleteContainer(containerId);
      showNotification('Container deleted successfully', 'success');
      refetchAccounts(); // Refresh to get updated container list
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete container';
      showNotification(message, 'error');
      throw error;
    }
  }, [showNotification, refetchAccounts]);

  return {
    // Account data
    accounts: storageAccounts,
    accountsLoading,
    accountsError,
    
    // Account methods
    createStorageAccount,
    updateStorageAccount,
    deleteStorageAccount,
    
    // Container data
    containers,
    selectedAccountId,
    
    // Container methods
    selectAccount,
    createContainer,
    deleteContainer,
  };
}
