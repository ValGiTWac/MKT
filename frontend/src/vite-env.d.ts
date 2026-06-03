/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_MISTRAL_VIBE_API_KEY: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    __ENV__: {
      API_URL: string;
      WS_URL: string;
      MISTRAL_VIBE_API_KEY: string;
    };
  }
}
