'use client';

import React, { useState, useRef } from 'react';
import { Mic2, ArrowLeft, Upload, Loader2, Star, Target, Clock, Volume2 } from 'lucide-react';

interface SpeakingCoachProps { onBack: () => void; }

interface Feedback {
  overallScore: number;
  clarity: number;
  pace: number;
  engagement: number;
  strengths: string[];
  improvements: string[];
  fillerWords: { word: string; count: number }[];
  tips: string[];
}

export default function SpeakingCoach({ onBack }: SpeakingCoachProps) {
  const [transcript, setTranscript] = useState('');
  const [context, setContext] = useState('presentation');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'speaking_coach', action: 'analyze', params: { transcript, context } })
      });
      const data = await response.json();
      if (data.result?.feedback) setFeedback(data.result.feedback);
    } catch (err) { console.error('[SpeakingCoach] Error:', err); }
    finally { setIsAnalyzing(false); }
  };

  const ScoreBar = ({ label, score, icon: Icon }: { label: string; score: number; icon: any }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-1"><Icon className="w-4 h-4" />{label}</span><span>{score}/10</span></div>
      <div className="h-2 bg-panel-dark rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-500 to-green-500" style={{ width: `${score * 10}%` }} /></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Mic2 className="w-5 h-5 text-rose-400" /><h1 className="text-xl font-semibold">Speaking Coach</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {['presentation', 'interview', 'pitch', 'speech', 'meeting'].map((c) => (
              <button key={c} onClick={() => setContext(c)} className={`px-3 py-1.5 rounded-lg border text-sm capitalize ${context === c ? 'border-rose-400 bg-rose-500/20' : 'border-border'}`}>{c}</button>
            ))}
          </div>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste your speech transcript or what you plan to say..." className="w-full h-48 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm" />
          <button onClick={handleAnalyze} disabled={!transcript.trim() || isAnalyzing} className="w-full px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : <><Target className="w-5 h-5 mr-2" />Get Feedback</>}
          </button>
        </div>

        {feedback && (
          <div className="space-y-4">
            <div className="glass rounded-xl border border-border p-4 text-center">
              <div className="text-4xl font-bold text-rose-400">{feedback.overallScore}/10</div>
              <div className="text-sm text-secondary">Overall Score</div>
            </div>

            <div className="glass rounded-xl border border-border p-4 space-y-3">
              <ScoreBar label="Clarity" score={feedback.clarity} icon={Volume2} />
              <ScoreBar label="Pace" score={feedback.pace} icon={Clock} />
              <ScoreBar label="Engagement" score={feedback.engagement} icon={Star} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass rounded-xl border border-green-500/30 p-4 space-y-2">
                <h3 className="font-medium text-green-400">Strengths</h3>
                {feedback.strengths.map((s, i) => <p key={i} className="text-sm text-secondary">✓ {s}</p>)}
              </div>
              <div className="glass rounded-xl border border-orange-500/30 p-4 space-y-2">
                <h3 className="font-medium text-orange-400">Areas to Improve</h3>
                {feedback.improvements.map((s, i) => <p key={i} className="text-sm text-secondary">→ {s}</p>)}
              </div>
            </div>

            {feedback.fillerWords.length > 0 && (
              <div className="glass rounded-xl border border-border p-4">
                <h3 className="font-medium mb-2">Filler Words Detected</h3>
                <div className="flex flex-wrap gap-2">
                  {feedback.fillerWords.map((f, i) => <span key={i} className="px-2 py-1 bg-panel-dark rounded text-sm">"{f.word}" × {f.count}</span>)}
                </div>
              </div>
            )}

            <div className="glass rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-medium">Pro Tips</h3>
              {feedback.tips.map((t, i) => <p key={i} className="text-sm text-secondary">💡 {t}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
