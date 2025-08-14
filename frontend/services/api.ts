// API service for communicating with the FastAPI backend

import { API_CONFIG, AUTH } from '../config/constants';
import { AppError } from '../utils/errors';
import { storage } from '../utils/helpers';
import type { 
  User, 
  LoginResponse, 
  FileUploadResponse, 
  UploadedFile,
  AdminStats,
  AdminActivity,
  AppUser,
  UserCreateRequest,
  UserCreateResponse,
  UserUpdateRequest,
  StorageAccountData,
  StorageAccountCreateRequest,
  StorageAccountUpdateRequest,
  ContainerCreateRequest,
  ContainerWithAccount,
  UserStorageInfo
} from '../types';

class ApiService {
  private baseUrl = API_CONFIG.BASE_URL;
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    storage.set(AUTH.TOKEN_KEY, token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = storage.get(AUTH.TOKEN_KEY);
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    storage.remove(AUTH.TOKEN_KEY);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new AppError(errorData.detail || `HTTP ${response.status}`, response.status);
    }

    return response.json();
  }

  private async uploadRequest(endpoint: string, formData: FormData): Promise<FileUploadResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new AppError(errorData.detail || `HTTP ${response.status}`, response.status);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async setPassword(email: string, newPassword: string): Promise<LoginResponse> {
    return this.request<LoginResponse>(API_CONFIG.ENDPOINTS.SET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email, new_password: newPassword }),
    });
  }

  // File endpoints
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // For now, we'll simulate progress since we can't easily track real upload progress
    if (onProgress) {
      const progressInterval = setInterval(() => {
        // Simulate progress
        const progress = Math.min(Math.random() * 20 + 20, 90);
        onProgress(progress);
      }, 200);

      try {
        const result = await this.uploadRequest('/api/upload', formData);
        clearInterval(progressInterval);
        onProgress(100);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    }

    return this.uploadRequest(API_CONFIG.ENDPOINTS.UPLOAD, formData);
  }

  async listFiles(): Promise<UploadedFile[]> {
    return this.request<UploadedFile[]>(API_CONFIG.ENDPOINTS.FILES);
  }

  async getUserStorageInfo(): Promise<UserStorageInfo> {
    return this.request<UserStorageInfo>(API_CONFIG.ENDPOINTS.USER_STORAGE_INFO);
  }
  
  async getContainers(): Promise<ContainerWithAccount[]> {
    return this.request<ContainerWithAccount[]>(API_CONFIG.ENDPOINTS.CONTAINERS);
  }
  
  async getContainersWithAccounts(): Promise<ContainerWithAccount[]> {
    return this.request<ContainerWithAccount[]>(API_CONFIG.ENDPOINTS.ADMIN_CONTAINERS_WITH_ACCOUNTS);
  }

  // Admin endpoints
  async getAdminStats(): Promise<AdminStats> {
    return this.request<AdminStats>(API_CONFIG.ENDPOINTS.ADMIN_STATS);
  }

  async getAdminActivity(limit: number = 20): Promise<AdminActivity[]> {
    return this.request<AdminActivity[]>(`${API_CONFIG.ENDPOINTS.ADMIN_ACTIVITY}?limit=${limit}`);
  }

  async getUsers(search: string = '', page: number = 1, limit: number = 50): Promise<{
    users: AppUser[];
    total: number;
    page: number;
    pages: number;
  }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}?${params.toString()}`);
  }

  async createUser(userData: UserCreateRequest): Promise<UserCreateResponse> {
    return this.request<UserCreateResponse>(API_CONFIG.ENDPOINTS.ADMIN_USERS, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: UserUpdateRequest): Promise<AppUser> {
    return this.request<AppUser>(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${userId}`, {
      method: 'DELETE',
    });
  }

  async toggleUserStatus(userId: string): Promise<{ id: string; email: string; isActive: boolean }> {
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${userId}/toggle`, {
      method: 'PATCH',
    });
  }

  async getStorageAccounts(): Promise<StorageAccountData[]> {
    return this.request<StorageAccountData[]>(API_CONFIG.ENDPOINTS.ADMIN_STORAGE_ACCOUNTS);
  }

  async createStorageAccount(accountData: StorageAccountCreateRequest): Promise<StorageAccountData> {
    return this.request<StorageAccountData>(API_CONFIG.ENDPOINTS.ADMIN_STORAGE_ACCOUNTS, {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async updateStorageAccount(accountId: string, accountData: StorageAccountUpdateRequest): Promise<StorageAccountData> {
    return this.request<StorageAccountData>(`${API_CONFIG.ENDPOINTS.ADMIN_STORAGE_ACCOUNTS}/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    });
  }

  async deleteStorageAccount(accountId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_CONFIG.ENDPOINTS.ADMIN_STORAGE_ACCOUNTS}/${accountId}`, {
      method: 'DELETE',
    });
  }

  async createContainer(containerData: ContainerCreateRequest): Promise<any> {
    return this.request(API_CONFIG.ENDPOINTS.ADMIN_CONTAINERS, {
      method: 'POST',
      body: JSON.stringify(containerData),
    });
  }

  async deleteContainer(containerId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_CONFIG.ENDPOINTS.ADMIN_CONTAINERS}/${containerId}`, {
      method: 'DELETE',
    });
  }


}

export const apiService = new ApiService();
export type { User, LoginResponse, FileUploadResponse, UploadedFile };
