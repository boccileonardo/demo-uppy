// API service for communicating with the FastAPI backend

import { API_CONFIG, AUTH } from '../config/constants';
import { AppError } from '../utils/errors';
import { storage } from '../utils/helpers';
import type { 
  User, 
  LoginResponse, 
  FileUploadResponse, 
  UploadedFile
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


}

export const apiService = new ApiService();
export type { User, LoginResponse, FileUploadResponse, UploadedFile };
