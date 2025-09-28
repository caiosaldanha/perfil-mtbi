import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { name, email } = await request.json();

  try {
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/users`, {
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
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
