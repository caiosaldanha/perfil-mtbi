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

export async function POST(_request: NextRequest, context: { params: Promise<RouteParams> }) {
  const { sessionId } = await context.params;

  try {
    const backendUrl = getBackendUrl();
    const backendResponse = await fetch(`${backendUrl}/test-session/${sessionId}/rewind`, {
      method: 'POST',
      cache: 'no-store',
    });

    const backendPayload = await readBackendPayload(backendResponse);

    if (!backendResponse.ok) {
      const fallback = 'Não foi possível voltar para a pergunta anterior.';
      const message = normalizeBackendMessage(extractBackendError(backendPayload), fallback);
      return NextResponse.json({ error: message }, { status: backendResponse.status });
    }

    if (!isRecord(backendPayload)) {
      const fallback = 'Recebemos uma resposta inesperada ao tentar voltar a pergunta.';
      const message = normalizeBackendMessage(extractBackendError(backendPayload), fallback);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json(backendPayload);
  } catch (error) {
    const fallback = 'Não foi possível voltar para a pergunta no momento. Tente novamente.';
    const message = error instanceof Error ? normalizeBackendMessage(error.message, fallback) : fallback;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
