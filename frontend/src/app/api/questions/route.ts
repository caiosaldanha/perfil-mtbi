import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/questions`);

    if (backendResponse.ok) {
      const questions = await backendResponse.json();
      return NextResponse.json(questions);
    } else {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: backendResponse.status });
    }
  } catch (error) {
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
