import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/backend';
import {
  extractBackendError,
  isRecord,
  normalizeBackendMessage,
  readBackendPayload,
} from '@/utils/apiProxy';

export async function POST(request: NextRequest) {
  const payload = await request.json();

  try {
    const backendUrl = getBackendUrl();
    const backendResponse = await fetch(`${backendUrl}/test-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const backendPayload = await readBackendPayload(backendResponse);

    if (!backendResponse.ok) {
      const fallback = 'Não foi possível iniciar o teste.';
      const message = normalizeBackendMessage(extractBackendError(backendPayload), fallback);
      return NextResponse.json({ error: message }, { status: backendResponse.status });
    }

    if (!isRecord(backendPayload)) {
      const fallback = 'Recebemos uma resposta inesperada do servidor do teste.';
      const message = normalizeBackendMessage(extractBackendError(backendPayload), fallback);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json(backendPayload);
  } catch (error) {
    const fallback = 'Não foi possível conectar ao servidor de testes. Tente novamente.';
    const message = error instanceof Error ? normalizeBackendMessage(error.message, fallback) : fallback;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
