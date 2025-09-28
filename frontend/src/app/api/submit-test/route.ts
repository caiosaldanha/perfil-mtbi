import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { user_id, answers } = await request.json();

  try {
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/submit-test`, {
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
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
