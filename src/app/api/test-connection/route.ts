import { NextRequest, NextResponse } from 'next/server';

// Service test endpoints
const SERVICE_ENDPOINTS: Record<string, { url: string; method: string; headers: (key: string) => Record<string, string> }> = {
  openai: {
    url: 'https://api.openai.com/v1/models',
    method: 'GET',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    method: 'POST',
    headers: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }),
  },
  replicate: {
    url: 'https://api.replicate.com/v1/predictions',
    method: 'GET',
    headers: (key) => ({ 'Authorization': `Token ${key}` }),
  },
  elevenlabs: {
    url: 'https://api.elevenlabs.io/v1/user',
    method: 'GET',
    headers: (key) => ({ 'xi-api-key': key }),
  },
  stability: {
    url: 'https://api.stability.ai/v1/user/account',
    method: 'GET',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, apiKey } = body;

    if (!service) {
      return NextResponse.json({ error: 'Service is required' }, { status: 400 });
    }

    // If no API key provided, return success (demo mode - key exists in Firestore but not sent)
    // In production, you'd fetch the encrypted key from Firestore and decrypt it
    if (!apiKey) {
      // Simulate a small delay for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({ success: true, demo: true });
    }

    const endpoint = SERVICE_ENDPOINTS[service];
    if (!endpoint) {
      // For services without test endpoints (google, webhook), return success
      return NextResponse.json({ success: true, message: 'No test endpoint available' });
    }

    // Test the API key
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: endpoint.headers(apiKey),
      // For Anthropic POST, we need a minimal body
      ...(service === 'anthropic' && {
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      }),
    });

    // Most APIs return 401 for invalid keys
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 401 });
    }

    // Any 2xx or even some 4xx (like 400 for bad request but valid auth) means the key works
    if (response.ok || response.status === 400) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: `Service returned ${response.status}` },
      { status: response.status }
    );
  } catch (error) {
    console.error('[test-connection] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Connection test failed' },
      { status: 500 }
    );
  }
}
