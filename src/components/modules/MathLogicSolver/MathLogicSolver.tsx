'use client';

import React, { useState } from 'react';
import { Calculator, ArrowLeft, Loader2, Copy, Check, Sparkles } from 'lucide-react';

interface MathLogicSolverProps { onBack: () => void; }

export default function MathLogicSolver({ onBack }: MathLogicSolverProps) {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [problemType, setProblemType] = useState('math');

  const handleSolve = async () => {
    if (!problem.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'math_logic_solver', action: 'solve', params: { problem, problem_type: problemType } })
      });
      const data = await response.json();
      if (data.result?.solution) setSolution(data.result.solution);
    } catch (err) { console.error('[MathLogicSolver] Error:', err); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Calculator className="w-5 h-5 text-indigo-400" /><h1 className="text-xl font-semibold">Math & Logic Solver</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {['math', 'algebra', 'calculus', 'statistics', 'logic', 'proofs'].map((t) => (
              <button key={t} onClick={() => setProblemType(t)} className={`px-3 py-1.5 rounded-lg border text-sm capitalize ${problemType === t ? 'border-indigo-400 bg-indigo-500/20' : 'border-border'}`}>{t}</button>
            ))}
          </div>
          <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Enter your math problem or logic puzzle..." className="w-full h-32 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm font-mono" />
          <button onClick={handleSolve} disabled={!problem.trim() || isProcessing} className="w-full px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Solving...</> : <><Sparkles className="w-5 h-5 mr-2" />Solve</>}
          </button>
        </div>

        {solution && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Solution</h2>
              <button onClick={() => { navigator.clipboard.writeText(solution); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm flex items-center">
                {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}Copy
              </button>
            </div>
            <pre className="p-4 bg-panel-dark rounded-lg overflow-auto max-h-[500px] text-sm whitespace-pre-wrap font-mono">{solution}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
