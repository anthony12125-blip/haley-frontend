'use client';

import React, { useState, useRef } from 'react';
import { Music, ArrowLeft, Loader2, Download, Play, Pause, RefreshCw } from 'lucide-react';

interface MusicProducerProps {
  onBack: () => void;
}

interface GeneratedTrack {
  url: string;
  title: string;
  duration: number;
}

export default function MusicProducer({ onBack }: MusicProducerProps) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('upbeat');
  const [duration, setDuration] = useState(30);
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const genres = ['pop', 'rock', 'electronic', 'hip-hop', 'jazz', 'classical', 'ambient', 'folk', 'r&b', 'country'];
  const moods = ['upbeat', 'chill', 'energetic', 'melancholic', 'epic', 'romantic', 'dark', 'playful'];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'music_producer',
          action: 'generate',
          params: { prompt, genre, mood, duration }
        })
      });

      const data = await response.json();
      if (data.result?.tracks) {
        setTracks(prev => [...data.result.tracks, ...prev]);
      }
    } catch (err) {
      console.error('[MusicProducer] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = (index: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    if (playingIndex === index) {
      audio.pause();
      setPlayingIndex(null);
    } else {
      // Pause any currently playing
      if (playingIndex !== null && audioRefs.current[playingIndex]) {
        audioRefs.current[playingIndex]?.pause();
      }
      audio.play();
      setPlayingIndex(index);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-pink-400" />
          <h1 className="text-xl font-semibold">Music Producer</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Generation Form */}
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Describe your music</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A catchy summer anthem with tropical vibes and a memorable hook..."
              className="w-full h-24 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm"
              >
                {genres.map((g) => (
                  <option key={g} value={g} className="capitalize">{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm"
              >
                {moods.map((m) => (
                  <option key={m} value={m} className="capitalize">{m}</option>
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
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Music className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Tracks */}
        {tracks.length > 0 && (
          <div className="glass rounded-xl border border-border p-4 space-y-4">
            <h2 className="text-lg font-medium">Generated Tracks</h2>

            <div className="space-y-3">
              {tracks.map((track, i) => (
                <div key={i} className="p-4 bg-panel-dark rounded-lg flex items-center gap-4">
                  <audio
                    ref={(el) => { audioRefs.current[i] = el; }}
                    src={track.url}
                    onEnded={() => setPlayingIndex(null)}
                  />

                  <button
                    onClick={() => togglePlay(i)}
                    className="p-3 bg-pink-500/20 hover:bg-pink-500/30 rounded-full flex-shrink-0"
                  >
                    {playingIndex === i ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{track.title}</div>
                    <div className="text-xs text-secondary">{track.duration}s</div>
                  </div>

                  <a
                    href={track.url}
                    download={`${track.title}.mp3`}
                    className="p-2 hover:bg-panel-light rounded-lg"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-secondary text-center">
          🎵 AI-generated music. Check licensing before commercial use.
        </p>
      </div>
    </div>
  );
}
