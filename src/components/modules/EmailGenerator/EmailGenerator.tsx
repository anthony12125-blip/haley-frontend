'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';

interface EmailGeneratorProps {
  onBack: () => void;
}

export default function EmailGenerator({ onBack }: EmailGeneratorProps) {
  const [context, setContext] = useState('');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'formal' | 'casual'>('professional');
  const [emailType, setEmailType] = useState<'cold_outreach' | 'follow_up' | 'thank_you' | 'request' | 'apology' | 'introduction'>('cold_outreach');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!context.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'email_generator', action: 'generate', params: { context, tone, email_type: emailType } })
      });
      const data = await response.json();
      if (data.result?.email) { setGeneratedEmail(data.result.email); setSubject(data.result.subject || ''); }
    } catch (err) { console.error('[EmailGenerator] Error:', err); }
    finally { setIsGenerating(false); }
  };

  const handleCopy = () => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${generatedEmail}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const emailTypes = [
    { id: 'cold_outreach', label: 'Cold Outreach' }, { id: 'follow_up', label: 'Follow Up' },
    { id: 'thank_you', label: 'Thank You' }, { id: 'request', label: 'Request' },
    { id: 'apology', label: 'Apology' }, { id: 'introduction', label: 'Introduction' }
  ];

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Mail className="w-5 h-5 text-cyan-400" /><h1 className="text-xl font-semibold">Email Generator</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">What's this email about?</label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g., I want to reach out to a potential client about our web design services. They run a small bakery..." className="w-full h-32 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {emailTypes.map((t) => (
              <button key={t.id} onClick={() => setEmailType(t.id as typeof emailType)} className={`px-3 py-1.5 rounded-lg border text-sm ${emailType === t.id ? 'border-cyan-400 bg-cyan-500/20' : 'border-border hover:border-cyan-400/50'}`}>{t.label}</button>
            ))}
          </div>
          
          <div>
            <label className="block text-xs text-secondary mb-1">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm">
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <button onClick={handleGenerate} disabled={!context.trim() || isGenerating} className="w-full px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Email</>}
          </button>
        </div>

        {generatedEmail && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Generated Email</h2>
              <div className="flex gap-2">
                <button onClick={handleGenerate} disabled={isGenerating} className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center"><RefreshCw className="w-4 h-4 mr-1" />Regenerate</button>
                <button onClick={handleCopy} className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center">
                  {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}{copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            {subject && <div className="p-3 bg-panel-dark rounded-lg"><span className="text-xs text-secondary">Subject: </span><span className="font-medium">{subject}</span></div>}
            <div className="p-4 bg-panel-dark rounded-lg whitespace-pre-wrap text-sm">{generatedEmail}</div>
          </div>
        )}
      </div>
    </div>
  );
}
