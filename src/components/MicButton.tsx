'use client';

import { Mic, MicOff } from 'lucide-react';
import { useState, useRef } from 'react';

interface MicButtonProps {
  onTranscript: (text: string) => void;
}

export default function MicButton({ onTranscript }: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleClick = async () => {
    if (!isRecording) {
      // First tap: start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
          // TODO: Send to speech-to-text API
          // For now, just notify
          onTranscript('[Voice message recorded]');
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Microphone error:', error);
        alert('Could not access microphone');
      }
    } else {
      // Second tap: stop and send
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-3 rounded-full transition-all ${
        isRecording
          ? 'bg-red-500 animate-pulse'
          : 'bg-haley-primary hover:bg-haley-secondary'
      }`}
      title={isRecording ? 'Tap to stop and send' : 'Tap to record'}
    >
      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}
