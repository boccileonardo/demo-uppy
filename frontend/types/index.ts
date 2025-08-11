/**
 * Shared type definitions for the application
 */

export interface User {
  email: string;
  name: string;
  role?: string;
  needs_password_setup?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordSetup {
  email: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  url: string;
  uploaded_at: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  uploaded_at: string;
  status: 'success' | 'error' | 'pending';
  url: string;
}

export interface FileUploadRestrictions {
  maxFileSize?: number;
  maxNumberOfFiles?: number;
  allowedFileTypes?: string[];
}

export interface UploadStats {
  total: number;
  successful: number;
  failed: number;
  totalSize?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Component Props Types
export interface AuthSectionProps {
  onLogin: (email: string, password: string) => Promise<{ needsPasswordSetup: boolean }>;
  onSetPassword: (email: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
}

export interface FileUploadPortalProps {
  user: User;
  onLogout: () => void;
}

export interface UppyFileUploaderProps {
  onFileAdded?: (file: File) => void;
  onUploadProgress?: (file: File, progress: number) => void;
  onUploadSuccess?: (file: File, response: any) => void;
  onUploadError?: (file: File, error: Error) => void;
  restrictions?: FileUploadRestrictions;
  endpoint?: string;
  headers?: Record<string, string>;
}

// Admin Panel Types
export interface AdminStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_uploads: number;
  successful_uploads: number;
  failed_uploads: number;
  storage_used: string;
}

export interface AdminActivity {
  id: number;
  user: string;
  action: string;
  time: string;
  status: 'success' | 'error' | 'info';
  details?: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  storageAccount: string;
  container: string;
}

export interface UserCreateRequest {
  email: string;
  name: string;
  role: 'user' | 'admin';
  storage_account: string;
  container: string;
}

export interface UserCreateResponse extends AppUser {
  temporaryPassword: string;
}

export interface UserUpdateRequest {
  email: string;
  name: string;
  role: 'user' | 'admin';
  storage_account: string;
  container: string;
  is_active: boolean;
}

export interface StorageAccountData {
  id: string;
  name: string;
  connectionString: string;
  location: string;
  redundancy: 'LRS' | 'GRS' | 'ZRS' | 'GZRS';
  isActive: boolean;
  createdAt: string;
  containers: ContainerData[];
}

export interface ContainerData {
  id: string;
  name: string;
  accessLevel: 'private' | 'blob' | 'container';
  size: string;
  files: number;
  lastModified: string;
}

export interface StorageAccountCreateRequest {
  name: string;
  connection_string: string;
  location: string;
  redundancy: 'LRS' | 'GRS' | 'ZRS' | 'GZRS';
}

export interface StorageAccountUpdateRequest {
  name: string;
  connection_string: string;
  location: string;
  redundancy: 'LRS' | 'GRS' | 'ZRS' | 'GZRS';
  is_active: boolean;
}

export interface ContainerCreateRequest {
  name: string;
  account_id: string;
}
