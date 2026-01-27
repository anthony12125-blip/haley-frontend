'use client';

import React, { useState } from 'react';
import { FileText, ArrowLeft, Copy, Check, Loader2, Upload, Sparkles } from 'lucide-react';

interface SummarizerProps {
  onBack: () => void;
}

export default function Summarizer({ onBack }: SummarizerProps) {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summaryLength, setSummaryLength] = useState<'brief' | 'moderate' | 'detailed'>('moderate');
  const [summaryStyle, setSummaryStyle] = useState<'bullets' | 'paragraph' | 'tldr'>('paragraph');

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setSummary('');

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'summarizer',
          action: 'summarize',
          params: {
            text: inputText,
            length: summaryLength,
            style: summaryStyle
          }
        })
      });

      const data = await response.json();
      if (data.result?.summary) {
        setSummary(data.result.summary);
      }
    } catch (err) {
      console.error('[Summarizer] Error:', err);
      setSummary('Error generating summary. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setInputText(text);
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Summarizer</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Input Section */}
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm text-secondary">Paste text or upload a file:</label>
            <label className="cursor-pointer px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center transition-colors">
              <Upload className="w-4 h-4 mr-2" />
              Upload
              <input type="file" accept=".txt,.md,.doc,.docx" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your article, document, or any long text here..."
            className="w-full h-48 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary transition-colors text-sm"
          />

          {/* Options */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Length</label>
              <select
                value={summaryLength}
                onChange={(e) => setSummaryLength(e.target.value as typeof summaryLength)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="brief">Brief (1-2 sentences)</option>
                <option value="moderate">Moderate (paragraph)</option>
                <option value="detailed">Detailed (multiple paragraphs)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Style</label>
              <select
                value={summaryStyle}
                onChange={(e) => setSummaryStyle(e.target.value as typeof summaryStyle)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="paragraph">Paragraph</option>
                <option value="bullets">Bullet Points</option>
                <option value="tldr">TL;DR</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={!inputText.trim() || isProcessing}
            className="w-full md:w-auto px-6 py-3 bg-primary/20 hover:bg-primary/30 disabled:bg-panel-light disabled:opacity-50 rounded-lg font-medium flex items-center justify-center text-primary transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Summarize
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        {summary && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Summary</h2>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center transition-colors"
              >
                {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-4 bg-panel-dark rounded-lg whitespace-pre-wrap text-sm">
              {summary}
            </div>
            <div className="text-xs text-secondary">
              Original: {inputText.split(/\s+/).length} words → Summary: {summary.split(/\s+/).length} words
              ({Math.round((1 - summary.split(/\s+/).length / inputText.split(/\s+/).length) * 100)}% reduction)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
