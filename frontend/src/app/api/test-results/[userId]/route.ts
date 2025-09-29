import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/backend';

interface RouteParams {
  userId: string;
}

export async function GET(_request: NextRequest, context: { params: Promise<RouteParams> }) {
  const { userId } = await context.params;

  try {
    const backendUrl = getBackendUrl();
    const backendResponse = await fetch(`${backendUrl}/users/${userId}/test-results`, {
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json({ error: errorData.detail || 'Falha ao buscar resultados' }, { status: backendResponse.status });
    }

    const results = await backendResponse.json();
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao buscar resultados';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
