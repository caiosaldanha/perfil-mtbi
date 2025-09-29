import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/backend';

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

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json({ error: errorData.detail || 'Falha ao registrar resposta' }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao registrar resposta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
