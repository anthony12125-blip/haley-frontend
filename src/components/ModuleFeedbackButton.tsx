'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageSquarePlus,
  X,
  Mic,
  MicOff,
  Send,
  Loader2,
  Check,
  Sparkles,
  ThumbsUp,
  MapPin
} from 'lucide-react';

interface ModuleFeedbackButtonProps {
  moduleId: string;
  moduleName: string;
  userId?: string;
}

interface FeedbackData {
  moduleId: string;
  moduleName: string;
  userId?: string;
  feedbackText: string;
  feedbackType: 'feature_request' | 'bug_report' | 'ui_suggestion' | 'general';
  locationHint?: string;
  timestamp: string;
  audioTranscript?: string;
}

const FEEDBACK_TYPES = [
  { id: 'feature_request', label: 'Feature Request', icon: '✨', color: 'text-purple-400' },
  { id: 'ui_suggestion', label: 'UI Suggestion', icon: '🎨', color: 'text-blue-400' },
  { id: 'bug_report', label: 'Bug Report', icon: '🐛', color: 'text-red-400' },
  { id: 'general', label: 'General', icon: '💬', color: 'text-zinc-400' },
] as const;

export default function ModuleFeedbackButton({ 
  moduleId, 
  moduleName,
  userId 
}: ModuleFeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackData['feedbackType']>('feature_request');
  const [locationHint, setLocationHint] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [audioSupported, setAudioSupported] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showLocationInput, setShowLocationInput] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check for audio support
  useEffect(() => {
    setAudioSupported(
      typeof window !== 'undefined' && 
      'MediaRecorder' in window && 
      navigator.mediaDevices?.getUserMedia !== undefined
    );
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [feedbackText]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFeedbackText('');
        setLocationHint('');
        setIsSubmitted(false);
        setShowLocationInput(false);
        setFeedbackType('feature_request');
      }, 300);
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Transcribe the audio
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Update recording time every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const formData = new FormData();
      formData.append('audio', audioBlob, 'feedback.webm');
      
      const response = await fetch(`${backendUrl}/feedback/transcribe`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.transcript) {
          setFeedbackText(prev => prev ? `${prev}\n\n${data.transcript}` : data.transcript);
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      // Fallback: just note that voice input was used
      setFeedbackText(prev => prev ? `${prev}\n\n[Voice memo attached - transcription unavailable]` : '[Voice memo attached - transcription unavailable]');
    }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    
    setIsSubmitting(true);
    
    const feedback: FeedbackData = {
      moduleId,
      moduleName,
      userId,
      feedbackText: feedbackText.trim(),
      feedbackType,
      locationHint: locationHint.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const response = await fetch(`${backendUrl}/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      } else {
        // Store locally if backend fails
        const stored = localStorage.getItem('haley_module_feedback') || '[]';
        const feedbackList = JSON.parse(stored);
        feedbackList.push(feedback);
        localStorage.setItem('haley_module_feedback', JSON.stringify(feedbackList));
        setIsSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      }
    } catch (error) {
      // Store locally on network error
      const stored = localStorage.getItem('haley_module_feedback') || '[]';
      const feedbackList = JSON.parse(stored);
      feedbackList.push(feedback);
      localStorage.setItem('haley_module_feedback', JSON.stringify(feedbackList));
      setIsSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 group"
        title="Share feedback for this module"
        aria-label="Share module feedback"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Button */}
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/90 to-orange-600/90 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center border border-amber-400/30">
            <MessageSquarePlus size={20} className="text-white" />
          </div>
          
          {/* Pulse indicator */}
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-900 animate-pulse" />
        </div>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full sm:max-w-md bg-zinc-900 border border-zinc-700/50 sm:rounded-2xl rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                  <Sparkles size={18} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Share Feedback</h2>
                  <p className="text-xs text-zinc-500">{moduleName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check size={32} className="text-green-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">Thank you!</h3>
                    <p className="text-sm text-zinc-400 mt-1">Your feedback helps make HaleyOS better</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Feedback Type Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Type of Feedback
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FEEDBACK_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setFeedbackType(type.id as FeedbackData['feedbackType'])}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                            feedbackType === type.id
                              ? 'bg-amber-500/10 border-amber-500/50 text-white'
                              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          <span>{type.icon}</span>
                          <span className="text-sm">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Your Suggestion
                      </label>
                      {audioSupported && (
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all duration-200 ${
                            isRecording
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <MicOff size={12} />
                              <span>{formatTime(recordingTime)}</span>
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            </>
                          ) : (
                            <>
                              <Mic size={12} />
                              <span>Voice</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g., 'A summarize button would be great right after the results display'"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-200 resize-none min-h-[100px] max-h-[200px]"
                      rows={3}
                    />
                    <p className="text-xs text-zinc-600">
                      Tip: Be specific about where in the module you'd like to see changes
                    </p>
                  </div>

                  {/* Location Hint Toggle */}
                  <button
                    onClick={() => setShowLocationInput(!showLocationInput)}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-400 transition-colors"
                  >
                    <MapPin size={14} />
                    <span>{showLocationInput ? 'Hide' : 'Add'} location hint</span>
                  </button>

                  {/* Location Hint Input */}
                  {showLocationInput && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <input
                        type="text"
                        value={locationHint}
                        onChange={(e) => setLocationHint(e.target.value)}
                        placeholder="e.g., 'Below the search results', 'In the header'"
                        className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-200 text-sm"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!isSubmitted && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <button
                  onClick={submitFeedback}
                  disabled={!feedbackText.trim() || isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
