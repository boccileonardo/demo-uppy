/**
 * Application constants and configuration
 */

export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    SET_PASSWORD: '/api/auth/set-password',
    UPLOAD: '/api/upload',
    FILES: '/api/files',
    // Admin endpoints
    ADMIN_STATS: '/api/admin/stats',
    ADMIN_ACTIVITY: '/api/admin/activity',
    ADMIN_USERS: '/api/admin/users',
    ADMIN_STORAGE_ACCOUNTS: '/api/admin/storage-accounts',
    ADMIN_CONTAINERS: '/api/admin/containers',
  },
  TIMEOUT: 30000,
} as const;

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILES: 10,
  ALLOWED_TYPES: [
    'text/csv',
    'application/json', 
    'text/plain',
    '.csv',
    '.json',
    '.txt',
    '.xlsx',
    '.xls',
    '.xml'
  ],
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
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

export const STORAGE_INFO = {
  ACCOUNT_NAME: 'secureuploadsa01',
  CONTAINER_NAME: 'user-uploads',
  LOCATION: 'Azure West US 2',
  REDUNDANCY: 'Geo-redundant',
} as const;

export const DEMO_USERS = [
  { email: 'demo@example.com', name: 'Demo User' },
  { email: 'admin@example.com', name: 'Admin User' },
  { email: 'test@example.com', name: 'Test User' },
] as const;
