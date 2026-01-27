'use client';

import React, { useState, useRef } from 'react';
import { UserSquare2, ArrowLeft, Loader2, Download, Trash2, Upload, Sparkles } from 'lucide-react';

interface IdentityArchitectProps {
  onBack: () => void;
}

interface IdentityAsset {
  id: string;
  type: 'avatar' | 'headshot' | 'logo' | 'banner';
  url: string;
  style: string;
}

export default function IdentityArchitect({ onBack }: IdentityArchitectProps) {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('professional');
  const [assets, setAssets] = useState<IdentityAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<'avatar' | 'headshot' | 'logo' | 'banner'>('avatar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles = ['professional', 'creative', 'minimalist', 'bold', 'elegant', 'playful', 'tech', 'artistic'];

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setReferenceImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!name.trim()) return;
    setIsGenerating(true);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'identity_architect',
          action: 'generate',
          params: { name, description, style, type: generationType, reference_image: referenceImage?.split(',')[1] }
        })
      });

      const data = await response.json();
      if (data.result?.asset) {
        setAssets(prev => [{ id: Date.now().toString(), type: generationType, url: data.result.asset.url, style }, ...prev]);
      }
    } catch (err) {
      console.error('[IdentityArchitect] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><UserSquare2 className="w-5 h-5 text-cyan-400" /><h1 className="text-xl font-semibold">Identity Architect</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-2">Brand/Person Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Smith, Acme Corp" className="w-full px-4 py-3 bg-panel-dark border border-border rounded-lg focus:outline-none focus:border-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-2">Reference Photo (optional)</label>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleReferenceUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-3 bg-panel-dark border border-border rounded-lg text-sm flex items-center justify-center gap-2 hover:border-cyan-400">
                {referenceImage ? <><img src={referenceImage} alt="Ref" className="w-8 h-8 rounded object-cover" /><span>Photo uploaded</span></> : <><Upload className="w-4 h-4" /><span>Upload reference</span></>}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-secondary mb-2">Description / Keywords</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Tech startup, friendly, innovative, blue color scheme" className="w-full px-4 py-3 bg-panel-dark border border-border rounded-lg focus:outline-none focus:border-primary text-sm" />
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Asset Type</label>
              <div className="flex gap-2">
                {(['avatar', 'headshot', 'logo', 'banner'] as const).map((t) => (
                  <button key={t} onClick={() => setGenerationType(t)} className={`px-3 py-1.5 rounded-lg border text-sm capitalize ${generationType === t ? 'border-cyan-400 bg-cyan-500/20' : 'border-border'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm">
                {styles.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!name.trim() || isGenerating} className="w-full px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate {generationType}</>}
          </button>
        </div>

        {assets.length > 0 && (
          <div className="glass rounded-xl border border-border p-4 space-y-4">
            <h2 className="text-lg font-medium">Generated Assets ({assets.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="relative group">
                  <img src={asset.url} alt={asset.type} className={`w-full rounded-lg object-cover ${asset.type === 'banner' ? 'aspect-[3/1]' : 'aspect-square'}`} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <a href={asset.url} download={`${name}_${asset.type}.png`} className="p-2 bg-white/20 rounded-lg hover:bg-white/30"><Download className="w-4 h-4" /></a>
                    <button onClick={() => setAssets(prev => prev.filter(a => a.id !== asset.id))} className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500/70"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-xs capitalize">{asset.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
