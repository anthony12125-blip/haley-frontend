const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://logic-engine-core-409495160162.us-central1.run.app';

export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  reply: string;
  tool_results?: any[];
  request_id?: string;
  timestamp?: string;
  mama_invoked?: boolean;
}

export interface LogicEngineResponse {
  request_id: string;
  timestamp: string;
  status: string;
  intent: string;
  mama_invoked: boolean;
  result: any;
  state_updates: any;
}

export interface SystemHealthResponse {
  status: string;
  mama_awake: boolean;
  requests_processed: number;
  state_size: number;
}

// Main chat function - now uses proper logic engine endpoint
export async function sendMessage(message: string, userId: string = 'web-user'): Promise<ChatResponse> {
  const response = await fetch(`${BACKEND_URL}/logic/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'chat.message',
      user_id: userId,
      payload: { message },
      permissions: ['user']
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
  }

  const logicResponse: LogicEngineResponse = await response.json();
  
  // Transform logic engine response to expected chat format
  return {
    reply: logicResponse.result?.response || logicResponse.result?.message || 'No response',
    tool_results: logicResponse.result?.tool_results || [],
    request_id: logicResponse.request_id,
    timestamp: logicResponse.timestamp,
    mama_invoked: logicResponse.mama_invoked
  };
}

// System health check (replaces old diagnostics)
export async function checkSystemHealth(): Promise<SystemHealthResponse> {
  const response = await fetch(`${BACKEND_URL}/logic/system/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// List available modules
export async function listModules(): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/logic/modules`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Module list failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Wake Mama Haley explicitly
export async function wakeMama(userId: string = 'web-user'): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/logic/mama/wake?user_id=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Wake Mama failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Export backend URL for direct access if needed
export { BACKEND_URL };


// Export backend URL for direct access if needed
export { BACKEND_URL };
