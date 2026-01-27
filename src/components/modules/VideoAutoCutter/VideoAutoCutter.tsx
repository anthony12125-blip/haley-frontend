'use client';

import React, { useState, useRef } from 'react';
import { Scissors, ArrowLeft, Upload, Loader2, Download, Play, Clock, Sparkles } from 'lucide-react';

interface VideoAutoCutterProps {
  onBack: () => void;
}

interface Clip {
  start: number;
  end: number;
  transcript: string;
  score: number;
  reason: string;
}

export default function VideoAutoCutter({ onBack }: VideoAutoCutterProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClips, setSelectedClips] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [cutStyle, setCutStyle] = useState<'highlights' | 'shorts' | 'chapters'>('highlights');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setClips([]);
    setExportUrl(null);
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setIsAnalyzing(true);
    setClips([]);

    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(videoFile);
      });

      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'video_auto_cutter',
          action: 'analyze',
          params: {
            video_base64: base64.split(',')[1],
            cut_style: cutStyle
          }
        })
      });

      const data = await response.json();
      if (data.result?.clips) {
        setClips(data.result.clips);
        setSelectedClips(data.result.clips.map((_: any, i: number) => i));
      }
    } catch (err) {
      console.error('[VideoAutoCutter] Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = async () => {
    if (selectedClips.length === 0) return;
    setIsExporting(true);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'video_auto_cutter',
          action: 'export',
          params: {
            clips: selectedClips.map(i => clips[i]),
            merge: true
          }
        })
      });

      const data = await response.json();
      if (data.result?.video_url) {
        setExportUrl(data.result.video_url);
      }
    } catch (err) {
      console.error('[VideoAutoCutter] Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleClip = (index: number) => {
    setSelectedClips(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-red-400" />
          <h1 className="text-xl font-semibold">Video Auto-Cutter</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Upload Section */}
        <div className="glass rounded-xl border border-border p-4 space-y-4">
          <input type="file" ref={fileInputRef} accept="video/*" onChange={handleFileUpload} className="hidden" />

          {!videoUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-12 border-2 border-dashed border-border rounded-xl hover:border-red-500 flex flex-col items-center gap-4"
            >
              <Upload className="w-12 h-12 text-red-400" />
              <div className="text-center">
                <p className="font-medium">Upload video to auto-cut</p>
                <p className="text-sm text-secondary mt-1">AI will find the best moments</p>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              <video src={videoUrl} className="w-full max-h-64 rounded-lg" controls />

              <div className="flex flex-wrap gap-2">
                {(['highlights', 'shorts', 'chapters'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setCutStyle(style)}
                    className={`px-3 py-1.5 rounded-lg border text-sm capitalize ${cutStyle === style ? 'border-red-400 bg-red-500/20' : 'border-border'}`}
                  >
                    {style === 'highlights' && '🔥 '}
                    {style === 'shorts' && '📱 '}
                    {style === 'chapters' && '📚 '}
                    {style}
                  </button>
                ))}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing video...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Find Best Clips
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Clips Section */}
        {clips.length > 0 && (
          <div className="glass rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{clips.length} Clips Found</h2>
              <div className="text-sm text-secondary">
                {selectedClips.length} selected
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-auto">
              {clips.map((clip, i) => (
                <div
                  key={i}
                  onClick={() => toggleClip(i)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedClips.includes(i)
                      ? 'border-red-400 bg-red-500/10'
                      : 'border-border hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedClips.includes(i)}
                        onChange={() => {}}
                        className="accent-red-500"
                      />
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          {formatTime(clip.start)} - {formatTime(clip.end)}
                        </div>
                        <p className="text-xs text-secondary mt-1 line-clamp-1">{clip.transcript}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-400">{clip.score}</div>
                      <div className="text-xs text-secondary">{clip.reason}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleExport}
              disabled={selectedClips.length === 0 || isExporting}
              className="w-full px-6 py-3 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Export Selected Clips
                </>
              )}
            </button>
          </div>
        )}

        {/* Export Result */}
        {exportUrl && (
          <div className="glass rounded-xl border border-green-500/30 p-4 space-y-3">
            <h3 className="font-medium text-green-400">Export Ready!</h3>
            <video src={exportUrl} className="w-full rounded-lg" controls />
            <a
              href={exportUrl}
              download="auto_cut_video.mp4"
              className="block w-full px-6 py-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg font-medium text-center"
            >
              <Download className="w-5 h-5 inline mr-2" />
              Download Video
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
