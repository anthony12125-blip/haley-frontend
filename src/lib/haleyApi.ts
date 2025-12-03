const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://logic-engine-core-409495160162.us-central1.run.app';

export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  reply: string;
  tool_results?: any[];
}

export interface DiagnosticResult {
  justice: string;
  status: 'success' | 'error';
  response_time_ms?: number;
  error?: string;
}

export interface DiagnosticsResponse {
  timestamp: string;
  config_valid: boolean;
  api_tests_passed: number;
  api_tests_failed: number;
  results: DiagnosticResult[];
}

export interface QuickDiagnosticsResponse {
  timestamp: string;
  all_configured: boolean;
  missing_keys: string[];
  invalid_models: string[];
  invalid_endpoints: string[];
}

// Main chat function
export async function sendMessage(message: string): Promise<ChatResponse> {
  const response = await fetch(`${BACKEND_URL}/talk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Quick diagnostics (config check only, ~100ms)
export async function checkDiagnosticsQuick(): Promise<QuickDiagnosticsResponse> {
  const response = await fetch(`${BACKEND_URL}/api/v1/diagnostics/justices/quick`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Diagnostics request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Full diagnostics (actually calls all 7 Justice APIs, ~10 seconds)
export async function checkDiagnosticsFull(): Promise<DiagnosticsResponse> {
  const response = await fetch(`${BACKEND_URL}/api/v1/diagnostics/justices`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Diagnostics request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Export backend URL for direct access if needed
export { BACKEND_URL };
