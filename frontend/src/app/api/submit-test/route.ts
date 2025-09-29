import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/backend';

export async function POST(request: Request) {
  const { user_id, answers } = await request.json();

  try {
    const backendUrl = getBackendUrl();
    const backendResponse = await fetch(`${backendUrl}/submit-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id, answers }),
    });

    if (backendResponse.ok) {
      const result = await backendResponse.json();
      return NextResponse.json(result);
    } else {
      const errorData = await backendResponse.json();
      return NextResponse.json({ error: errorData.detail || 'Failed to submit test' }, { status: backendResponse.status });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
