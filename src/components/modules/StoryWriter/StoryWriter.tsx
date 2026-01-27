'use client';

import React, { useState } from 'react';
import { Feather, ArrowLeft, Loader2, Copy, Check, Sparkles, BookOpen } from 'lucide-react';

interface StoryWriterProps {
  onBack: () => void;
}

export default function StoryWriter({ onBack }: StoryWriterProps) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('fantasy');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [story, setStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'story_writer', action: 'generate', params: { prompt, genre, length } })
      });
      const data = await response.json();
      if (data.result?.story) setStory(data.result.story);
    } catch (err) { console.error('[StoryWriter] Error:', err); }
    finally { setIsGenerating(false); }
  };

  const genres = ['fantasy', 'sci-fi', 'romance', 'mystery', 'horror', 'comedy', 'drama', 'adventure'];

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Feather className="w-5 h-5 text-amber-400" /><h1 className="text-xl font-semibold">Story Writer</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Story Idea or Prompt</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A detective who can talk to ghosts investigates a murder in a haunted mansion..." className="w-full h-32 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <button key={g} onClick={() => setGenre(g)} className={`px-3 py-1.5 rounded-lg border text-sm capitalize ${genre === g ? 'border-amber-400 bg-amber-500/20' : 'border-border hover:border-amber-400/50'}`}>{g}</button>
            ))}
          </div>
          
          <div>
            <label className="block text-xs text-secondary mb-1">Length</label>
            <div className="flex gap-2">
              {(['short', 'medium', 'long'] as const).map((l) => (
                <button key={l} onClick={() => setLength(l)} className={`px-4 py-2 rounded-lg border text-sm capitalize ${length === l ? 'border-amber-400 bg-amber-500/20' : 'border-border'}`}>
                  {l === 'short' ? 'Flash (~500 words)' : l === 'medium' ? 'Short Story (~1500 words)' : 'Long (~3000 words)'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="w-full px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Writing...</> : <><Sparkles className="w-5 h-5 mr-2" />Write Story</>}
          </button>
        </div>

        {story && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium flex items-center gap-2"><BookOpen className="w-5 h-5" />Your Story</h2>
              <button onClick={() => { navigator.clipboard.writeText(story); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center">
                {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}{copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-6 bg-panel-dark rounded-lg prose prose-invert max-w-none overflow-auto max-h-[600px] text-sm whitespace-pre-wrap leading-relaxed">{story}</div>
            <div className="text-xs text-secondary">{story.split(/\s+/).length} words</div>
          </div>
        )}
      </div>
    </div>
  );
}
