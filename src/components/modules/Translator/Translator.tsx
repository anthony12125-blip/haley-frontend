'use client';

import React, { useState } from 'react';
import { Globe, ArrowLeft, Copy, Check, Loader2, ArrowRightLeft } from 'lucide-react';

interface TranslatorProps {
  onBack: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
];

export default function Translator({ onBack }: TranslatorProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setOutputText('');

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'translator',
          action: 'translate',
          params: {
            text: inputText,
            source_lang: sourceLang,
            target_lang: targetLang
          }
        })
      });

      const data = await response.json();
      if (data.result?.translated_text) {
        setOutputText(data.result.translated_text);
        if (data.result.detected_language) {
          setDetectedLang(data.result.detected_language);
        }
      }
    } catch (err) {
      console.error('[Translator] Error:', err);
      setOutputText('Translation error. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Translator</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {/* Language Selection */}
        <div className="flex items-center gap-2 justify-center">
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="px-4 py-2 bg-panel-dark border border-border rounded-lg text-sm focus:outline-none focus:border-primary min-w-[140px]"
          >
            <option value="auto">Auto Detect</option>
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>

          <button
            onClick={handleSwapLanguages}
            disabled={sourceLang === 'auto'}
            className="p-2 hover:bg-panel-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>

          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="px-4 py-2 bg-panel-dark border border-border rounded-lg text-sm focus:outline-none focus:border-primary min-w-[140px]"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        {/* Input/Output Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Input */}
          <div className="glass rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">
                {sourceLang === 'auto' ? 'Source Text' : LANGUAGES.find(l => l.code === sourceLang)?.name}
                {detectedLang && sourceLang === 'auto' && (
                  <span className="ml-2 text-primary">
                    (Detected: {LANGUAGES.find(l => l.code === detectedLang)?.name || detectedLang})
                  </span>
                )}
              </span>
              <span className="text-xs text-secondary">{inputText.length} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full h-48 p-3 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm"
            />
          </div>

          {/* Output */}
          <div className="glass rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">
                {LANGUAGES.find(l => l.code === targetLang)?.name}
              </span>
              {outputText && (
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 hover:bg-panel-dark rounded text-sm flex items-center transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <div className="w-full h-48 p-3 bg-panel-dark border border-border rounded-lg overflow-auto text-sm">
              {isTranslating ? (
                <div className="flex items-center justify-center h-full text-secondary">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Translating...
                </div>
              ) : outputText ? (
                outputText
              ) : (
                <span className="text-secondary">Translation will appear here...</span>
              )}
            </div>
          </div>
        </div>

        {/* Translate Button */}
        <button
          onClick={handleTranslate}
          disabled={!inputText.trim() || isTranslating}
          className="w-full px-6 py-3 bg-primary/20 hover:bg-primary/30 disabled:bg-panel-light disabled:opacity-50 rounded-lg font-medium flex items-center justify-center text-primary transition-colors"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Globe className="w-5 h-5 mr-2" />
              Translate
            </>
          )}
        </button>
      </div>
    </div>
  );
}
