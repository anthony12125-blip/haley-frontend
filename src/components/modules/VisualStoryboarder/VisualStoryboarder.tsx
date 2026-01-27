'use client';

import React, { useState } from 'react';
import { Film, ArrowLeft, Loader2, Download, Plus, Trash2, RefreshCw, Image } from 'lucide-react';

interface VisualStoryboarderProps {
  onBack: () => void;
}

interface StoryboardFrame {
  sceneNumber: number;
  description: string;
  dialogue: string;
  cameraAngle: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export default function VisualStoryboarder({ onBack }: VisualStoryboarderProps) {
  const [script, setScript] = useState('');
  const [frames, setFrames] = useState<StoryboardFrame[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [style, setStyle] = useState('cinematic');

  const styles = ['cinematic', 'anime', 'comic', 'sketch', 'realistic', 'noir'];

  const handleAnalyzeScript = async () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'visual_storyboarder',
          action: 'analyze',
          params: { script, style }
        })
      });

      const data = await response.json();
      if (data.result?.frames) {
        setFrames(data.result.frames);
      }
    } catch (err) {
      console.error('[VisualStoryboarder] Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateImage = async (index: number) => {
    const frame = frames[index];
    setFrames(prev => prev.map((f, i) => i === index ? { ...f, isGenerating: true } : f));

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'visual_storyboarder',
          action: 'generate_frame',
          params: {
            description: frame.description,
            camera_angle: frame.cameraAngle,
            style
          }
        })
      });

      const data = await response.json();
      if (data.result?.image_url) {
        setFrames(prev => prev.map((f, i) =>
          i === index ? { ...f, imageUrl: data.result.image_url, isGenerating: false } : f
        ));
      }
    } catch (err) {
      console.error('[VisualStoryboarder] Frame error:', err);
      setFrames(prev => prev.map((f, i) => i === index ? { ...f, isGenerating: false } : f));
    }
  };

  const handleGenerateAll = async () => {
    for (let i = 0; i < frames.length; i++) {
      if (!frames[i].imageUrl) {
        await handleGenerateImage(i);
      }
    }
  };

  const updateFrame = (index: number, field: keyof StoryboardFrame, value: string) => {
    setFrames(prev => prev.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    ));
  };

  const addFrame = () => {
    setFrames(prev => [...prev, {
      sceneNumber: prev.length + 1,
      description: '',
      dialogue: '',
      cameraAngle: 'Medium shot'
    }]);
  };

  const removeFrame = (index: number) => {
    setFrames(prev => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, sceneNumber: i + 1 })));
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-yellow-400" />
          <h1 className="text-xl font-semibold">Visual Storyboarder</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Script Input */}
        <div className="glass rounded-xl border border-border p-4 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Script or Scene Description</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="INT. COFFEE SHOP - DAY&#10;&#10;SARAH (30s) sits alone at a corner table, nervously checking her phone. The door opens and JAMES (30s) walks in, scanning the room..."
              className="w-full h-40 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm font-mono"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-secondary mb-1">Visual Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm"
              >
                {styles.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAnalyzeScript}
              disabled={!script.trim() || isAnalyzing}
              className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Film className="w-5 h-5 mr-2" />
                  Break Into Frames
                </>
              )}
            </button>
          </div>
        </div>

        {/* Storyboard Frames */}
        {frames.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Storyboard ({frames.length} frames)</h2>
              <div className="flex gap-2">
                <button
                  onClick={addFrame}
                  className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Frame
                </button>
                <button
                  onClick={handleGenerateAll}
                  className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-sm flex items-center"
                >
                  <Image className="w-4 h-4 mr-1" />
                  Generate All Images
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frames.map((frame, i) => (
                <div key={i} className="glass rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Scene {frame.sceneNumber}</span>
                    <button onClick={() => removeFrame(i)} className="p-1 hover:bg-red-500/20 rounded">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>

                  {/* Image Area */}
                  <div className="aspect-video bg-panel-dark rounded-lg overflow-hidden relative">
                    {frame.imageUrl ? (
                      <img src={frame.imageUrl} alt={`Frame ${frame.sceneNumber}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {frame.isGenerating ? (
                          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                        ) : (
                          <button
                            onClick={() => handleGenerateImage(i)}
                            className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-sm flex items-center"
                          >
                            <Image className="w-4 h-4 mr-1" />
                            Generate
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <input
                    value={frame.cameraAngle}
                    onChange={(e) => updateFrame(i, 'cameraAngle', e.target.value)}
                    placeholder="Camera angle..."
                    className="w-full px-2 py-1 bg-panel-dark border border-border rounded text-xs"
                  />

                  <textarea
                    value={frame.description}
                    onChange={(e) => updateFrame(i, 'description', e.target.value)}
                    placeholder="Scene description..."
                    className="w-full h-16 p-2 bg-panel-dark border border-border rounded text-xs resize-none"
                  />

                  <textarea
                    value={frame.dialogue}
                    onChange={(e) => updateFrame(i, 'dialogue', e.target.value)}
                    placeholder="Dialogue..."
                    className="w-full h-12 p-2 bg-panel-dark border border-border rounded text-xs resize-none italic"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
