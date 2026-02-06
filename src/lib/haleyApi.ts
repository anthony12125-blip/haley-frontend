import type { Message } from '@/types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN;

export interface OSOperationResponse {
  status: 'success' | 'error' | 'completed';
  result?: any;
  model_used?: string;
  baby_invoked?: boolean;
  task?: string;
}

// Helper to convert audio Blob to base64
async function audioBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Transcribe audio using Whisper API
 */
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured for transcription');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transcription failed: ${error}`);
  }

  const data = await response.json();
  return data.text;
}

/**
 * Send message to Haley (OpenClaw)
 */
export async function sendMessage(
  message: string,
  provider?: string | null,
  onToken?: (token: string) => void,
  onComplete?: (response: OSOperationResponse) => void,
  onError?: (error: string) => void,
  files?: File[],
  userId?: string,
  conversationId?: string,
  conversationHistory?: Message[]
): Promise<{ messageId: string; cleanup: () => void }> {
  const messageId = `msg-${Date.now()}`;
  let isCancelled = false;

  try {
    // Call OpenClaw via WebSocket
    const wsUrl = new URL('/ws', OPENCLAW_URL);
    if (OPENCLAW_TOKEN) {
      wsUrl.searchParams.set('token', OPENCLAW_TOKEN);
    }

    const ws = new WebSocket(wsUrl.toString());
    let responseText = '';

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'message',
        text: message,
        sessionKey: `web:${userId || 'anonymous'}:${conversationId || 'default'}`,
      }));
    };

    ws.onmessage = (event) => {
      if (isCancelled) return;
      
      const data = JSON.parse(event.data);
      
      if (data.type === 'token' || data.type === 'delta') {
        const token = data.text || data.content || data.delta || '';
        responseText += token;
        onToken?.(token);
      } else if (data.type === 'complete' || data.type === 'done') {
        onComplete?.({
          status: 'success',
          model_used: 'haley',
          baby_invoked: false,
        });
        ws.close();
      } else if (data.type === 'error') {
        onError?.(data.error || 'Unknown error');
        ws.close();
      }
    };

    ws.onerror = () => {
      onError?.('WebSocket connection failed');
    };

    return {
      messageId,
      cleanup: () => {
        isCancelled = true;
        ws.close();
      },
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    onError?.(errorMsg);
    return { messageId, cleanup: () => {} };
  }
}

/**
 * Send audio message - transcribe then send text
 */
export async function sendAudioMessage(
  audioBlob: Blob,
  provider?: string | null,
  onToken?: (token: string) => void,
  onComplete?: (response: OSOperationResponse) => void,
  onError?: (error: string) => void,
  userId?: string,
  conversationId?: string
): Promise<{ messageId: string; cleanup: () => void }> {
  const messageId = `audio-${Date.now()}`;

  try {
    console.log('[HaleyAPI] Transcribing audio...');
    const transcript = await transcribeAudio(audioBlob);
    console.log('[HaleyAPI] Transcript:', transcript);

    // Now send the transcribed text as a regular message
    return sendMessage(
      transcript,
      provider,
      onToken,
      onComplete,
      onError,
      undefined,
      userId,
      conversationId
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Transcription failed';
    onError?.(errorMsg);
    return { messageId, cleanup: () => {} };
  }
}

/**
 * Multi-LLM not supported
 */
export async function sendMultiLLMMessage(
  message: string,
  providers: string[],
  onToken: (provider: string, token: string) => void,
  onComplete: (provider: string, response: any) => void,
  onError: (provider: string, error: string) => void,
  files?: File[],
  conversationHistory?: Message[]
): Promise<Array<{ provider: string; cleanup: () => void }>> {
  return [];
}

/**
 * Get system status
 */
export async function getSystemStatus() {
  return {
    os: 'OpenClaw',
    kernel_status: {
      kernel: 'HaleyOS',
      syscalls: 0,
      processes: 1,
      modules: 1,
      memory_keys: 0,
    },
    baby_pid: 0,
    note: 'Connected to OpenClaw',
  };
}

// Conversation persistence - disabled
export async function loadAllConversations(userId: string) { return []; }
export async function loadConversation(userId: string, conversationId: string) { return null; }
export async function deleteConversation(userId: string, conversationId: string) { return; }
export async function saveConversation(userId: string, conversationId: string, messages: Message[]) { return; }