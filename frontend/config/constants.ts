/**
 * Application constants and configuration
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    SET_PASSWORD: '/api/auth/set-password',
    UPLOAD: '/api/upload',
    FILES: '/api/files',
    USER_STORAGE_INFO: '/api/user/storage-info',
    // Admin endpoints
    ADMIN_STATS: '/api/admin/stats',
    ADMIN_ACTIVITY: '/api/admin/activity',
    ADMIN_USERS: '/api/admin/users',
    ADMIN_STORAGE_ACCOUNTS: '/api/admin/storage-accounts',
    ADMIN_CONTAINERS: '/api/admin/containers',
  },
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
} as const;

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: (parseInt(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 10000) * 1024 * 1024, // Convert MB to bytes
  MAX_FILES: parseInt(import.meta.env.VITE_MAX_FILES) || 15,
  ALLOWED_TYPES: [
    'text/csv',
    'application/json', 
    'text/plain',
    '.csv',
    '.json',
    '.txt',
    '.xlsx',
    '.xls',
    '.xml',
    '.avro',
    '.parquet',
  ],
  CHUNK_SIZE: (parseInt(import.meta.env.VITE_CHUNK_SIZE_MB) || 1) * 1024 * 1024, // Convert MB to bytes
} as const;

export const AUTH = {
  TOKEN_KEY: 'auth_token',
  USER_INFO_KEY: 'user_info',
  PASSWORD_MIN_LENGTH: 6,
} as const;

export const UI = {
  NOTIFICATION_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
} as const;

export const DEMO_USERS = [
  { email: import.meta.env.VITE_DEMO_USER_EMAIL || 'user@example.com', name: import.meta.env.VITE_DEMO_USER_NAME || 'Demo User' },
  { email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@example.com', name: import.meta.env.VITE_DEMO_ADMIN_NAME || 'Admin User' },
] as const;
