'use client';

import { Mic, MicOff, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MicButtonProps {
  onTranscript: (text: string) => void;
}

export default function MicButton({ onTranscript }: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Handle click outside to cancel
  useEffect(() => {
    if (!isRecording) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    // Add a small delay before attaching the listener to avoid immediate cancellation
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
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
        // For now, just notify with recording duration
        onTranscript(`[Voice message recorded - ${formatTime(recordingTime)}]`);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Could not access microphone');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCancel = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop recording without processing
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
      chunksRef.current = [];
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div 
        ref={bubbleRef}
        className="flex items-center gap-3 px-4 py-2 bg-red-500/20 border-2 border-red-500 rounded-full animate-pulse-slow"
      >
        {/* Cancel button on left (opposite side) */}
        <button
          onClick={handleCancel}
          className="p-2 rounded-full bg-red-500/30 hover:bg-red-500/50 transition-colors"
          title="Cancel recording"
        >
          <X className="w-4 h-4 text-red-500" />
        </button>

        {/* Recording indicator */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-mono text-red-500 min-w-[3rem]">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Stop/Send button on right */}
        <button
          onClick={handleStopRecording}
          className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          title="Stop and send"
        >
          <MicOff className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartRecording}
      className="p-3 rounded-full bg-haley-primary hover:bg-haley-secondary transition-colors"
      title="Tap to record"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
