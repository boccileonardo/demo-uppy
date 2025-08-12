/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_MAX_FILE_SIZE_MB: string
  readonly VITE_MAX_FILES: string
  readonly VITE_CHUNK_SIZE_MB: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_DEMO_USER_EMAIL: string
  readonly VITE_DEMO_USER_NAME: string
  readonly VITE_DEMO_ADMIN_EMAIL: string
  readonly VITE_DEMO_ADMIN_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
