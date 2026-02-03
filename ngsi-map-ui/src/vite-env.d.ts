/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NGSI_BASE_URL?: string;
  readonly VITE_NGSI_CONTEXT?: string;
  readonly VITE_NGSI_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
