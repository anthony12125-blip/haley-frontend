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

  const handleSpeak = async () => {
    if (isPlaying) return;

    try {
      setIsLoading(true);

      if (audioUrl) {
        // Play existing audio
        const audio = new Audio(audioUrl);
        setIsPlaying(true);

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          console.error('Audio playback failed');
        };

        await audio.play();
      } else {
        // Request voice synthesis
        // TODO: Make API call to synthesize speech
        console.log('Voice synthesis not yet implemented for:', content);
      }
    } catch (error) {
      console.error('Speech error:', error);
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
