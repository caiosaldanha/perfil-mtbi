import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = headers();
  const userId = headersList.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  try {
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/chat/${userId}`);

    if (backendResponse.ok) {
      const messages = await backendResponse.json();
      return NextResponse.json(messages);
    } else {
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: backendResponse.status });
    }
  } catch (error) {
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
