'use client';

import React, { useState } from 'react';
import { Image, ArrowLeft, Download, Loader2, Wand2, RefreshCw } from 'lucide-react';

interface ImageGeneratorProps {
  onBack: () => void;
}

export default function ImageGenerator({ onBack }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState<'sdxl' | 'flux' | 'dalle'>('flux');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [numImages, setNumImages] = useState(1);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'image_generator',
          action: 'generate',
          params: {
            prompt,
            negative_prompt: negativePrompt,
            model,
            aspect_ratio: aspectRatio,
            num_images: numImages
          }
        })
      });

      const data = await response.json();
      if (data.result?.images) {
        setGeneratedImages(data.result.images);
      }
    } catch (err) {
      console.error('[ImageGenerator] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Image Generator</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Prompt Section */}
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full h-24 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-2">Negative Prompt (optional)</label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Things to avoid in the image..."
              className="w-full px-4 py-3 bg-panel-dark border border-border rounded-lg focus:outline-none focus:border-primary text-sm"
            />
          </div>

          {/* Options Row */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as typeof model)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="flux">Flux (Fast)</option>
                <option value="sdxl">SDXL (Quality)</option>
                <option value="dalle">DALL-E 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="1:1">Square (1:1)</option>
                <option value="16:9">Landscape (16:9)</option>
                <option value="9:16">Portrait (9:16)</option>
                <option value="4:3">Standard (4:3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">Count</label>
              <select
                value={numImages}
                onChange={(e) => setNumImages(Number(e.target.value))}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value={1}>1 image</option>
                <option value={2}>2 images</option>
                <option value={4}>4 images</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full px-6 py-3 bg-primary/20 hover:bg-primary/30 disabled:bg-panel-light disabled:opacity-50 rounded-lg font-medium flex items-center justify-center transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate
              </>
            )}
          </button>
        </div>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Generated Images</h2>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </button>
            </div>

            <div className={`grid gap-4 ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {generatedImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`Generated ${idx + 1}`}
                    className="w-full rounded-lg"
                  />
                  <a
                    href={img}
                    download={`generated_${idx + 1}.png`}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
