'use client';

import React, { useState } from 'react';
import { Clapperboard, ArrowLeft, Loader2, Download, Play, RefreshCw, Sparkles } from 'lucide-react';

interface CinematicVideoGenProps {
  onBack: () => void;
}

export default function CinematicVideoGen({ onBack }: CinematicVideoGenProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [duration, setDuration] = useState(4);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const styles = ['cinematic', 'anime', 'realistic', 'fantasy', 'sci-fi', 'noir', 'vintage', 'documentary'];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setVideoUrl(null);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'cinematic_video_gen',
          action: 'generate',
          params: { prompt, style, duration, aspect_ratio: aspectRatio }
        })
      });

      const data = await response.json();
      if (data.result?.video_url) {
        setVideoUrl(data.result.video_url);
      }
    } catch (err) {
      console.error('[CinematicVideoGen] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Clapperboard className="w-5 h-5 text-amber-400" />
          <h1 className="text-xl font-semibold">Cinematic Video Gen</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Generation Form */}
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Describe your video scene</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A lone astronaut walking across a vast Martian landscape at sunset, dust swirling around their boots, dramatic lighting..."
              className="w-full h-32 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm"
              >
                {styles.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm"
              >
                <option value={2}>2 seconds</option>
                <option value={4}>4 seconds</option>
                <option value={6}>6 seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm"
              >
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="21:9">21:9 (Cinematic)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating... (this may take 2-3 minutes)
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Video
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {videoUrl && (
          <div className="glass rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Generated Video</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </button>
                <a
                  href={videoUrl}
                  download="cinematic_video.mp4"
                  className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </a>
              </div>
            </div>

            <video
              src={videoUrl}
              className="w-full rounded-lg"
              controls
              autoPlay
              loop
            />
          </div>
        )}

        <p className="text-xs text-secondary text-center">
          🎬 Video generation typically takes 1-3 minutes depending on complexity
        </p>
      </div>
    </div>
  );
}
