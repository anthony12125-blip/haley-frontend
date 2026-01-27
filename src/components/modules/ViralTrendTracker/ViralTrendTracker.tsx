'use client';

import React, { useState } from 'react';
import { TrendingUp, ArrowLeft, Loader2, Search, Flame, Clock, Globe } from 'lucide-react';

interface ViralTrendTrackerProps { onBack: () => void; }

interface Trend {
  name: string;
  category: string;
  score: number;
  growth: string;
  platforms: string[];
  description: string;
  peakPrediction: string;
}

export default function ViralTrendTracker({ onBack }: ViralTrendTrackerProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'viral_trend_tracker', action: 'search', params: { query, category } })
      });
      const data = await response.json();
      if (data.result?.trends) setTrends(data.result.trends);
    } catch (err) { console.error('[ViralTrendTracker] Error:', err); }
    finally { setIsSearching(false); }
  };

  const categories = ['all', 'tech', 'entertainment', 'business', 'social', 'memes', 'news'];

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-red-400" /><h1 className="text-xl font-semibold">Viral Trend Tracker</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 space-y-4">
          <div className="flex gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trends or leave empty for top trending..." className="flex-1 px-4 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:border-primary text-sm" />
            <button onClick={handleSearch} disabled={isSearching} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg">
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg border text-sm capitalize ${category === c ? 'border-red-400 bg-red-500/20' : 'border-border'}`}>{c}</button>
            ))}
          </div>
        </div>

        {trends.length > 0 && (
          <div className="space-y-3">
            {trends.map((trend, i) => (
              <div key={i} className="glass rounded-xl border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <h3 className="font-medium">{trend.name}</h3>
                      <span className="px-2 py-0.5 bg-panel-dark rounded text-xs">{trend.category}</span>
                    </div>
                    <p className="text-sm text-secondary mt-1">{trend.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-400">{trend.score}</div>
                    <div className="text-xs text-green-400">{trend.growth}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-secondary">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{trend.platforms.join(', ')}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Peak: {trend.peakPrediction}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
