export async function readBackendPayload(response: Response): Promise<unknown> {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText.trim();
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function extractBackendError(payload: unknown): string | undefined {
  if (!payload) {
    return undefined;
  }

  if (typeof payload === 'string') {
    const message = payload.trim();
    return message || undefined;
  }

  if (isRecord(payload)) {
    const candidateKeys = ['error', 'detail', 'message'];
    for (const key of candidateKeys) {
      const value = payload[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }
  }

  return undefined;
}

export function normalizeBackendMessage(message: string | undefined, fallback: string): string {
  if (!message) {
    return fallback;
  }

  const normalized = message.trim();
  if (!normalized) {
    return fallback;
  }

  if (normalized.toLowerCase() === 'internal server error') {
    return fallback;
  }

  return normalized;
}
