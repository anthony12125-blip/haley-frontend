import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://logic-engine-core2-951854392741.us-central1.run.app';

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const body = await request.json();

    console.log(`[API Proxy] POST /module/${path}`, body);

    const response = await fetch(`${BACKEND_URL}/module/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[API Proxy] Backend returned ${response.status}`);
      return NextResponse.json(
        { success: false, error: `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Proxy] Module proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reach backend' },
      { status: 500 }
    );
  }
}
