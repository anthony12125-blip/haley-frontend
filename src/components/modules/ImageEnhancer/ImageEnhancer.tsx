'use client';

import React, { useState, useRef } from 'react';
import { Sparkles, ArrowLeft, Upload, Download, Loader2, ZoomIn } from 'lucide-react';

interface ImageEnhancerProps {
  onBack: () => void;
}

export default function ImageEnhancer({ onBack }: ImageEnhancerProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState<2 | 4>(2);
  const [enhanceType, setEnhanceType] = useState<'upscale' | 'denoise' | 'sharpen' | 'all'>('upscale');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string);
      setEnhancedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = async () => {
    if (!originalImage) return;
    setIsProcessing(true);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'image_enhancer',
          action: 'enhance',
          params: {
            image_base64: originalImage.split(',')[1],
            scale: scale,
            enhance_type: enhanceType
          }
        })
      });

      const data = await response.json();
      if (data.result?.enhanced_image) {
        setEnhancedImage(`data:image/png;base64,${data.result.enhanced_image}`);
      }
    } catch (err) {
      console.error('[ImageEnhancer] Error:', err);
    } finally {
      setIsProcessing(false);
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
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Image Enhancer</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Upload Section */}
        {!originalImage && (
          <div className="glass rounded-xl border border-border p-8">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-12 border-2 border-dashed border-border rounded-xl hover:border-primary transition-colors flex flex-col items-center gap-4"
            >
              <Upload className="w-12 h-12 text-secondary" />
              <div className="text-center">
                <p className="font-medium">Upload an image to enhance</p>
                <p className="text-sm text-secondary mt-1">Supports JPG, PNG, WebP</p>
              </div>
            </button>
          </div>
        )}

        {/* Image Preview & Options */}
        {originalImage && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="glass rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Original</span>
                  <button
                    onClick={() => { setOriginalImage(null); setEnhancedImage(null); }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full rounded-lg object-contain max-h-64"
                />
              </div>

              {/* Enhanced */}
              <div className="glass rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Enhanced</span>
                  {enhancedImage && (
                    <a
                      href={enhancedImage}
                      download="enhanced_image.png"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  )}
                </div>
                {enhancedImage ? (
                  <img
                    src={enhancedImage}
                    alt="Enhanced"
                    className="w-full rounded-lg object-contain max-h-64"
                  />
                ) : (
                  <div className="w-full h-64 bg-panel-dark rounded-lg flex items-center justify-center text-secondary">
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      'Enhanced image will appear here'
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="glass rounded-xl border border-border p-4 space-y-4">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs text-secondary mb-1">Upscale Factor</label>
                  <div className="flex gap-2">
                    {[2, 4].map((s) => (
                      <button
                        key={s}
                        onClick={() => setScale(s as 2 | 4)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          scale === s ? 'border-primary bg-primary/20' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-secondary mb-1">Enhancement</label>
                  <select
                    value={enhanceType}
                    onChange={(e) => setEnhanceType(e.target.value as typeof enhanceType)}
                    className="px-4 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="upscale">Upscale Only</option>
                    <option value="denoise">Denoise</option>
                    <option value="sharpen">Sharpen</option>
                    <option value="all">All Enhancements</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleEnhance}
                disabled={isProcessing}
                className="w-full px-6 py-3 bg-primary/20 hover:bg-primary/30 disabled:bg-panel-light disabled:opacity-50 rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-5 h-5 mr-2" />
                    Enhance Image
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
