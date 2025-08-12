/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_MAX_FILE_SIZE_MB: string
  readonly VITE_MAX_FILES: string
  readonly VITE_CHUNK_SIZE_MB: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
