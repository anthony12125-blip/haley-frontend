'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader, RotateCw } from 'lucide-react';

interface LLMResponseCardProps {
  modelId: string;
  modelName: string;
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  colorClass?: string;
  onRetry?: () => void;
}

export default function LLMResponseCard({
  modelId,
  modelName,
  content,
  isStreaming,
  isComplete,
  colorClass = 'hue-teal',
  onRetry
}: LLMResponseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getModelColor = () => {
    switch (modelId) {
      case 'gemini': return 'hue-teal';
      case 'gpt': return 'hue-blue';
      case 'claude': return 'hue-orange';
      case 'llama': return 'hue-pink';
      case 'perplexity': return 'hue-purple';
      case 'mistral': return 'hue-yellow';
      case 'grok': return 'hue-cyan';
      default: return 'hue-teal';
    }
  };

  const getModelCode = () => {
    switch (modelId) {
      case 'gemini': return 'GEM';
      case 'gpt': return 'GPT';
      case 'claude': return 'CLA';
      case 'llama': return 'LLA';
      case 'perplexity': return 'PER';
      case 'mistral': return 'MIS';
      case 'grok': return 'GRK';
      default: return modelId.substring(0, 3).toUpperCase();
    }
  };

  const isError = content.startsWith('Error:');
  const modelColorClass = getModelColor();
  const modelCode = getModelCode();

  return (
    <div className={`llm-response-card glass-medium rounded-lg border border-border mb-3 ${modelColorClass}`}>
      {/* Card Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-panel-light/30 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          {/* 3-letter identifier - size varies by state */}
          <div className={`font-bold ${isError ? 'text-lg' : 'text-2xl'} ${modelColorClass}`}>
            {modelCode}
          </div>

          {/* Status indicator */}
          {isStreaming && (
            <Loader size={16} className="animate-spin text-primary" />
          )}
          {isComplete && !isStreaming && !isError && (
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
          {!isStreaming && !isComplete && (
            <div className="w-2 h-2 rounded-full bg-gray-500" />
          )}

          {/* Retry icon for error state */}
          {isError && onRetry && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="p-1 hover:bg-panel-light rounded transition-colors"
              title="Retry this provider"
            >
              <RotateCw size={16} className="text-error" />
            </button>
          )}

          {/* Status text */}
          <span className="text-xs text-secondary">
            {isStreaming ? 'Responding...' : isError ? 'Failed' : isComplete ? 'Complete' : 'Waiting...'}
          </span>
        </div>

        {/* Expand/collapse icon */}
        <div className="flex items-center gap-2">
          {content && !isError && (
            <span className="text-xs text-secondary">
              {content.length} chars
            </span>
          )}
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Card Content - Expandable */}
      {isExpanded && (
        <div className="border-t border-border p-4">
          {content ? (
            <div className="text-sm whitespace-pre-wrap break-words">
              {content}
            </div>
          ) : (
            <div className="text-secondary text-sm italic">
              {isStreaming ? 'Streaming...' : 'No response yet'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
