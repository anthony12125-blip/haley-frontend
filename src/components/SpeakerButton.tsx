import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

interface SpeakerButtonProps {
  messageId: string;
  content: string;
  audioUrl?: string;
}

export function SpeakerButton({ messageId, content, audioUrl }: SpeakerButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [synthesizedUrl, setSynthesizedUrl] = useState<string | undefined>(audioUrl);

  const handleSpeak = async () => {
    if (isPlaying) return;

    try {
      setIsLoading(true);

      let urlToPlay = synthesizedUrl;

      // If no audio URL exists, request synthesis
      if (!urlToPlay) {
        console.log('[SPEAKER] 🎤 Requesting voice synthesis for message:', messageId);

        const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            module: 'ttsadapter',
            action: 'synthesize',
            params: {
              text: content
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Synthesis failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('[SPEAKER] 📦 Synthesis response:', result);

        if (result.success && result.result?.audio_url) {
          urlToPlay = result.result.audio_url;
          setSynthesizedUrl(urlToPlay);
          console.log('[SPEAKER] ✅ Voice synthesized:', urlToPlay);
        } else {
          throw new Error('No audio URL returned');
        }
      }

      // Play audio
      if (urlToPlay) {
        const audio = new Audio(urlToPlay);
        setIsPlaying(true);

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          console.error('[SPEAKER] ❌ Audio playback failed');
        };

        await audio.play();
        console.log('[SPEAKER] 🔊 Playing Haley voice');
      }
    } catch (error) {
      console.error('[SPEAKER] ❌ Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSpeak}
      disabled={isPlaying || isLoading}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-blue-400"
      aria-label="Listen to message"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-blue-400' : ''}`} />
      )}
    </button>
  );
}
