'use client';

import React, { useState } from 'react';
import { Flame, ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';

interface CodeSmokeTesterProps { onBack: () => void; }

interface TestResult {
  passed: boolean;
  testName: string;
  message: string;
  duration: number;
}

interface SmokeTestResults {
  language: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  suggestions: string[];
}

export default function CodeSmokeTester({ onBack }: CodeSmokeTesterProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [results, setResults] = useState<SmokeTestResults | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    if (!code.trim()) return;
    setIsTesting(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'code_smoke_tester', action: 'test', params: { code, language } })
      });
      const data = await response.json();
      if (data.result?.results) setResults(data.result.results);
    } catch (err) { console.error('[CodeSmokeTester] Error:', err); }
    finally { setIsTesting(false); }
  };

  const languages = ['python', 'javascript', 'typescript', 'java', 'go', 'rust'];

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" /><h1 className="text-xl font-semibold">Code Smoke Tester</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <button key={l} onClick={() => setLanguage(l)} className={`px-3 py-1.5 rounded-lg border text-sm capitalize ${language === l ? 'border-orange-400 bg-orange-500/20' : 'border-border'}`}>{l}</button>
            ))}
          </div>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your code here..." className="w-full h-64 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm font-mono" />
          <button onClick={handleTest} disabled={!code.trim() || isTesting} className="w-full px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isTesting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Running Tests...</> : <><Play className="w-5 h-5 mr-2" />Run Smoke Tests</>}
          </button>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="glass rounded-xl border border-border p-4 text-center">
                <div className="text-2xl font-bold">{results.totalTests}</div>
                <div className="text-xs text-secondary">Total Tests</div>
              </div>
              <div className="glass rounded-xl border border-green-500/30 p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{results.passed}</div>
                <div className="text-xs text-secondary">Passed</div>
              </div>
              <div className="glass rounded-xl border border-red-500/30 p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{results.failed}</div>
                <div className="text-xs text-secondary">Failed</div>
              </div>
            </div>

            <div className="glass rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-medium">Test Results</h3>
              {results.results.map((r, i) => (
                <div key={i} className={`p-3 rounded-lg flex items-start gap-3 ${r.passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {r.passed ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                  <div><div className="font-medium text-sm">{r.testName}</div><div className="text-xs text-secondary">{r.message}</div></div>
                  <div className="ml-auto text-xs text-secondary">{r.duration}ms</div>
                </div>
              ))}
            </div>

            {results.suggestions.length > 0 && (
              <div className="glass rounded-xl border border-yellow-500/30 p-4 space-y-2">
                <h3 className="font-medium flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-400" />Suggestions</h3>
                {results.suggestions.map((s, i) => <p key={i} className="text-sm text-secondary">• {s}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
