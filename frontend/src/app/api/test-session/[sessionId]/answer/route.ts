import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/backend';
import {
  extractBackendError,
  isRecord,
  normalizeBackendMessage,
  readBackendPayload,
} from '@/utils/apiProxy';

interface RouteParams {
  sessionId: string;
}

export async function POST(request: NextRequest, context: { params: Promise<RouteParams> }) {
  const { sessionId } = await context.params;
  const body = await request.json();

  try {
    const backendUrl = getBackendUrl();
    const backendResponse = await fetch(`${backendUrl}/test-session/${sessionId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const backendPayload = await readBackendPayload(backendResponse);

    if (!backendResponse.ok) {
      const fallback = 'Não foi possível registrar a resposta.';
      const message = normalizeBackendMessage(extractBackendError(backendPayload), fallback);
      return NextResponse.json({ error: message }, { status: backendResponse.status });
    }

    if (!isRecord(backendPayload)) {
      const fallback = 'Recebemos uma resposta inesperada ao registrar sua resposta.';
      const message = normalizeBackendMessage(extractBackendError(backendPayload), fallback);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json(backendPayload);
  } catch (error) {
    const fallback = 'Não foi possível registrar a resposta no servidor. Tente novamente.';
    const message = error instanceof Error ? normalizeBackendMessage(error.message, fallback) : fallback;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
