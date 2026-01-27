'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Send,
  Lightbulb,
  Target,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import {
  getGuidance,
  setNavigatorGoal,
  advanceGuidance,
  askNavigator,
  GuidanceState,
  GuidanceStep
} from '@/lib/vmApi';

interface NavigatorOverlayProps {
  sessionId: string;
  userId: string;
  onClose?: () => void;
  className?: string;
}

export default function NavigatorOverlay({
  sessionId,
  userId,
  onClose,
  className = ''
}: NavigatorOverlayProps) {
  // State
  const [guidance, setGuidance] = useState<GuidanceState | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'assistant', content: string}>>([]);
  const [mode, setMode] = useState<'guidance' | 'chat'>('guidance');
  
  // Fetch guidance state periodically
  useEffect(() => {
    const fetchGuidance = async () => {
      try {
        const state = await getGuidance(sessionId);
        setGuidance(state);
      } catch (error) {
        console.error('Failed to fetch guidance:', error);
      }
    };
    
    fetchGuidance();
    const interval = setInterval(fetchGuidance, 5000);
    
    return () => clearInterval(interval);
  }, [sessionId]);
  
  // Handle setting a goal
  const handleSetGoal = useCallback(async (goal: string) => {
    if (!goal.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await setNavigatorGoal(sessionId, goal);
      setGuidance(result);
      setInputValue('');
    } catch (error) {
      console.error('Failed to set goal:', error);
    }
    setIsLoading(false);
  }, [sessionId]);
  
  // Handle advancing to next step
  const handleAdvance = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await advanceGuidance(sessionId);
      setGuidance(result);
    } catch (error) {
      console.error('Failed to advance:', error);
    }
    setIsLoading(false);
  }, [sessionId]);
  
  // Handle asking a question
  const handleAskQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;
    
    setChatHistory(prev => [...prev, { type: 'user', content: question }]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const result = await askNavigator(sessionId, question);
      setChatHistory(prev => [...prev, { type: 'assistant', content: result.response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        type: 'assistant', 
        content: 'Sorry, I had trouble understanding the screen. Could you try again?' 
      }]);
    }
    
    setIsLoading(false);
  }, [sessionId]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'chat') {
      handleAskQuestion(inputValue);
    } else if (!guidance?.user_goal) {
      handleSetGoal(inputValue);
    }
  };
  
  // Collapsed state
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed bottom-4 right-4 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all ${className}`}
        title="Open Navigator"
      >
        <Lightbulb size={24} />
      </button>
    );
  }
  
  return (
    <div className={`fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-600 text-white">
        <div className="flex items-center gap-2">
          <Lightbulb size={20} />
          <span className="font-medium">Navigator</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-blue-500 rounded"
            title="Minimize"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-500 rounded"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {/* Mode tabs */}
      <div className="flex border-b dark:border-gray-700">
        <button
          onClick={() => setMode('guidance')}
          className={`flex-1 p-2 text-sm font-medium ${
            mode === 'guidance' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Target size={16} className="inline mr-1" />
          Guidance
        </button>
        <button
          onClick={() => setMode('chat')}
          className={`flex-1 p-2 text-sm font-medium ${
            mode === 'chat' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle size={16} className="inline mr-1" />
          Ask
        </button>
      </div>
      
      {/* Content */}
      <div className="h-64 overflow-y-auto p-3">
        {mode === 'guidance' ? (
          <>
            {/* Goal display or input */}
            {guidance?.user_goal ? (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Your goal:</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {guidance.user_goal}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm mb-4">
                <HelpCircle size={32} className="mx-auto mb-2 text-gray-400" />
                <p>What would you like to accomplish?</p>
                <p className="text-xs mt-1">Tell me your goal and I&apos;ll guide you through it</p>
              </div>
            )}
            
            {/* Current step */}
            {guidance?.current_step && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    Step {guidance.step_number} of {guidance.total_steps}
                  </span>
                  {guidance.current_step.completed && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {guidance.current_step.instruction}
                </p>
                
                {/* Action button */}
                <button
                  onClick={handleAdvance}
                  disabled={isLoading}
                  className="mt-3 w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Done, next step →'}
                </button>
              </div>
            )}
            
            {/* Suggested actions */}
            {guidance?.last_analysis?.suggested_actions && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Suggestions:</div>
                <div className="space-y-2">
                  {guidance.last_analysis.suggested_actions.slice(0, 3).map((action: string, i: number) => (
                    <div 
                      key={i}
                      className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      • {action}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Chat mode */
          <div className="space-y-3">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                <MessageCircle size={32} className="mx-auto mb-2 text-gray-400" />
                <p>Ask me anything about what you see on screen</p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg text-sm ${
                    msg.type === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                      : 'bg-gray-100 dark:bg-gray-700 mr-8'
                  }`}
                >
                  {msg.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-center text-gray-500 text-sm">
                Analyzing screen...
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              mode === 'chat' 
                ? 'Ask a question...' 
                : guidance?.user_goal 
                  ? 'Update goal...'
                  : 'What do you want to do?'
            }
            className="flex-1 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
