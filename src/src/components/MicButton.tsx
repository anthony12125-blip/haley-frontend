'use client';

import { Mic, MicOff, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MicButtonProps {
  onTranscript: (text: string) => void;
  onAudioRecorded?: (audioBlob: Blob) => void;
}

export default function MicButton({ onTranscript, onAudioRecorded }: MicButtonProps) {
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
      console.log('[MIC] 🎤 Starting voice recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('[MIC] 📊 Audio chunk received, size:', e.data.size);
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('[MIC] ⏹️ Recording stopped. Audio blob created:');
        console.log('[MIC]    Blob size:', audioBlob.size, 'bytes');
        console.log('[MIC]    Blob type:', audioBlob.type);

        // If onAudioRecorded callback is provided, use it for transcription
        if (onAudioRecorded) {
          console.log('[MIC] 📤 Calling onAudioRecorded with audioBlob...');
          onAudioRecorded(audioBlob);
        } else {
          // Fallback to old behavior if callback not provided
          console.log('[MIC] ⚠️ No onAudioRecorded callback, using placeholder');
          onTranscript(`[Voice message recorded - ${formatTime(recordingTime)}]`);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('[MIC] ✅ Recording started successfully');
    } catch (error) {
      console.error('[MIC] ❌ Microphone error:', error);
      alert('Could not access microphone');
    }
  };

  const handleStopRecording = () => {
    console.log('[MIC] 🛑 Stop recording button clicked');
    if (mediaRecorderRef.current && isRecording) {
      console.log('[MIC] Stopping MediaRecorder...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('[MIC] MediaRecorder stopped, waiting for onstop event...');
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
