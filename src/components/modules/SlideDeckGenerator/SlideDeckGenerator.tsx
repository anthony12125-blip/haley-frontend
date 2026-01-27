'use client';

import React, { useState } from 'react';
import { Presentation, ArrowLeft, Loader2, Download, Sparkles, Plus, Trash2 } from 'lucide-react';

interface SlideDeckGeneratorProps {
  onBack: () => void;
}

interface Slide {
  title: string;
  content: string;
}

export default function SlideDeckGenerator({ onBack }: SlideDeckGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState(10);
  const [style, setStyle] = useState<'professional' | 'creative' | 'minimal'>('professional');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setSlides([]);
    setDownloadUrl(null);
    
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'slide_deck_generator',
          action: 'generate',
          params: { topic, num_slides: numSlides, style }
        })
      });
      const data = await response.json();
      if (data.result?.slides) setSlides(data.result.slides);
      if (data.result?.download_url) setDownloadUrl(data.result.download_url);
    } catch (err) {
      console.error('[SlideDeckGenerator] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (slides.length === 0) return;
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'slide_deck_generator',
          action: 'export',
          params: { slides, style }
        })
      });
      const data = await response.json();
      if (data.result?.download_url) setDownloadUrl(data.result.download_url);
    } catch (err) {
      console.error('[SlideDeckGenerator] Export error:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Presentation className="w-5 h-5 text-orange-400" /><h1 className="text-xl font-semibold">Slide Deck Generator</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Presentation Topic</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Quarterly Sales Report, Introduction to Machine Learning, Company Overview..." className="w-full h-24 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm" />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Number of Slides</label>
              <select value={numSlides} onChange={(e) => setNumSlides(Number(e.target.value))} className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm">
                <option value={5}>5 slides</option>
                <option value={10}>10 slides</option>
                <option value={15}>15 slides</option>
                <option value={20}>20 slides</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value as typeof style)} className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm">
                <option value="professional">Professional</option>
                <option value="creative">Creative</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!topic.trim() || isGenerating} className="w-full px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Slides</>}
          </button>
        </div>

        {slides.length > 0 && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Generated Slides ({slides.length})</h2>
              <button onClick={handleExport} className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />Export PPTX
              </button>
            </div>
            
            <div className="grid gap-3">
              {slides.map((slide, i) => (
                <div key={i} className="p-4 bg-panel-dark rounded-lg border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-secondary mb-1">Slide {i + 1}</div>
                      <input value={slide.title} onChange={(e) => { const newSlides = [...slides]; newSlides[i].title = e.target.value; setSlides(newSlides); }} className="w-full font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none" />
                      <textarea value={slide.content} onChange={(e) => { const newSlides = [...slides]; newSlides[i].content = e.target.value; setSlides(newSlides); }} className="w-full mt-2 text-sm text-secondary bg-transparent resize-none focus:outline-none" rows={3} />
                    </div>
                    <button onClick={() => setSlides(slides.filter((_, j) => j !== i))} className="p-1 hover:bg-red-500/20 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setSlides([...slides, { title: 'New Slide', content: 'Add content here...' }])} className="w-full p-3 border-2 border-dashed border-border rounded-lg hover:border-primary flex items-center justify-center gap-2 text-sm text-secondary">
              <Plus className="w-4 h-4" />Add Slide
            </button>
            
            {downloadUrl && (
              <a href={downloadUrl} download="presentation.pptx" className="block w-full px-6 py-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg font-medium text-center text-green-400">
                <Download className="w-5 h-5 inline mr-2" />Download Presentation
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
