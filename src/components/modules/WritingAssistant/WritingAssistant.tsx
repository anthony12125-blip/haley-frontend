'use client';

import React, { useState } from 'react';
import { Pencil, ArrowLeft, Copy, Check, Loader2, Sparkles, RotateCcw } from 'lucide-react';

interface WritingAssistantProps {
  onBack: () => void;
}

export default function WritingAssistant({ onBack }: WritingAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [action, setAction] = useState<'improve' | 'simplify' | 'formal' | 'casual' | 'expand' | 'shorten'>('improve');

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'writing_assistant',
          action: 'process',
          params: { text: inputText, mode: action }
        })
      });
      const data = await response.json();
      if (data.result?.text) setOutputText(data.result.text);
    } catch (err) {
      console.error('[WritingAssistant] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actions = [
    { id: 'improve', label: 'Improve', desc: 'Fix grammar & enhance clarity' },
    { id: 'simplify', label: 'Simplify', desc: 'Make easier to understand' },
    { id: 'formal', label: 'Formal', desc: 'Professional tone' },
    { id: 'casual', label: 'Casual', desc: 'Conversational tone' },
    { id: 'expand', label: 'Expand', desc: 'Add more detail' },
    { id: 'shorten', label: 'Shorten', desc: 'Make concise' },
  ];

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <Pencil className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Writing Assistant</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {/* Action Selection */}
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setAction(a.id as typeof action)}
              className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                action === a.id ? 'border-primary bg-primary/20' : 'border-border hover:border-primary/50'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-secondary">{actions.find(a => a.id === action)?.desc}</p>

        {/* Input/Output */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-xl border border-border p-4 space-y-2">
            <label className="text-sm text-secondary">Your Text</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type your text here..."
              className="w-full h-48 p-3 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div className="glass rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary">Improved Text</label>
              {outputText && (
                <button onClick={handleCopy} className="text-xs flex items-center gap-1 hover:text-primary">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="w-full h-48 p-3 bg-panel-dark border border-border rounded-lg overflow-auto text-sm">
              {isProcessing ? (
                <div className="flex items-center justify-center h-full text-secondary"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : outputText || <span className="text-secondary">Result will appear here...</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleProcess}
            disabled={!inputText.trim() || isProcessing}
            className="flex-1 px-6 py-3 bg-primary/20 hover:bg-primary/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center"
          >
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Sparkles className="w-5 h-5 mr-2" />Transform</>}
          </button>
          {outputText && (
            <button onClick={() => setInputText(outputText)} className="px-4 py-3 bg-panel-dark hover:bg-panel-light border border-border rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
