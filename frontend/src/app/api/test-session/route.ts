import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/backend';

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

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json({ error: errorData.detail || 'Falha ao iniciar sessão de teste' }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao criar sessão de teste';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
