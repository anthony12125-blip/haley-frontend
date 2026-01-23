'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import MicButton from './MicButton';
import PlusUploadButton from './PlusUploadButton';

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;
    onSendMessage(input.trim(), files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleTranscript = (text: string) => {
    setInput(prev => prev + (prev ? '\n' : '') + text);
  };

  return (
    <div className="p-4 glass border-t border-white/10">
      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="px-3 py-1 bg-haley-primary/20 rounded-full text-sm flex items-center gap-2"
            >
              <span>{file.name}</span>
              <button
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                className="hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <PlusUploadButton onFilesSelected={handleFilesSelected} />

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Haley..."
          disabled={disabled}
          className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:border-haley-primary transition-colors disabled:opacity-50"
          rows={1}
          style={{ maxHeight: '120px' }}
        />

        <MicButton onTranscript={handleTranscript} />

        <button
          onClick={handleSend}
          disabled={disabled || (!input.trim() && files.length === 0)}
          className="p-3 rounded-full bg-haley-primary hover:bg-haley-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
