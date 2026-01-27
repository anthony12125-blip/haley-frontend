'use client';

import React, { useState } from 'react';
import { BookOpen, ArrowLeft, Loader2, Download, Copy, Check, Sparkles } from 'lucide-react';

interface StudyGuideProps {
  onBack: () => void;
}

export default function StudyGuide({ onBack }: StudyGuideProps) {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('high_school');
  const [guideType, setGuideType] = useState<'summary' | 'flashcards' | 'quiz' | 'outline'>('summary');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setResult('');
    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'study_guide',
          action: 'generate',
          params: { topic, grade_level: gradeLevel, guide_type: guideType }
        })
      });
      const data = await response.json();
      if (data.result?.content) setResult(data.result.content);
    } catch (err) {
      console.error('[StudyGuide] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-panel-dark rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-400" /><h1 className="text-xl font-semibold">Study Guide</h1></div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">What do you want to study?</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., World War II, Photosynthesis, Quadratic Equations, Shakespeare's Hamlet..." className="w-full h-24 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm" />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Grade Level</label>
              <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm">
                <option value="elementary">Elementary</option>
                <option value="middle_school">Middle School</option>
                <option value="high_school">High School</option>
                <option value="college">College</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Guide Type</label>
              <select value={guideType} onChange={(e) => setGuideType(e.target.value as typeof guideType)} className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm">
                <option value="summary">Summary Notes</option>
                <option value="flashcards">Flashcards</option>
                <option value="quiz">Practice Quiz</option>
                <option value="outline">Study Outline</option>
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!topic.trim() || isGenerating} className="w-full px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center">
            {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Study Guide</>}
          </button>
        </div>

        {result && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Your Study Guide</h2>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center">
                  {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}{copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <pre className="p-4 bg-panel-dark rounded-lg overflow-auto max-h-[500px] text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
