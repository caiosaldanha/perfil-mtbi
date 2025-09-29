import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/backend';

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

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json({ error: errorData.detail || 'Falha ao voltar pergunta' }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao voltar pergunta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
