'use client';

import { useState, useRef } from 'react';
import { Plus, Mic, Phone } from 'lucide-react';
import ThinkingToggle from './ThinkingToggle';

interface ChatInputBarProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: (text?: string, audioBlob?: Blob) => void;
  deepReasoningEnabled: boolean;
  onToggleReasoning: () => void;
  onFileUpload: (files: FileList) => void;
  onGallerySelect: () => void;
}

export default function ChatInputBar({
  input,
  setInput,
  isLoading,
  onSend,
  deepReasoningEnabled,
  onToggleReasoning,
  onFileUpload,
  onGallerySelect,
}: ChatInputBarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const startRecording = async () => {
    if (isInCall) return; // Exclusive with call
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSend(undefined, audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleCall = () => {
    if (isRecording) return; // Exclusive with recording
    
    setIsInCall(!isInCall);
    // TODO: Implement real-time call with Haley
    console.log('Call toggled:', !isInCall);
  };

  const handlePlusClick = () => {
    setShowUploadSheet(!showUploadSheet);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
    setShowUploadSheet(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  };

  return (
    <>
      {/* Upload Sheet */}
      {showUploadSheet && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowUploadSheet(false)}
        >
          <div 
            className="absolute bottom-20 left-4 right-4 glass rounded-haley-lg p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleFileSelect}
              className="w-full py-3 text-left px-4 hover:bg-white/10 rounded-haley text-haley-text-body transition-colors"
            >
              📁 Files
            </button>
            <button
              onClick={() => {
                onGallerySelect();
                setShowUploadSheet(false);
              }}
              className="w-full py-3 text-left px-4 hover:bg-white/10 rounded-haley text-haley-text-body transition-colors"
            >
              🖼️ Gallery
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 glass-light border-t border-white/10 safe-area-bottom">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div 
            className="flex items-end space-x-2 bg-black/55 rounded-haley-xl px-3 py-2"
            style={{ minHeight: '56px' }}
          >
            {/* Plus Button */}
            <button
              onClick={handlePlusClick}
              disabled={isLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label="Attach files"
            >
              <Plus className="w-6 h-6 text-haley-text-body" />
            </button>

            {/* Text Input Area */}
            <div className="flex-1 min-w-0">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message Haley..."
                disabled={isLoading || isRecording || isInCall}
                className="w-full bg-transparent text-haley-input-text placeholder:text-haley-input-placeholder resize-none outline-none py-2"
                rows={1}
                style={{ 
                  maxHeight: '120px',
                  minHeight: '24px'
                }}
              />
            </div>

            {/* Reasoning Toggle */}
            <ThinkingToggle
              enabled={deepReasoningEnabled}
              onToggle={onToggleReasoning}
              disabled={isLoading}
            />

            {/* Mic Button */}
            {!isInCall && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'hover:bg-white/10'
                } disabled:opacity-50`}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded"></div>
                  </div>
                ) : (
                  <Mic className="w-6 h-6 text-haley-text-body" />
                )}
              </button>
            )}

            {/* Live Call Button */}
            {!isRecording && (
              <button
                onClick={toggleCall}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  isInCall 
                    ? 'bg-haley-secondary hover:bg-haley-secondary-dim' 
                    : 'hover:bg-white/10'
                } disabled:opacity-50`}
                aria-label={isInCall ? 'End call' : 'Start call'}
              >
                <Phone className={`w-6 h-6 ${isInCall ? 'text-white' : 'text-haley-text-body'}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
