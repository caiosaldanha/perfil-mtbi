import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/backend';

export async function GET() {
  try {
    const backendUrl = getBackendUrl();
    const backendResponse = await fetch(`${backendUrl}/questions`);

    if (backendResponse.ok) {
      const questions = await backendResponse.json();
      return NextResponse.json(questions);
    } else {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: backendResponse.status });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
