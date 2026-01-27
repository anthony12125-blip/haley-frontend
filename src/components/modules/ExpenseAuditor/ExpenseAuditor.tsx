'use client';

import React, { useState, useRef } from 'react';
import { Receipt, ArrowLeft, Upload, Loader2, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';

interface ExpenseAuditorProps { onBack: () => void; }

interface ExpenseAnalysis {
  total: number;
  byCategory: { category: string; amount: number; percentage: number }[];
  insights: string[];
  flags: { item: string; reason: string }[];
}

export default function ExpenseAuditor({ onBack }: ExpenseAuditorProps) {
  const [expenses, setExpenses] = useState('');
  const [analysis, setAnalysis] = useState<ExpenseAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!expenses.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'expense_auditor', action: 'analyze', params: { expenses } })
      });
      const data = await response.json();
      if (data.result?.analysis) setAnalysis(data.result.analysis);
    } catch (err) { console.error('[ExpenseAuditor] Error:', err); }
    finally { setIsProcessing(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const text = await file.text(); setExpenses(text); }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Receipt className="w-5 h-5 text-emerald-400" /><h1 className="text-xl font-semibold">Expense Auditor</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-secondary">Paste expenses or upload CSV</label>
            <label className="cursor-pointer px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm flex items-center">
              <Upload className="w-4 h-4 mr-2" />Upload
              <input type="file" ref={fileInputRef} accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea value={expenses} onChange={(e) => setExpenses(e.target.value)} placeholder="Date, Description, Amount&#10;2024-01-15, Coffee, $4.50&#10;2024-01-15, Uber, $23.00&#10;..." className="w-full h-48 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm font-mono" />
          <button onClick={handleAnalyze} disabled={!expenses.trim() || isProcessing} className="w-full px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : <><PieChart className="w-5 h-5 mr-2" />Analyze Expenses</>}
          </button>
        </div>

        {analysis && (
          <div className="space-y-4">
            <div className="glass rounded-xl border border-border p-4">
              <div className="text-3xl font-bold text-emerald-400">${analysis.total.toFixed(2)}</div>
              <div className="text-sm text-secondary">Total Expenses</div>
            </div>

            <div className="glass rounded-xl border border-border p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2"><PieChart className="w-5 h-5" />By Category</h3>
              {analysis.byCategory.map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1"><div className="flex justify-between text-sm mb-1"><span>{cat.category}</span><span>${cat.amount.toFixed(2)}</span></div>
                  <div className="h-2 bg-panel-dark rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${cat.percentage}%` }} /></div></div>
                  <span className="text-xs text-secondary w-12 text-right">{cat.percentage}%</span>
                </div>
              ))}
            </div>

            {analysis.insights.length > 0 && (
              <div className="glass rounded-xl border border-border p-4 space-y-2">
                <h3 className="font-medium flex items-center gap-2"><TrendingUp className="w-5 h-5" />Insights</h3>
                {analysis.insights.map((insight, i) => <p key={i} className="text-sm text-secondary">• {insight}</p>)}
              </div>
            )}

            {analysis.flags.length > 0 && (
              <div className="glass rounded-xl border border-orange-500/30 p-4 space-y-2">
                <h3 className="font-medium flex items-center gap-2 text-orange-400"><AlertTriangle className="w-5 h-5" />Flags</h3>
                {analysis.flags.map((flag, i) => <div key={i} className="text-sm"><span className="font-medium">{flag.item}:</span> <span className="text-secondary">{flag.reason}</span></div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
