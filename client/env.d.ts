/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_GOOGLE_ADS_ID?: string;
  readonly VITE_GOOGLE_ADS_SIGNUP_LABEL?: string;
  readonly VITE_GOOGLE_ADS_CONTENT_LABEL?: string;
  readonly VITE_GOOGLE_ADS_PURCHASE_LABEL?: string;
  readonly VITE_META_PIXEL_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
