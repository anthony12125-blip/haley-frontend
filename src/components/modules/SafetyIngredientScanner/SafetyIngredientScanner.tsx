'use client';

import React, { useState, useRef } from 'react';
import { FlaskConical, ArrowLeft, Upload, Camera, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SafetyIngredientScannerProps {
  onBack: () => void;
}

interface Ingredient {
  name: string;
  rating: 'safe' | 'caution' | 'avoid';
  description: string;
  concerns?: string[];
}

interface ScanResult {
  productName: string;
  overallRating: 'safe' | 'caution' | 'avoid';
  ingredients: Ingredient[];
  summary: string;
}

export default function SafetyIngredientScanner({ onBack }: SafetyIngredientScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { setImage(event.target?.result as string); setResult(null); };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'safety_ingredient_scanner', action: 'scan', params: { image_base64: image.split(',')[1] } })
      });
      const data = await response.json();
      if (data.result?.analysis) setResult(data.result.analysis);
    } catch (err) {
      console.error('[SafetyIngredientScanner] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'safe': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'caution': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'avoid': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return null;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) { case 'safe': return 'text-green-400 bg-green-500/20'; case 'caution': return 'text-yellow-400 bg-yellow-500/20'; case 'avoid': return 'text-red-400 bg-red-500/20'; default: return ''; }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><FlaskConical className="w-5 h-5 text-purple-400" /><h1 className="text-xl font-semibold">Safety Ingredient Scanner</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
          {!image ? (
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-12 border-2 border-dashed border-border rounded-xl hover:border-purple-500 flex flex-col items-center gap-4">
              <div className="flex gap-4"><Camera className="w-10 h-10 text-purple-400" /><Upload className="w-10 h-10 text-secondary" /></div>
              <div className="text-center"><p className="font-medium">Scan ingredient label</p><p className="text-sm text-secondary mt-1">Take a photo of the ingredients list</p></div>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img src={image} alt="Label" className="w-full max-h-48 object-contain rounded-lg" />
                <button onClick={() => { setImage(null); setResult(null); }} className="absolute top-2 right-2 px-2 py-1 bg-black/50 hover:bg-black/70 rounded text-xs">Remove</button>
              </div>
              <button onClick={handleScan} disabled={isProcessing} className="w-full px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
                {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : <><FlaskConical className="w-5 h-5 mr-2" />Analyze Ingredients</>}
              </button>
            </div>
          )}
        </div>

        {result && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{result.productName || 'Analysis Results'}</h2>
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${getRatingColor(result.overallRating)}`}>
                {getRatingIcon(result.overallRating)} {result.overallRating.charAt(0).toUpperCase() + result.overallRating.slice(1)}
              </span>
            </div>
            <p className="text-sm text-secondary">{result.summary}</p>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Ingredients Analysis</h3>
              {result.ingredients.map((ing, i) => (
                <div key={i} className={`p-3 rounded-lg border ${ing.rating === 'safe' ? 'border-green-500/30' : ing.rating === 'caution' ? 'border-yellow-500/30' : 'border-red-500/30'}`}>
                  <div className="flex items-center gap-2">{getRatingIcon(ing.rating)}<span className="font-medium">{ing.name}</span></div>
                  <p className="text-sm text-secondary mt-1">{ing.description}</p>
                  {ing.concerns && ing.concerns.length > 0 && <ul className="mt-2 text-xs text-secondary">{ing.concerns.map((c, j) => <li key={j}>• {c}</li>)}</ul>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
