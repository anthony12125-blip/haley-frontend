import { NextRequest } from 'next/server';

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN;

/**
 * Simple OpenClaw chat proxy
 * Forwards chat requests from the frontend to the OpenClaw gateway
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversation_id, user_id, attachments } = body;

    // Build the OpenClaw WebSocket URL
    const wsUrl = new URL('/ws', OPENCLAW_URL);
    if (OPENCLAW_TOKEN) {
      wsUrl.searchParams.set('token', OPENCLAW_TOKEN);
    }

    // Create a response stream
    const stream = new ReadableStream({
      async start(controller) {
        const ws = new WebSocket(wsUrl.toString());
        let messageId = `msg-${Date.now()}`;
        
        ws.onopen = () => {
          // Send message to OpenClaw
          ws.send(JSON.stringify({
            type: 'message',
            text: message,
            sessionKey: `web:${user_id || 'anonymous'}:${conversation_id || 'default'}`,
          }));
          
          // Send initial SSE headers
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'init', messageId })}\n\n`));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'token' || data.type === 'delta') {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
              type: 'token', 
              token: data.text || data.content || data.delta 
            })}\n\n`));
          } else if (data.type === 'complete' || data.type === 'done') {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
              type: 'complete',
              response: {
                status: 'success',
                model_used: 'haley',
                baby_invoked: false,
              }
            })}\n\n`));
            controller.close();
            ws.close();
          } else if (data.type === 'error') {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: data.error || 'Unknown error' 
            })}\n\n`));
            controller.close();
            ws.close();
          }
        };
        
        ws.onerror = (error) => {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
            type: 'error', 
            error: 'WebSocket connection failed' 
          })}\n\n`));
          controller.close();
        };
        
        ws.onclose = () => {
          controller.close();
        };
      },
      cancel() {
        // Cleanup if stream is cancelled
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('[OpenClaw Proxy] Error:', error);
    return Response.json(
      { error: 'Failed to connect to OpenClaw' },
      { status: 500 }
    );
  }
}