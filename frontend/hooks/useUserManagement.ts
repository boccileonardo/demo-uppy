/**
 * Custom hooks for user management operations with caching
 */

import { useState, useCallback } from 'react';
import { cachedApiService } from '../services/cachedApi';
import { useQuery } from './useQuery';
import { useNotification } from './index';
import type { UserCreateRequest, UserUpdateRequest } from '../types';

export function useUserManagement() {
  const { showNotification } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Use cached query for fetching users
  const {
    data: usersData,
    loading,
    error,
    refetch
  } = useQuery(
    cachedApiService.getUsers,
    [searchQuery, currentPage, 50], // search, page, limit
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled: true
    }
  );

  const items = usersData?.users || [];
  const totalPages = usersData?.pages || 1;
  const totalItems = usersData?.total || 0;

  const fetchPage = useCallback(async (page: number, search?: string) => {
    setCurrentPage(page);
    if (search !== undefined) {
      setSearchQuery(search);
    }
    // The useQuery will automatically refetch with new parameters
  }, []);

  const createUser = useCallback(async (userData: UserCreateRequest) => {
    try {
      const newUser = await cachedApiService.createUser(userData);
      showNotification('User created successfully', 'success');
      // Refetch to get updated data
      refetch();
      return newUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      showNotification(message, 'error');
      throw error;
    }
  }, [showNotification, refetch]);

  const updateUser = useCallback(async (userId: string, userData: UserUpdateRequest) => {
    try {
      const updatedUser = await cachedApiService.updateUser(userId, userData);
      showNotification('User updated successfully', 'success');
      refetch();
      return updatedUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      showNotification(message, 'error');
      throw error;
    }
  }, [showNotification, refetch]);

  const toggleUserStatus = useCallback(async (userId: string) => {
    try {
      await cachedApiService.toggleUserStatus(userId);
      showNotification('User status updated', 'success');
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user status';
      showNotification(message, 'error');
      throw error;
    }
  }, [showNotification, refetch]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await cachedApiService.deleteUser(userId);
      showNotification('User deleted successfully', 'success');
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      showNotification(message, 'error');
      throw error;
    }
  }, [showNotification, refetch]);

  return {
    items,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    fetchPage,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
  };
}
