// src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/lib/haleyApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  request_id?: string;
  model_used?: string;
  mama_invoked?: boolean;
}

export default function HaleyChatInterface() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMagicWindow, setShowMagicWindow] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        request_id: response.request_id,
        model_used: response.model_id,
        mama_invoked: response.mama_invoked
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const sendRecording = async () => {
    // Stop recording if still recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // TODO: Send audio to backend for transcription
    // For now, just cancel
    setRecordedAudio(null);
    setIsRecording(false);
    
    // When backend transcription is ready:
    // const transcription = await transcribeAudio(recordedAudio);
    // setInput(transcription);
    // await handleSend();
  };

  const cancelRecording = () => {
    // Stop recording if still recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setRecordedAudio(null);
    setIsRecording(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'url(/space_comet_lavender.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/space_comet_lavender.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="h-[60px] flex items-center justify-between px-6" style={{
          background: 'rgba(20, 20, 35, 0.65)',
          borderBottom: '1px solid rgba(200, 166, 255, 0.25)'
        }}>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#c8a6ff' }}>Haley</h1>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>AI Operating System</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-1 rounded-lg transition-colors text-xs"
              style={{
                background: showDebug ? 'rgba(200, 166, 255, 0.3)' : 'rgba(200, 166, 255, 0.1)',
                color: '#e8ddff',
                border: '1px solid rgba(200, 166, 255, 0.35)'
              }}
            >
              Debug
            </button>
            <button
              onClick={() => setShowMagicWindow(!showMagicWindow)}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: 'rgba(200, 166, 255, 0.2)',
                color: '#e8ddff',
                border: '1px solid rgba(200, 166, 255, 0.35)'
              }}
            >
              {showMagicWindow ? 'Hide' : 'Show'} Magic Window
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-[800px] mx-auto space-y-[10px]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[75%] px-4 py-3"
                  style={{
                    borderRadius: '18px',
                    backgroundColor: msg.role === 'user' 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(200, 166, 255, 0.20)',
                    color: msg.role === 'user' ? '#ffffff' : '#e8ddff'
                  }}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div 
                    className="text-xs mt-1 flex justify-between items-center gap-2"
                    style={{ color: 'rgba(255, 255, 255, 0.45)' }}
                  >
                    <span>{msg.timestamp.toLocaleTimeString()}</span>
                    {showDebug && msg.request_id && (
                      <span className="text-[10px] font-mono">
                        {msg.model_used || 'unknown'} • {msg.request_id.slice(0, 8)}
                        {msg.mama_invoked && ' • mama'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3"
                  style={{
                    borderRadius: '18px',
                    backgroundColor: 'rgba(200, 166, 255, 0.20)',
                    color: '#e8ddff'
                  }}
                >
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Magic Window */}
        {showMagicWindow && (
          <div 
            className="mx-4 mb-4 p-4 max-h-[60%] overflow-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.07)',
              borderRadius: '16px',
              border: '1px solid rgba(200, 166, 255, 0.35)'
            }}
          >
            <p style={{ color: '#e8ddff' }}>Magic Window - Dynamic content appears here</p>
          </div>
        )}

        {/* Input Bar */}
        <div 
          className="h-[70px] px-4 flex items-center gap-2"
          style={{
            background: 'rgba(20, 20, 35, 0.65)',
            borderTop: '1px solid rgba(200, 166, 255, 0.25)'
          }}
        >
          {/* Plus Button */}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
            style={{
              background: 'rgba(200, 166, 255, 0.2)',
              color: '#c8a6ff'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message Haley..."
            disabled={isLoading || isRecording}
            className="flex-1 px-4 py-3 rounded-xl focus:outline-none disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(200, 166, 255, 0.25)'
            }}
          />

          {/* Recording Controls or Mic Button */}
          {isRecording ? (
            // Show send and cancel while recording
            <>
              <button
                onClick={cancelRecording}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
                style={{
                  background: 'rgba(255, 100, 100, 0.3)',
                  color: '#ff6666'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={sendRecording}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
                style={{
                  background: '#c8a6ff',
                  color: '#1a1a2e'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </>
          ) : (
            // Show mic button when not recording
            <>
              <button
                onClick={startRecording}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
                style={{
                  background: 'rgba(200, 166, 255, 0.2)',
                  color: '#c8a6ff'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Send Button (only show when typing) */}
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
                style={{
                  background: '#c8a6ff',
                  color: '#1a1a2e'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
