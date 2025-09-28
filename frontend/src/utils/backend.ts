const DEFAULT_DEV_API_URL = 'http://localhost:8000';

export function getBackendUrl(): string {
  const explicitUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;

  if (explicitUrl && explicitUrl.length > 0) {
    return explicitUrl;
  }

  if (process.env.NODE_ENV === 'development') {
    return DEFAULT_DEV_API_URL;
  }

  throw new Error('BACKEND_URL não configurada. Defina a variável de ambiente para acessar a API.');
}
