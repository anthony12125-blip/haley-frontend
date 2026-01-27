'use client';

import React, { useState, useRef } from 'react';
import { Drama, ArrowLeft, Upload, Loader2, Download, Play, Pause, Image, Video } from 'lucide-react';

interface FaceSwapMotionProps {
  onBack: () => void;
}

export default function FaceSwapMotion({ onBack }: FaceSwapMotionProps) {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [targetMedia, setTargetMedia] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'image' | 'video'>('image');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'swap' | 'animate'>('swap');
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setSourceImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTargetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTargetType(file.type.startsWith('video') ? 'video' : 'image');
    const reader = new FileReader();
    reader.onload = (event) => setTargetMedia(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!sourceImage || !targetMedia) return;
    setIsProcessing(true);
    setResultUrl(null);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'face_swap_motion',
          action: mode,
          params: {
            source_image: sourceImage.split(',')[1],
            target_media: targetMedia.split(',')[1],
            target_type: targetType
          }
        })
      });

      const data = await response.json();
      if (data.result?.output_url) {
        setResultUrl(data.result.output_url);
      }
    } catch (err) {
      console.error('[FaceSwapMotion] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Drama className="w-5 h-5 text-violet-400" />
          <h1 className="text-xl font-semibold">Face Swap & Motion</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setMode('swap')}
            className={`px-4 py-2 rounded-lg border text-sm ${mode === 'swap' ? 'border-violet-400 bg-violet-500/20' : 'border-border'}`}
          >
            Face Swap
          </button>
          <button
            onClick={() => setMode('animate')}
            className={`px-4 py-2 rounded-lg border text-sm ${mode === 'animate' ? 'border-violet-400 bg-violet-500/20' : 'border-border'}`}
          >
            Face Animation
          </button>
        </div>

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Source Face */}
          <div className="glass rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Image className="w-4 h-4" />
              Source Face
            </h3>
            <input type="file" ref={sourceInputRef} accept="image/*" onChange={handleSourceUpload} className="hidden" />
            {!sourceImage ? (
              <button
                onClick={() => sourceInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-border rounded-lg hover:border-violet-500 flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-8 h-8 text-secondary" />
                <span className="text-sm text-secondary">Upload face photo</span>
              </button>
            ) : (
              <div className="relative">
                <img src={sourceImage} alt="Source" className="w-full h-40 object-cover rounded-lg" />
                <button
                  onClick={() => setSourceImage(null)}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Target Media */}
          <div className="glass rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Video className="w-4 h-4" />
              Target {mode === 'swap' ? 'Image/Video' : 'Driving Video'}
            </h3>
            <input
              type="file"
              ref={targetInputRef}
              accept={mode === 'swap' ? 'image/*,video/*' : 'video/*'}
              onChange={handleTargetUpload}
              className="hidden"
            />
            {!targetMedia ? (
              <button
                onClick={() => targetInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-border rounded-lg hover:border-violet-500 flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-8 h-8 text-secondary" />
                <span className="text-sm text-secondary">
                  {mode === 'swap' ? 'Upload target image or video' : 'Upload driving video'}
                </span>
              </button>
            ) : (
              <div className="relative">
                {targetType === 'video' ? (
                  <video src={targetMedia} className="w-full h-40 object-cover rounded-lg" controls />
                ) : (
                  <img src={targetMedia} alt="Target" className="w-full h-40 object-cover rounded-lg" />
                )}
                <button
                  onClick={() => setTargetMedia(null)}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={!sourceImage || !targetMedia || isProcessing}
          className="w-full px-6 py-3 bg-violet-500/20 hover:bg-violet-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing... (this may take a few minutes)
            </>
          ) : (
            <>
              <Drama className="w-5 h-5 mr-2" />
              {mode === 'swap' ? 'Swap Face' : 'Animate Face'}
            </>
          )}
        </button>

        {/* Result */}
        {resultUrl && (
          <div className="glass rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Result</h3>
              <a
                href={resultUrl}
                download={`face_${mode}_result.${targetType === 'video' ? 'mp4' : 'png'}`}
                className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
            {targetType === 'video' || mode === 'animate' ? (
              <video src={resultUrl} className="w-full rounded-lg" controls autoPlay loop />
            ) : (
              <img src={resultUrl} alt="Result" className="w-full rounded-lg" />
            )}
          </div>
        )}

        <p className="text-xs text-secondary text-center">
          ⚠️ Use responsibly. Do not create deepfakes of real people without consent.
        </p>
      </div>
    </div>
  );
}
