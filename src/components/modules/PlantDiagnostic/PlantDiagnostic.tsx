'use client';

import React, { useState, useRef } from 'react';
import { Leaf, ArrowLeft, Upload, Camera, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface PlantDiagnosticProps {
  onBack: () => void;
}

interface Diagnosis {
  plantName: string;
  healthStatus: 'healthy' | 'mild' | 'moderate' | 'severe';
  issues: string[];
  recommendations: string[];
  careInstructions: string;
}

export default function PlantDiagnostic({ onBack }: PlantDiagnosticProps) {
  const [image, setImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setDiagnosis(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDiagnose = async () => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'plant_diagnostic',
          action: 'diagnose',
          params: { image_base64: image.split(',')[1] }
        })
      });
      const data = await response.json();
      if (data.result?.diagnosis) setDiagnosis(data.result.diagnosis);
    } catch (err) {
      console.error('[PlantDiagnostic] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'mild': return 'text-yellow-400';
      case 'moderate': return 'text-orange-400';
      case 'severe': return 'text-red-400';
      default: return 'text-secondary';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-400" />
          <h1 className="text-xl font-semibold">Plant Diagnostic</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
          {!image ? (
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-12 border-2 border-dashed border-border rounded-xl hover:border-green-500 flex flex-col items-center gap-4">
              <div className="flex gap-4"><Camera className="w-10 h-10 text-green-400" /><Upload className="w-10 h-10 text-secondary" /></div>
              <div className="text-center"><p className="font-medium">Take a photo or upload</p><p className="text-sm text-secondary mt-1">Get instant plant health diagnosis</p></div>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img src={image} alt="Plant" className="w-full max-h-64 object-contain rounded-lg" />
                <button onClick={() => { setImage(null); setDiagnosis(null); }} className="absolute top-2 right-2 px-2 py-1 bg-black/50 hover:bg-black/70 rounded text-xs">Remove</button>
              </div>
              <button onClick={handleDiagnose} disabled={isProcessing} className="w-full px-6 py-3 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
                {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : <><Leaf className="w-5 h-5 mr-2" />Diagnose Plant</>}
              </button>
            </div>
          )}
        </div>

        {diagnosis && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{diagnosis.plantName}</h2>
              <span className={`flex items-center gap-1 ${getStatusColor(diagnosis.healthStatus)}`}>
                {diagnosis.healthStatus === 'healthy' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {diagnosis.healthStatus.charAt(0).toUpperCase() + diagnosis.healthStatus.slice(1)}
              </span>
            </div>

            {diagnosis.issues.length > 0 && (
              <div>
                <h3 className="text-sm text-secondary mb-2">Issues Detected</h3>
                <ul className="space-y-1">
                  {diagnosis.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-sm text-secondary mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {diagnosis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />{rec}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-panel-dark rounded-lg">
              <h3 className="text-sm text-secondary mb-2">Care Instructions</h3>
              <p className="text-sm">{diagnosis.careInstructions}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
