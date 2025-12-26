import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

interface SpeakerButtonProps {
  messageId: string;
  content: string;
  audioUrl?: string;
  onAudioReady?: (url: string, text: string) => void;
  onError?: (message: string) => void;
}

export function SpeakerButton({ messageId, content, audioUrl, onAudioReady, onError }: SpeakerButtonProps) {
  const [loading, setLoading] = useState(false);
  const [localUrl, setLocalUrl] = useState(audioUrl);

  const handleSpeak = async () => {
    console.log('[SPEAKER] 🎯 handleSpeak CALLED - Speaker button clicked!');

    setLoading(true);
    console.log('[SPEAKER] Loading state set to true');
    try {
      let url = localUrl;
      if (!url) {
        const requestPayload = { module: 'ttsadapter', action: 'synthesize', params: { text: content } };
        console.log('[SPEAKER] 🎤 Requesting synthesis from Module Matrix...');
        console.log('[SPEAKER] 📤 Request payload:', requestPayload);

        const res = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        console.log('[SPEAKER] 📥 Response status:', res.status, res.statusText);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('[SPEAKER] ❌ Error response body:', errorText);
          const errorMsg = `Module Matrix returned ${res.status}: ${res.statusText}`;
          console.log('[SPEAKER] 🚨 Calling onError callback with:', errorMsg);
          onError?.(errorMsg);
          console.log('[SPEAKER] 🚨 onError callback called');
          throw new Error(errorMsg);
        }

        const data = await res.json();
        console.log('[SPEAKER] 📦 Response data:', data);

        // Check for error in result
        if (data.result && data.result.error) {
          const errorMsg = `TTS Error: ${data.result.error}`;
          console.error('[SPEAKER] ❌ Module returned error:', data.result.error);
          onError?.(errorMsg);
          throw new Error(errorMsg);
        }

        if (!data.result || !data.result.audio_url) {
          console.error('[SPEAKER] ❌ Invalid response structure:', data);
          throw new Error('No audio URL in response');
        }

        url = data.result.audio_url;
        setLocalUrl(url);
        console.log('[SPEAKER] ✅ Got audio URL:', url);
      }

      // Pass audio URL to parent for playback control
      console.log('[SPEAKER] 🎵 Calling onAudioReady with URL and content');
      onAudioReady?.(url, content);
    } catch (err) {
      console.error('[SPEAKER] Error:', err);
      onError?.(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticky top-4 flex justify-end pr-2 pointer-events-none z-50">
      <button
        onClick={handleSpeak}
        disabled={loading}
        className="pointer-events-auto p-2 bg-gray-800 rounded-full shadow-lg border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Play audio"
      >
        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </div>
  );
}
