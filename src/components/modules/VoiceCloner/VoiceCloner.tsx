'use client';

import React, { useState, useRef } from 'react';
import { Mic, ArrowLeft, Upload, Play, Pause, Download, Loader2, Trash2 } from 'lucide-react';

interface VoiceClonerProps {
  onBack: () => void;
}

interface ClonedVoice {
  id: string;
  name: string;
  createdAt: string;
}

export default function VoiceCloner({ onBack }: VoiceClonerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [textToSpeak, setTextToSpeak] = useState('');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
    }
  };

  const handleCloneVoice = async () => {
    if (!audioFile || !voiceName.trim()) return;
    setIsCloning(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioFile);
      });

      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'voice_cloner',
          action: 'clone',
          params: {
            audio_base64: base64.split(',')[1],
            voice_name: voiceName
          }
        })
      });

      const data = await response.json();
      if (data.result?.voice_id) {
        setClonedVoices(prev => [...prev, {
          id: data.result.voice_id,
          name: voiceName,
          createdAt: new Date().toISOString()
        }]);
        setSelectedVoice(data.result.voice_id);
        setAudioFile(null);
        setVoiceName('');
      }
    } catch (err) {
      console.error('[VoiceCloner] Error:', err);
    } finally {
      setIsCloning(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedVoice || !textToSpeak.trim()) return;
    setIsGenerating(true);
    setGeneratedAudioUrl(null);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'voice_cloner',
          action: 'generate',
          params: {
            voice_id: selectedVoice,
            text: textToSpeak
          }
        })
      });

      const data = await response.json();
      if (data.result?.audio_url) {
        setGeneratedAudioUrl(data.result.audio_url);
      }
    } catch (err) {
      console.error('[VoiceCloner] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDeleteVoice = async (voiceId: string) => {
    try {
      await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'voice_cloner',
          action: 'delete',
          params: { voice_id: voiceId }
        })
      });
      setClonedVoices(prev => prev.filter(v => v.id !== voiceId));
      if (selectedVoice === voiceId) setSelectedVoice(null);
    } catch (err) {
      console.error('[VoiceCloner] Delete error:', err);
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
          <Mic className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Voice Cloner</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Clone Voice Section */}
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-medium">Clone a Voice</h2>
          <p className="text-sm text-secondary">Upload 30+ seconds of clear audio to clone a voice.</p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-secondary" />
                <span className="text-sm text-secondary">
                  {audioFile ? audioFile.name : 'Upload audio file'}
                </span>
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="Voice name (e.g., 'My Voice')"
                className="w-full px-4 py-3 bg-panel-dark border border-border rounded-lg focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleCloneVoice}
                disabled={!audioFile || !voiceName.trim() || isCloning}
                className="w-full px-4 py-3 bg-primary/20 hover:bg-primary/30 disabled:bg-panel-light disabled:opacity-50 rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                {isCloning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Cloning...
                  </>
                ) : (
                  'Clone Voice'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* My Voices Section */}
        {clonedVoices.length > 0 && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <h2 className="text-lg font-medium">My Voices</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {clonedVoices.map(voice => (
                <div
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVoice === voice.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{voice.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteVoice(voice.id); }}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Speech Section */}
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-medium">Generate Speech</h2>
          
          {!selectedVoice && clonedVoices.length === 0 && (
            <p className="text-sm text-secondary">Clone a voice first to generate speech.</p>
          )}

          {(selectedVoice || clonedVoices.length > 0) && (
            <>
              <textarea
                value={textToSpeak}
                onChange={(e) => setTextToSpeak(e.target.value)}
                placeholder="Enter text to convert to speech..."
                className="w-full h-32 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm"
              />

              <button
                onClick={handleGenerate}
                disabled={!selectedVoice || !textToSpeak.trim() || isGenerating}
                className="w-full px-6 py-3 bg-primary/20 hover:bg-primary/30 disabled:bg-panel-light disabled:opacity-50 rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Speech'
                )}
              </button>

              {generatedAudioUrl && (
                <div className="flex items-center gap-4 p-4 bg-panel-dark rounded-lg">
                  <audio
                    ref={audioRef}
                    src={generatedAudioUrl}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <button
                    onClick={togglePlayback}
                    className="p-3 bg-primary/20 hover:bg-primary/30 rounded-full transition-colors"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-0" />
                    </div>
                  </div>
                  <a
                    href={generatedAudioUrl}
                    download="generated_speech.mp3"
                    className="p-2 hover:bg-panel-light rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
