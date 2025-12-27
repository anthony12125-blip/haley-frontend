'use client';

import { useState } from 'react';
import { X, Maximize2, Minimize2, Code, FileText, Table } from 'lucide-react';

interface Artifact {
  id: string;
  type: 'code' | 'data' | 'table' | 'llm-response';
  content: string;
  language?: string;
  title?: string;
  messageId: string;
  modelId?: string;
  isStreaming?: boolean;
}

interface ArtifactsPanelProps {
  artifacts: Artifact[];
  onClose: () => void;
}

export default function ArtifactsPanel({ artifacts, onClose }: ArtifactsPanelProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(
    artifacts.length > 0 ? artifacts[0].id : null
  );

  if (artifacts.length === 0) return null;

  const currentArtifact = artifacts.find(a => a.id === selectedArtifact);

  const getIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code className="w-4 h-4" />;
      case 'table': return <Table className="w-4 h-4" />;
      case 'llm-response': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getModelBadge = (modelId?: string) => {
    if (!modelId) return null;

    const badges: Record<string, { initial: string; color: string }> = {
      'gemini': { initial: 'G', color: 'bg-blue-600' },
      'gpt': { initial: 'C', color: 'bg-green-600' },
      'claude': { initial: 'A', color: 'bg-purple-600' },
      'llama': { initial: 'L', color: 'bg-orange-600' },
      'perplexity': { initial: 'P', color: 'bg-cyan-600' },
      'mistral': { initial: 'M', color: 'bg-red-600' },
      'grok': { initial: 'X', color: 'bg-yellow-600' },
    };

    const badge = badges[modelId] || { initial: modelId[0].toUpperCase(), color: 'bg-gray-600' };

    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${badge.color} text-white text-xs font-bold`}>
        {badge.initial}
      </span>
    );
  };

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 bg-gray-900 border-l border-gray-700 transition-all duration-300 z-40 ${
        isMaximized ? 'w-full' : 'w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold">Artifacts</h2>
          <span className="text-xs text-gray-400">({artifacts.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-gray-800 rounded"
            aria-label={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Artifact List */}
      <div className="flex flex-col h-[calc(100%-60px)]">
        <div className="flex-shrink-0 px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex gap-2 overflow-x-auto">
            {artifacts.map(artifact => (
              <button
                key={artifact.id}
                onClick={() => setSelectedArtifact(artifact.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
                  selectedArtifact === artifact.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {artifact.modelId && getModelBadge(artifact.modelId)}
                {getIcon(artifact.type)}
                {artifact.title || artifact.type}
                {artifact.isStreaming && (
                  <span className="ml-1 text-xs opacity-70">streaming...</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Artifact Content */}
        <div className="flex-1 overflow-auto p-4">
          {currentArtifact && (
            <div>
              {currentArtifact.title && (
                <h3 className="text-lg font-semibold mb-2">{currentArtifact.title}</h3>
              )}
              <pre className="bg-gray-800 p-4 rounded overflow-x-auto text-sm">
                <code className={`language-${currentArtifact.language || 'text'}`}>
                  {currentArtifact.content}
                </code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { Artifact };
