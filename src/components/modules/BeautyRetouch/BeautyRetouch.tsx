'use client';

import React, { useState, useRef } from 'react';
import { Sparkles, ArrowLeft, Upload, Download, Loader2, Sliders } from 'lucide-react';

interface BeautyRetouchProps {
  onBack: () => void;
}

export default function BeautyRetouch({ onBack }: BeautyRetouchProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [smoothness, setSmoothness] = useState(50);
  const [brightness, setBrightness] = useState(50);
  const [enhanceFace, setEnhanceFace] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { setOriginalImage(event.target?.result as string); setEnhancedImage(null); };
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
          module: 'beauty_retouch',
          action: 'enhance',
          params: { image_base64: originalImage.split(',')[1], smoothness, brightness, enhance_face: enhanceFace }
        })
      });
      const data = await response.json();
      if (data.result?.enhanced_image) setEnhancedImage(`data:image/png;base64,${data.result.enhanced_image}`);
    } catch (err) {
      console.error('[BeautyRetouch] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-400" />
          <h1 className="text-xl font-semibold">Beauty & Retouch</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {!originalImage ? (
          <div className="glass rounded-xl border border-border p-8">
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-12 border-2 border-dashed border-border rounded-xl hover:border-pink-500 flex flex-col items-center gap-4">
              <Upload className="w-12 h-12 text-pink-400" />
              <div className="text-center"><p className="font-medium">Upload a portrait photo</p><p className="text-sm text-secondary mt-1">Best results with clear face shots</p></div>
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between"><span className="text-sm text-secondary">Original</span><button onClick={() => { setOriginalImage(null); setEnhancedImage(null); }} className="text-xs text-red-400">Remove</button></div>
                <img src={originalImage} alt="Original" className="w-full rounded-lg object-contain max-h-64" />
              </div>
              <div className="glass rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between"><span className="text-sm text-secondary">Enhanced</span>{enhancedImage && <a href={enhancedImage} download="enhanced.png" className="text-xs text-primary flex items-center gap-1"><Download className="w-3 h-3" />Download</a>}</div>
                {enhancedImage ? <img src={enhancedImage} alt="Enhanced" className="w-full rounded-lg object-contain max-h-64" /> : <div className="w-full h-64 bg-panel-dark rounded-lg flex items-center justify-center text-secondary">{isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : 'Enhanced result'}</div>}
              </div>
            </div>

            <div className="glass rounded-xl border border-border p-4 space-y-4">
              <div className="flex items-center gap-2"><Sliders className="w-5 h-5" /><span className="font-medium">Adjustments</span></div>
              <div className="space-y-3">
                <div><label className="flex items-center justify-between text-sm"><span>Skin Smoothing</span><span>{smoothness}%</span></label><input type="range" min="0" max="100" value={smoothness} onChange={(e) => setSmoothness(Number(e.target.value))} className="w-full accent-pink-500" /></div>
                <div><label className="flex items-center justify-between text-sm"><span>Brightness</span><span>{brightness}%</span></label><input type="range" min="0" max="100" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-pink-500" /></div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={enhanceFace} onChange={(e) => setEnhanceFace(e.target.checked)} className="accent-pink-500" /><span className="text-sm">Face Enhancement (eyes, teeth)</span></label>
              </div>
              <button onClick={handleEnhance} disabled={isProcessing} className="w-full px-6 py-3 bg-pink-500/20 hover:bg-pink-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
                {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Sparkles className="w-5 h-5 mr-2" />Enhance Photo</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
