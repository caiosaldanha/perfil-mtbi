import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/backend';

export async function POST(request: Request) {
  const { name, email } = await request.json();

  try {
    const backendUrl = getBackendUrl();
    const backendResponse = await fetch(`${backendUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });

    if (backendResponse.ok) {
      const user = await backendResponse.json();
      return NextResponse.json(user);
    } else {
      const errorData = await backendResponse.json();
      return NextResponse.json({ error: errorData.detail || 'Failed to create user' }, { status: backendResponse.status });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
