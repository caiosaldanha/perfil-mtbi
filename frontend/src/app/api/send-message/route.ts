import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { user_id, message } = await request.json();

  try {
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id, message }),
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      return NextResponse.json(data);
    } else {
      const errorData = await backendResponse.json();
      return NextResponse.json({ error: errorData.detail || 'Failed to send message' }, { status: backendResponse.status });
    }
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
