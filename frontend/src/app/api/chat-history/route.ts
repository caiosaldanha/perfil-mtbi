import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getBackendUrl } from '@/utils/backend';

export async function GET() {
  const headersList = await headers();
  const userId = headersList.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  try {
    const backendUrl = getBackendUrl();
    const backendResponse = await fetch(`${backendUrl}/chat/${userId}`, { cache: 'no-store' });

    if (backendResponse.ok) {
      const messages = await backendResponse.json();
      return NextResponse.json(messages);
    } else {
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: backendResponse.status });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
