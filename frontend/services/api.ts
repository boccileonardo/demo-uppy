// API service for communicating with the FastAPI backend

interface User {
  email: string;
  name: string;
  needs_password_setup?: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  url: string;
  uploaded_at: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  uploaded_at: string;
  status: string;
  url: string;
}

class ApiService {
  private baseUrl = 'http://localhost:8000';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
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
      throw new Error(errorData.detail || `HTTP ${response.status}`);
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
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async setPassword(email: string, newPassword: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/set-password', {
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

    return this.uploadRequest('/api/upload', formData);
  }

  async listFiles(): Promise<UploadedFile[]> {
    return this.request<UploadedFile[]>('/api/files');
  }


}

export const apiService = new ApiService();
export type { User, LoginResponse, FileUploadResponse, UploadedFile };
