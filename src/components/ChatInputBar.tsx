'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, StopCircle, Image as ImageIcon, Plus, X } from 'lucide-react';

interface ChatInputBarProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: (message?: string, audioBlob?: Blob) => void;
  onFileUpload?: (files: FileList) => void;
  onGallerySelect?: () => void;
  sidebarOpen?: boolean;
}

export default function ChatInputBar({
  input,
  setInput,
  isLoading,
  onSend,
  onFileUpload,
  onGallerySelect,
  sidebarOpen = false,
}: ChatInputBarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onFileUpload) {
      onFileUpload(e.target.files);
      setShowPlusMenu(false);
    }
  };

  const startRecording = async () => {
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
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`input-container glass-strong border-t border-border safe-bottom transition-all duration-300 ${
        sidebarOpen ? 'md:left-80' : 'md:left-0'
      }`}
    >
      {/* Main Input Area */}
      <div className="flex items-end gap-2 p-4">
        {/* Left: Plus Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className={`icon-btn ${showPlusMenu ? 'bg-primary text-white' : ''}`}
            title="More options"
            disabled={isLoading}
          >
            {showPlusMenu ? <X size={20} /> : <Plus size={20} />}
          </button>

          {/* Plus Menu Dropdown */}
          {showPlusMenu && (
            <div className="absolute bottom-full left-0 mb-2 glass-strong rounded-xl border border-border p-2 space-y-1 min-w-[160px]">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
              >
                <Paperclip size={18} />
                <span className="text-sm">Attach file</span>
              </button>
              {onGallerySelect && (
                <button
                  onClick={() => {
                    onGallerySelect();
                    setShowPlusMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                >
                  <ImageIcon size={18} />
                  <span className="text-sm">Gallery</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          {isRecording ? (
            <div className="flex items-center justify-between bg-panel-dark border border-error rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-error rounded-full animate-pulse" />
                <span className="text-error font-semibold">Recording</span>
                <span className="text-secondary text-sm">{formatTime(recordingTime)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="text-error hover:text-error/80 transition-colors"
              >
                <StopCircle size={24} />
              </button>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message HaleyOS..."
              className="input-field resize-none min-h-[44px] max-h-[200px] w-full"
              disabled={isLoading}
              rows={1}
            />
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {!isRecording && (
            <button
              onClick={startRecording}
              className="icon-btn"
              title="Voice input"
              disabled={isLoading}
            >
              <Mic size={20} />
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !isRecording)}
            className={`icon-btn ${
              input.trim() && !isLoading
                ? 'bg-primary text-white hover:bg-accent'
                : 'opacity-50 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
