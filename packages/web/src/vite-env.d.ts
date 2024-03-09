/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_ENDPOINT: string;
  readonly VITE_APP_REGION: string;
  readonly VITE_APP_USER_POOL_ID: string;
  readonly VITE_APP_USER_POOL_CLIENT_ID: string;
  readonly VITE_APP_IDENTITY_POOL_ID: string;
  readonly VITE_APP_PREDICT_STREAM_FUNCTION_ARN: string;
  readonly VITE_APP_RAG_ENABLED: string;
  readonly VITE_APP_AGENT_ENABLED: string;
  readonly VITE_APP_SELF_SIGN_UP_ENABLED: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_MODEL_REGION: string;
  readonly VITE_APP_MODEL_IDS: string;
  readonly VITE_APP_MULTI_MODAL_MODEL_IDS: string;
  readonly VITE_APP_IMAGE_MODEL_IDS: string;
  readonly VITE_APP_ENDPOINT_NAMES: string;
  readonly VITE_APP_SAMLAUTH_ENABLED: string;
  readonly VITE_APP_SAML_COGNITO_DOMAIN_NAME: string;
  readonly VITE_APP_SAML_COGNITO_FEDERATED_IDENTITY_PROVIDER_NAME: string;
  readonly VITE_APP_AGENT_NAMES: string;
  readonly VITE_APP_RECOGNIZE_FILE_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
