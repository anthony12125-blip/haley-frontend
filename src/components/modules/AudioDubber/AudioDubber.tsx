'use client';

import React, { useState, useRef } from 'react';
import { Volume2, ArrowLeft, Upload, Download, Loader2, Play, Pause, Languages } from 'lucide-react';

interface AudioDubberProps {
  onBack: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' }, { code: 'zh', name: 'Chinese' },
];

export default function AudioDubber({ onBack }: AudioDubberProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState('es');
  const [dubbedAudioUrl, setDubbedAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [preserveVoice, setPreserveVoice] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAudioFile(file); setDubbedAudioUrl(null); }
  };

  const handleDub = async () => {
    if (!audioFile) return;
    setIsProcessing(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioFile);
      });
      
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'audio_dubber',
          action: 'dub',
          params: { audio_base64: base64.split(',')[1], target_lang: targetLang, preserve_voice: preserveVoice }
        })
      });
      const data = await response.json();
      if (data.result?.audio_url) setDubbedAudioUrl(data.result.audio_url);
    } catch (err) {
      console.error('[AudioDubber] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Audio Dubber</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-medium">Upload Audio or Video</h2>
          <input type="file" ref={fileInputRef} accept="audio/*,video/*" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full p-8 border-2 border-dashed border-border rounded-xl hover:border-primary flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-secondary" />
            <span className="text-sm text-secondary">{audioFile ? audioFile.name : 'Click to upload audio/video file'}</span>
          </button>

          {audioFile && (
            <>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs text-secondary mb-1">Target Language</label>
                  <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="px-4 py-2 bg-panel-dark border border-border rounded-lg text-sm">
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={preserveVoice} onChange={(e) => setPreserveVoice(e.target.checked)} className="accent-primary" />
                  <span className="text-sm">Preserve original voice characteristics</span>
                </label>
              </div>

              <button onClick={handleDub} disabled={isProcessing} className="w-full px-6 py-3 bg-primary/20 hover:bg-primary/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
                {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Dubbing...</> : <><Languages className="w-5 h-5 mr-2" />Dub Audio</>}
              </button>
            </>
          )}
        </div>

        {dubbedAudioUrl && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <h2 className="text-lg font-medium">Dubbed Audio</h2>
            <div className="flex items-center gap-4 p-4 bg-panel-dark rounded-lg">
              <audio ref={audioRef} src={dubbedAudioUrl} onEnded={() => setIsPlaying(false)} />
              <button onClick={togglePlayback} className="p-3 bg-primary/20 hover:bg-primary/30 rounded-full">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <div className="flex-1"><div className="h-2 bg-border rounded-full"><div className="h-full bg-primary w-0" /></div></div>
              <a href={dubbedAudioUrl} download="dubbed_audio.mp3" className="p-2 hover:bg-panel-light rounded-lg"><Download className="w-5 h-5" /></a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
