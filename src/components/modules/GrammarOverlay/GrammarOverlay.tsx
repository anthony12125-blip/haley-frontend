'use client';

import React, { useState } from 'react';
import { Type, ArrowLeft, Loader2, Copy, Check, Sparkles } from 'lucide-react';

interface GrammarOverlayProps {
  onBack: () => void;
}

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  type: 'grammar' | 'spelling' | 'style' | 'punctuation';
}

export default function GrammarOverlay({ onBack }: GrammarOverlayProps) {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCheck = async () => {
    if (!inputText.trim()) return;
    setIsChecking(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'grammar_overlay', action: 'check', params: { text: inputText } })
      });
      const data = await response.json();
      if (data.result) {
        setCorrectedText(data.result.corrected_text || '');
        setCorrections(data.result.corrections || []);
      }
    } catch (err) { console.error('[GrammarOverlay] Error:', err); }
    finally { setIsChecking(false); }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'grammar': return 'text-red-400 bg-red-500/20';
      case 'spelling': return 'text-orange-400 bg-orange-500/20';
      case 'style': return 'text-blue-400 bg-blue-500/20';
      case 'punctuation': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-secondary bg-panel-dark';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Type className="w-5 h-5 text-green-400" /><h1 className="text-xl font-semibold">Grammar Overlay</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-xl border border-border p-4 space-y-2">
            <label className="text-sm text-secondary">Your Text</label>
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your text here to check for grammar, spelling, and style..." className="w-full h-64 p-3 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm" />
          </div>
          <div className="glass rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary">Corrected Text</label>
              {correctedText && <button onClick={() => { navigator.clipboard.writeText(correctedText); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs flex items-center gap-1">{copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}</button>}
            </div>
            <div className="w-full h-64 p-3 bg-panel-dark border border-border rounded-lg overflow-auto text-sm">
              {isChecking ? <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div> : correctedText || <span className="text-secondary">Corrected text will appear here...</span>}
            </div>
          </div>
        </div>

        <button onClick={handleCheck} disabled={!inputText.trim() || isChecking} className="w-full px-6 py-3 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
          {isChecking ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Checking...</> : <><Sparkles className="w-5 h-5 mr-2" />Check Grammar</>}
        </button>

        {corrections.length > 0 && (
          <div className="glass rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-medium">{corrections.length} Corrections Found</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {corrections.map((c, i) => (
                <div key={i} className="p-3 bg-panel-dark rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(c.type)}`}>{c.type}</span>
                  </div>
                  <div><span className="line-through text-red-400">{c.original}</span> → <span className="text-green-400">{c.corrected}</span></div>
                  <p className="text-xs text-secondary mt-1">{c.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
