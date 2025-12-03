import { User } from 'firebase/auth';

const HALEY_URL = process.env.NEXT_PUBLIC_HALEY_URL || '';

export interface HaleyMessage {
  message: string;
  attachments?: File[];
  firebaseUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
  };
}

export interface HaleyResponse {
  reply: string;
  meta?: {
    timestamp?: string;
    tokens_used?: number;
  };
  magic_window?: {
    animation?: string;
    content?: any;
  };
}

export async function sendMessageToHaley(
  message: string,
  user: User,
  idToken: string,
  attachments?: File[]
): Promise<HaleyResponse> {
  // Check if user is asking for diagnostics
  const diagnosticsKeywords = [
    'diagnostics',
    'seven justices',
    'justice panel',
    'self-diagnostic',
    'check yourself',
    'status check',
    'system status'
  ];
  
  const isAskingForDiagnostics = diagnosticsKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (isAskingForDiagnostics) {
    try {
      const diagResponse = await fetch(`${HALEY_URL}/api/v1/diagnostics/justices/quick`);
      if (diagResponse.ok) {
        const diagData = await diagResponse.json();
        
        // Format the diagnostics into a readable response
        const justiceStatus = Object.entries(diagData.justices)
          .map(([name, status]: [string, any]) => {
            const icon = status.configured ? '✅' : '❌';
            return `${icon} ${name}: ${status.configured ? 'Ready' : 'Not configured'}`;
          })
          .join('\n');
        
        return {
          reply: `**Seven Justices Panel Status**\n\nOverall: ${diagData.status}\n\n${justiceStatus}\n\nLast checked: ${new Date(diagData.timestamp).toLocaleString()}`
        };
      }
    } catch (error) {
      console.error('Diagnostics check failed:', error);
      // Fall through to normal chat if diagnostics fail
    }
  }

  // Normal chat flow
  const formData = new FormData();
  
  const payload: HaleyMessage = {
    message,
    firebaseUser: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    },
  };

  formData.append('data', JSON.stringify(payload));

  if (attachments && attachments.length > 0) {
    attachments.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
  }

  const response = await fetch(`${HALEY_URL}/talk`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Haley API error: ${response.statusText}`);
  }

  return response.json();
}
