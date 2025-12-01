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
