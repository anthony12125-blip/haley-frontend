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
    console.log('[SPEAKER] 📝 Content to synthesize:', content.substring(0, 100) + '...');

    setLoading(true);
    try {
      let url = localUrl;
      if (!url) {
        // CRITICAL: Explicit Swedish-British Voice ID
        const VOICE_ID = 'cgSgspJ2msm6clMCkdW9'; // Rachel - Swedish-British

        const requestPayload = {
          module: 'ttsadapter',
          action: 'synthesize',
          params: {
            text: content,
            voice_id: VOICE_ID
          }
        };

        const TTS_API_URL = process.env.NEXT_PUBLIC_TTS_API_URL || 'https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module';
        
        console.log('[SPEAKER] 🎤 Requesting synthesis from TTS API...');
        console.log('[SPEAKER] 📤 Request payload:', JSON.stringify(requestPayload, null, 2));
        console.log('[SPEAKER] 🔊 Using Voice ID:', VOICE_ID);
        console.log('[SPEAKER] 🌐 API URL:', TTS_API_URL);

        const res = await fetch(TTS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        console.log('[SPEAKER] 📥 ElevenLabs API Response Status:', res.status, res.statusText);
        console.log('[SPEAKER] 📥 Response Headers:', Object.fromEntries(res.headers.entries()));

        if (!res.ok) {
          const errorText = await res.text();
          console.error('[SPEAKER] ❌ Error response body:', errorText);
          const errorMsg = `Module Matrix returned ${res.status}: ${res.statusText}`;
          onError?.(errorMsg);
          throw new Error(errorMsg);
        }

        const data = await res.json();
        console.log('[SPEAKER] 📦 Full Response data:', JSON.stringify(data, null, 2));

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

      // DIRECT PLAYBACK - new Audio(url).play()
      if (url) {
        console.log('[SPEAKER] 🎵 Playing audio directly with new Audio().play()');
        console.log('[SPEAKER] 🎵 Audio URL:', url);

        const audio = new Audio(url);

        audio.addEventListener('loadeddata', () => {
          console.log('[SPEAKER] ✅ Audio loaded successfully, duration:', audio.duration, 'seconds');
        });

        audio.addEventListener('playing', () => {
          console.log('[SPEAKER] ▶️ Audio playback started');
        });

        audio.addEventListener('ended', () => {
          console.log('[SPEAKER] ⏹️ Audio playback completed');
        });

        audio.addEventListener('error', (e) => {
          console.error('[SPEAKER] ❌ Audio playback error:', e);
          onError?.('Audio playback failed');
        });

        await audio.play();
        console.log('[SPEAKER] ✅ audio.play() called successfully');

        // Also notify parent (for AudioPlaybackBar UI if needed)
        onAudioReady?.(url, content);
      } else {
        console.error('[SPEAKER] ❌ No URL available for playback');
        throw new Error('Audio URL is undefined');
      }
    } catch (err) {
      console.error('[SPEAKER] ❌ Fatal error:', err);
      onError?.(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      console.log('[SPEAKER] 🏁 handleSpeak complete, loading state reset');
    }
  };

  return (
    <button
      onClick={handleSpeak}
      disabled={loading}
      className="p-2 bg-gray-800 rounded-full shadow-lg border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label="Play audio"
    >
      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
}
