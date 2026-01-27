'use client';

import React, { useState, useRef } from 'react';
import { Gem, ArrowLeft, Upload, Camera, Loader2, DollarSign, TrendingUp, Info } from 'lucide-react';

interface CollectibleValuerProps { onBack: () => void; }

interface Valuation {
  itemName: string;
  estimatedValue: { low: number; mid: number; high: number };
  condition: string;
  rarity: string;
  factors: string[];
  marketTrend: 'rising' | 'stable' | 'declining';
  sellingSuggestions: string[];
}

export default function CollectibleValuer({ onBack }: CollectibleValuerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { setImage(event.target?.result as string); setValuation(null); };
    reader.readAsDataURL(file);
  };

  const handleValue = async () => {
    if (!image && !description.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'collectible_valuer', action: 'value', params: { image_base64: image?.split(',')[1], description } })
      });
      const data = await response.json();
      if (data.result?.valuation) setValuation(data.result.valuation);
    } catch (err) { console.error('[CollectibleValuer] Error:', err); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Gem className="w-5 h-5 text-purple-400" /><h1 className="text-xl font-semibold">Collectible Valuer</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
          {!image ? (
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-8 border-2 border-dashed border-border rounded-xl hover:border-purple-500 flex flex-col items-center gap-3">
              <Camera className="w-10 h-10 text-purple-400" />
              <span className="text-sm text-secondary">Upload photo of your collectible</span>
            </button>
          ) : (
            <div className="relative">
              <img src={image} alt="Collectible" className="w-full max-h-48 object-contain rounded-lg" />
              <button onClick={() => setImage(null)} className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs">Remove</button>
            </div>
          )}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your item (optional): brand, year, condition, any markings..." className="w-full h-24 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm" />
          <button onClick={handleValue} disabled={(!image && !description.trim()) || isProcessing} className="w-full px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Appraising...</> : <><DollarSign className="w-5 h-5 mr-2" />Get Valuation</>}
          </button>
        </div>

        {valuation && (
          <div className="space-y-4">
            <div className="glass rounded-xl border border-border p-4">
              <h2 className="text-lg font-medium mb-2">{valuation.itemName}</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><div className="text-sm text-secondary">Low</div><div className="text-xl font-bold text-red-400">${valuation.estimatedValue.low}</div></div>
                <div><div className="text-sm text-secondary">Estimated</div><div className="text-2xl font-bold text-green-400">${valuation.estimatedValue.mid}</div></div>
                <div><div className="text-sm text-secondary">High</div><div className="text-xl font-bold text-blue-400">${valuation.estimatedValue.high}</div></div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="glass rounded-xl border border-border p-4"><div className="text-xs text-secondary">Condition</div><div className="font-medium">{valuation.condition}</div></div>
              <div className="glass rounded-xl border border-border p-4"><div className="text-xs text-secondary">Rarity</div><div className="font-medium">{valuation.rarity}</div></div>
              <div className="glass rounded-xl border border-border p-4"><div className="text-xs text-secondary">Market Trend</div>
                <div className={`font-medium flex items-center gap-1 ${valuation.marketTrend === 'rising' ? 'text-green-400' : valuation.marketTrend === 'declining' ? 'text-red-400' : ''}`}>
                  <TrendingUp className="w-4 h-4" />{valuation.marketTrend}
                </div>
              </div>
            </div>

            <div className="glass rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-medium flex items-center gap-2"><Info className="w-5 h-5" />Value Factors</h3>
              {valuation.factors.map((f, i) => <p key={i} className="text-sm text-secondary">• {f}</p>)}
            </div>

            <div className="glass rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-medium">Selling Suggestions</h3>
              {valuation.sellingSuggestions.map((s, i) => <p key={i} className="text-sm text-secondary">• {s}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
