'use client';

import React, { useState } from 'react';
import { Palette, ArrowLeft, Loader2, Download, Sparkles, Layout, Type, Image, Square } from 'lucide-react';

interface AllInOneDesignProps {
  onBack: () => void;
}

type DesignType = 'social_post' | 'story' | 'flyer' | 'business_card' | 'presentation_slide' | 'youtube_thumbnail';

export default function AllInOneDesign({ onBack }: AllInOneDesignProps) {
  const [prompt, setPrompt] = useState('');
  const [designType, setDesignType] = useState<DesignType>('social_post');
  const [style, setStyle] = useState('modern');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const designTypes = [
    { id: 'social_post', label: 'Social Post', icon: Square, aspect: '1:1' },
    { id: 'story', label: 'Story/Reel', icon: Layout, aspect: '9:16' },
    { id: 'flyer', label: 'Flyer', icon: Image, aspect: '8.5:11' },
    { id: 'business_card', label: 'Business Card', icon: Square, aspect: '3.5:2' },
    { id: 'presentation_slide', label: 'Slide', icon: Layout, aspect: '16:9' },
    { id: 'youtube_thumbnail', label: 'YouTube Thumb', icon: Image, aspect: '16:9' },
  ];

  const styles = ['modern', 'minimal', 'bold', 'elegant', 'playful', 'corporate', 'vintage', 'neon'];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResultUrl(null);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'all_in_one_design',
          action: 'generate',
          params: { prompt, design_type: designType, style, primary_color: primaryColor }
        })
      });

      const data = await response.json();
      if (data.result?.image_url) {
        setResultUrl(data.result.image_url);
      }
    } catch (err) {
      console.error('[AllInOneDesign] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Palette className="w-5 h-5 text-fuchsia-400" /><h1 className="text-xl font-semibold">All-in-One Design</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          {/* Design Type Selection */}
          <div>
            <label className="block text-sm text-secondary mb-2">Design Type</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {designTypes.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => setDesignType(dt.id as DesignType)}
                  className={`p-3 rounded-lg border text-center ${designType === dt.id ? 'border-fuchsia-400 bg-fuchsia-500/20' : 'border-border hover:border-fuchsia-400/50'}`}
                >
                  <dt.icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">{dt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm text-secondary mb-2">What do you want to create?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A promotional post for a summer sale at a coffee shop, featuring iced drinks and a 20% off message..."
              className="w-full h-24 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm"
            />
          </div>

          {/* Style and Color */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm"
              >
                {styles.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-24 px-2 py-2 bg-panel-dark border border-border rounded text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full px-6 py-3 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Design...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" />Generate Design</>
            )}
          </button>
        </div>

        {/* Result */}
        {resultUrl && (
          <div className="glass rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Your Design</h2>
              <a
                href={resultUrl}
                download={`design_${designType}.png`}
                className="px-4 py-2 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 rounded-lg text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
            <img src={resultUrl} alt="Generated design" className="w-full rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}
