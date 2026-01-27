'use client';

import React, { useState, useRef } from 'react';
import { FileText, ArrowLeft, Upload, Download, Loader2, Copy, Check, Camera } from 'lucide-react';

interface DocScannerProps {
  onBack: () => void;
}

export default function DocScanner({ onBack }: DocScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'text' | 'markdown' | 'json'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setExtractedText('');
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'doc_scanner',
          action: 'scan',
          params: { image_base64: image.split(',')[1], output_format: outputFormat }
        })
      });
      const data = await response.json();
      if (data.result?.text) setExtractedText(data.result.text);
    } catch (err) {
      console.error('[DocScanner] Error:', err);
      setExtractedText('Error scanning document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = outputFormat === 'json' ? 'json' : outputFormat === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanned_document.${ext}`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Doc Scanner</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <input type="file" ref={fileInputRef} accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
          {!image ? (
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-12 border-2 border-dashed border-border rounded-xl hover:border-primary flex flex-col items-center gap-4">
              <div className="flex gap-4"><Upload className="w-10 h-10 text-secondary" /><Camera className="w-10 h-10 text-secondary" /></div>
              <div className="text-center"><p className="font-medium">Upload or capture document</p><p className="text-sm text-secondary mt-1">Supports images and PDFs</p></div>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img src={image} alt="Document" className="w-full max-h-64 object-contain rounded-lg" />
                <button onClick={() => { setImage(null); setExtractedText(''); }} className="absolute top-2 right-2 px-2 py-1 bg-black/50 hover:bg-black/70 rounded text-xs">Remove</button>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs text-secondary mb-1">Output Format</label>
                  <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as typeof outputFormat)} className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm">
                    <option value="text">Plain Text</option>
                    <option value="markdown">Markdown</option>
                    <option value="json">Structured JSON</option>
                  </select>
                </div>
                <button onClick={handleScan} disabled={isProcessing} className="flex-1 px-6 py-2 bg-primary/20 hover:bg-primary/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
                  {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Scanning...</> : 'Scan Document'}
                </button>
              </div>
            </div>
          )}
        </div>

        {extractedText && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Extracted Text</h2>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center">
                  {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}{copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleDownload} className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center">
                  <Download className="w-4 h-4 mr-1" />Download
                </button>
              </div>
            </div>
            <pre className="p-4 bg-panel-dark rounded-lg overflow-auto max-h-96 text-sm whitespace-pre-wrap">{extractedText}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
