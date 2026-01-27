'use client';

import React, { useState } from 'react';
import { Globe, ArrowLeft, Loader2, Download, Copy, Check, Play } from 'lucide-react';

interface NoCodeWebScraperProps { onBack: () => void; }

export default function NoCodeWebScraper({ onBack }: NoCodeWebScraperProps) {
  const [url, setUrl] = useState('');
  const [selector, setSelector] = useState('');
  const [extractType, setExtractType] = useState<'text' | 'links' | 'images' | 'tables' | 'all'>('all');
  const [results, setResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'no_code_web_scraper', action: 'scrape', params: { url, selector, extract_type: extractType } })
      });
      const data = await response.json();
      if (data.result) setResults(data.result);
    } catch (err) { console.error('[NoCodeWebScraper] Error:', err); }
    finally { setIsProcessing(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-teal-400" /><h1 className="text-xl font-semibold">No-Code Web Scraper</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">URL to Scrape</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" className="w-full px-4 py-3 bg-panel-dark border border-border rounded-lg focus:outline-none focus:border-primary text-sm" />
          </div>
          
          <div>
            <label className="block text-sm text-secondary mb-2">CSS Selector (optional)</label>
            <input value={selector} onChange={(e) => setSelector(e.target.value)} placeholder="e.g., .article-content, #main, table.data" className="w-full px-4 py-3 bg-panel-dark border border-border rounded-lg focus:outline-none focus:border-primary text-sm font-mono" />
          </div>

          <div>
            <label className="block text-xs text-secondary mb-1">Extract</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'text', 'links', 'images', 'tables'] as const).map((t) => (
                <button key={t} onClick={() => setExtractType(t)} className={`px-3 py-1.5 rounded-lg border text-sm capitalize ${extractType === t ? 'border-teal-400 bg-teal-500/20' : 'border-border'}`}>{t}</button>
              ))}
            </div>
          </div>

          <button onClick={handleScrape} disabled={!url.trim() || isProcessing} className="w-full px-6 py-3 bg-teal-500/20 hover:bg-teal-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Scraping...</> : <><Play className="w-5 h-5 mr-2" />Scrape</>}
          </button>
        </div>

        {results && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Results</h2>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm flex items-center">
                  {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}Copy JSON
                </button>
                <button onClick={() => {
                  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'scraped_data.json'; a.click();
                }} className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm flex items-center">
                  <Download className="w-4 h-4 mr-1" />Download
                </button>
              </div>
            </div>
            <pre className="p-4 bg-panel-dark rounded-lg overflow-auto max-h-96 text-xs font-mono">{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
