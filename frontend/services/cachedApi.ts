import { apiService } from './api';
import { queryCache } from '../hooks/useQuery';
import type { 
  AppUser, 
  UserCreateRequest, 
  UserCreateResponse, 
  UserUpdateRequest,
  StorageAccountData,
  StorageAccountCreateRequest,
  StorageAccountUpdateRequest,
  ContainerCreateRequest,
  ContainerWithAccount,
  AdminStats,
  AdminActivity,
  UploadedFile,
  FileUploadResponse
} from '../types';

class CachedApiService {
  // Auth methods - pass through since they don't need caching
  async login(email: string, password: string) {
    return apiService.login(email, password);
  }

  async setPassword(email: string, newPassword: string) {
    return apiService.setPassword(email, newPassword);
  }

  setToken(token: string) {
    apiService.setToken(token);
  }

  getToken() {
    return apiService.getToken();
  }

  clearToken() {
    apiService.clearToken();
  }

  // File methods with cache invalidation
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResponse> {
    const result = await apiService.uploadFile(file, onProgress);
    // Invalidate files cache after upload
    queryCache.invalidate('listFiles');
    queryCache.invalidate('getAdminStats');
    return result;
  }

  async listFiles(): Promise<UploadedFile[]> {
    return apiService.listFiles();
  }

  // Admin stats with caching
  async getAdminStats(): Promise<AdminStats> {
    return apiService.getAdminStats();
  }

  async getAdminActivity(limit: number = 20): Promise<AdminActivity[]> {
    return apiService.getAdminActivity(limit);
  }

  // User management with cache invalidation
  async getUsers(search: string = '', page: number = 1, limit: number = 50): Promise<{
    users: AppUser[];
    total: number;
    page: number;
    pages: number;
  }> {
    return apiService.getUsers(search, page, limit);
  }

  async createUser(userData: UserCreateRequest): Promise<UserCreateResponse> {
    const result = await apiService.createUser(userData);
    // Invalidate users cache
    queryCache.invalidate('getUsers');
    queryCache.invalidate('getAdminStats');
    return result;
  }

  async updateUser(userId: string, userData: UserUpdateRequest): Promise<AppUser> {
    const result = await apiService.updateUser(userId, userData);
    queryCache.invalidate('getUsers');
    return result;
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const result = await apiService.deleteUser(userId);
    queryCache.invalidate('getUsers');
    queryCache.invalidate('getAdminStats');
    return result;
  }

  async toggleUserStatus(userId: string): Promise<{ id: string; email: string; isActive: boolean }> {
    const result = await apiService.toggleUserStatus(userId);
    queryCache.invalidate('getUsers');
    queryCache.invalidate('getAdminStats');
    return result;
  }

  // Container management
  async getContainers(): Promise<ContainerWithAccount[]> {
    return apiService.getContainers();
  }
  
  async getContainersWithAccounts(): Promise<ContainerWithAccount[]> {
    return apiService.getContainersWithAccounts();
  }

  // Storage account management with cache invalidation
  async getStorageAccounts(): Promise<StorageAccountData[]> {
    return apiService.getStorageAccounts();
  }

  async createStorageAccount(accountData: StorageAccountCreateRequest): Promise<StorageAccountData> {
    const result = await apiService.createStorageAccount(accountData);
    queryCache.invalidate('getStorageAccounts');
    return result;
  }

  async updateStorageAccount(accountId: string, accountData: StorageAccountUpdateRequest): Promise<StorageAccountData> {
    const result = await apiService.updateStorageAccount(accountId, accountData);
    queryCache.invalidate('getStorageAccounts');
    return result;
  }

  async deleteStorageAccount(accountId: string): Promise<{ message: string }> {
    const result = await apiService.deleteStorageAccount(accountId);
    queryCache.invalidate('getStorageAccounts');
    return result;
  }

  // Container management with cache invalidation
  async createContainer(containerData: ContainerCreateRequest): Promise<any> {
    const result = await apiService.createContainer(containerData);
    queryCache.invalidate('getStorageAccounts'); // Refresh accounts to get updated container counts
    return result;
  }

  async deleteContainer(containerId: string): Promise<{ message: string }> {
    const result = await apiService.deleteContainer(containerId);
    queryCache.invalidate('getStorageAccounts'); // Refresh accounts to get updated container counts
    return result;
  }
}

export const cachedApiService = new CachedApiService();
