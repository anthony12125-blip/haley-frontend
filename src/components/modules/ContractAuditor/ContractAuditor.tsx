'use client';

import React, { useState, useRef } from 'react';
import { Scale, ArrowLeft, Upload, Loader2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

interface ContractAuditorProps { onBack: () => void; }

interface ContractAnalysis {
  summary: string;
  keyTerms: { term: string; explanation: string }[];
  risks: { risk: string; severity: 'low' | 'medium' | 'high'; recommendation: string }[];
  missingClauses: string[];
  favorability: 'favorable' | 'neutral' | 'unfavorable';
}

export default function ContractAuditor({ onBack }: ContractAuditorProps) {
  const [contractText, setContractText] = useState('');
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!contractText.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'contract_auditor', action: 'analyze', params: { contract: contractText } })
      });
      const data = await response.json();
      if (data.result?.analysis) setAnalysis(data.result.analysis);
    } catch (err) { console.error('[ContractAuditor] Error:', err); }
    finally { setIsProcessing(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const text = await file.text(); setContractText(text); }
  };

  const getSeverityColor = (s: string) => s === 'high' ? 'text-red-400 bg-red-500/20' : s === 'medium' ? 'text-orange-400 bg-orange-500/20' : 'text-yellow-400 bg-yellow-500/20';

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Scale className="w-5 h-5 text-blue-400" /><h1 className="text-xl font-semibold">Contract Auditor</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm text-secondary">Paste contract or upload file</label>
            <label className="cursor-pointer px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm flex items-center">
              <Upload className="w-4 h-4 mr-2" />Upload
              <input type="file" ref={fileInputRef} accept=".txt,.doc,.docx,.pdf" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea value={contractText} onChange={(e) => setContractText(e.target.value)} placeholder="Paste your contract text here..." className="w-full h-64 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm" />
          <button onClick={handleAnalyze} disabled={!contractText.trim() || isProcessing} className="w-full px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : <><FileText className="w-5 h-5 mr-2" />Analyze Contract</>}
          </button>
          <p className="text-xs text-secondary text-center">⚠️ This is AI analysis, not legal advice. Consult a lawyer for important contracts.</p>
        </div>

        {analysis && (
          <div className="space-y-4">
            <div className="glass rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Summary</h3>
                <span className={`px-2 py-1 rounded text-xs ${analysis.favorability === 'favorable' ? 'bg-green-500/20 text-green-400' : analysis.favorability === 'unfavorable' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20'}`}>{analysis.favorability}</span>
              </div>
              <p className="text-sm text-secondary">{analysis.summary}</p>
            </div>

            {analysis.risks.length > 0 && (
              <div className="glass rounded-xl border border-red-500/30 p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Risks Identified ({analysis.risks.length})</h3>
                {analysis.risks.map((r, i) => (
                  <div key={i} className="p-3 bg-panel-dark rounded-lg">
                    <div className="flex items-center gap-2 mb-1"><span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(r.severity)}`}>{r.severity}</span><span className="font-medium">{r.risk}</span></div>
                    <p className="text-sm text-secondary">{r.recommendation}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="glass rounded-xl border border-border p-4 space-y-3">
              <h3 className="font-medium">Key Terms</h3>
              {analysis.keyTerms.map((t, i) => (
                <div key={i} className="p-3 bg-panel-dark rounded-lg"><span className="font-medium">{t.term}:</span> <span className="text-secondary">{t.explanation}</span></div>
              ))}
            </div>

            {analysis.missingClauses.length > 0 && (
              <div className="glass rounded-xl border border-orange-500/30 p-4 space-y-2">
                <h3 className="font-medium text-orange-400">Potentially Missing Clauses</h3>
                {analysis.missingClauses.map((c, i) => <p key={i} className="text-sm text-secondary">• {c}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
