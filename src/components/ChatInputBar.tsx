'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Image as ImageIcon, Plus, X } from 'lucide-react';

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
    if (input.trim()) {
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

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      // Don't send the audio
      audioChunksRef.current = [];
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
        sidebarOpen ? 'md:left-80' : 'md:left-[60px]'
      }`}
    >
      {/* Centered container with max-width to match messages */}
      <div className="mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
        {/* Main Input Area */}
        <div className="py-4 w-full">
          {/* All controls inside a single chat bubble */}
          <div className="relative w-full">
            {isRecording ? (
              <div className="flex items-center justify-between bg-panel-dark border border-error rounded-xl px-4 py-3 w-full">
                <button
                  onClick={cancelRecording}
                  className="text-error hover:text-error/80 transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  <X size={20} />
                  <span className="text-sm font-medium">Cancel</span>
                </button>
                <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                  <div className="w-3 h-3 bg-error rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-secondary text-sm whitespace-nowrap">{formatTime(recordingTime)}</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="text-success hover:text-success/80 transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  <Send size={20} />
                  <span className="text-sm font-medium">Send</span>
                </button>
              </div>
            ) : (
              <>
                {/* Plus Menu Dropdown */}
                {showPlusMenu && (
                  <div className="absolute bottom-full left-0 mb-2 glass-strong rounded-xl border border-border p-2 space-y-1 min-w-[160px] z-50">
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
                
                {/* Single bubble containing all controls */}
                <div className="flex items-end gap-2 bg-panel-dark border border-border rounded-xl px-2 py-2 focus-within:border-primary transition-all duration-180 w-full" 
                     style={{ 
                       boxShadow: 'var(--input-focus-glow, none)',
                       transitionProperty: 'border-color, box-shadow'
                     }}
                     onFocus={(e) => {
                       if (e.currentTarget.contains(e.target)) {
                         e.currentTarget.style.setProperty('--input-focus-glow', '0 0 0 2px rgba(75, 108, 255, 0.25)');
                       }
                     }}
                     onBlur={(e) => {
                       if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                         e.currentTarget.style.setProperty('--input-focus-glow', 'none');
                       }
                     }}
                >
                  {/* Plus icon */}
                  <button
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    className={`icon-btn !w-8 !h-8 flex-shrink-0 ${showPlusMenu ? 'bg-primary text-white' : ''}`}
                    title="More options"
                  >
                    {showPlusMenu ? <X size={18} /> : <Plus size={18} />}
                  </button>
                  
                  {/* Text input */}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Haley OS..."
                    className="flex-1 bg-transparent border-none outline-none resize-none min-h-[36px] max-h-[200px] text-primary placeholder:text-secondary py-1 min-w-0"
                    rows={1}
                  />
                  
                  {/* Microphone button */}
                  <button
                    onClick={startRecording}
                    className="icon-btn !w-8 !h-8 flex-shrink-0"
                    title="Voice input"
                  >
                    <Mic size={20} />
                  </button>
                  
                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className={`icon-btn !w-8 !h-8 flex-shrink-0 ${
                      input.trim()
                        ? 'bg-primary text-white hover:bg-accent'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
