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

      if (!urlToPlay) {
        console.log('[SPEAKER] 🎤 Requesting voice synthesis');

        const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module: 'ttsadapter',
            action: 'synthesize',
            params: { text: content }
          })
        });

        if (!response.ok) throw new Error(`Synthesis failed: ${response.status}`);

        const result = await response.json();

        if (result.success && result.result?.audio_url) {
          urlToPlay = result.result.audio_url;
          setSynthesizedUrl(urlToPlay);
          console.log('[SPEAKER] ✅ Voice synthesized');
        } else {
          throw new Error('No audio URL returned');
        }
      }

      if (urlToPlay) {
        const audio = new Audio(urlToPlay);
        setIsPlaying(true);

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          console.error('[SPEAKER] ❌ Playback failed');
        };

        await audio.play();
        console.log('[SPEAKER] 🔊 Playing');
      }
    } catch (error) {
      console.error('[SPEAKER] ❌ Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sticky top-0 flex justify-end pointer-events-none" style={{ marginTop: '-2rem' }}>
      <button
        onClick={handleSpeak}
        disabled={isPlaying || isLoading}
        className="pointer-events-auto w-10 h-10 rounded-full bg-gray-800/90 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-blue-400 transition-colors shadow-lg"
        aria-label="Listen to message"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Volume2 className={`h-5 w-5 ${isPlaying ? 'text-blue-400' : ''}`} />
        )}
      </button>
    </div>
  );
}
