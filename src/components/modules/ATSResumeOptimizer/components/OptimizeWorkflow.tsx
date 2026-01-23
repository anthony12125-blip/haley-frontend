'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ATSOptimizerContext, ATSWorkflowStep } from '../types';
import { parseResume, parseJobDescription } from '../utils/parsing';
import { analyzeResume } from '../utils/scoring';
import { exportResume, downloadBlob, getSuggestedFilename, generateAnalysisReport } from '../utils/export';
import ScoreCard from './shared/ScoreCard';
import KeywordCloud from './shared/KeywordCloud';
import GapAnalysis from './shared/GapAnalysis';
import RecommendationList from './shared/RecommendationList';

interface OptimizeWorkflowProps {
  context: any;
}

const OPTIMIZE_STEPS: { key: string; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'optimize', label: 'Optimize' },
  { key: 'export', label: 'Export' },
];

export default function OptimizeWorkflow({ context }: OptimizeWorkflowProps) {
  const {
    currentStep,
    setStep,
    parsedResume,
    setParsedResume,
    parsedJD,
    setParsedJD,
    analysis,
    setAnalysis,
    isProcessing,
    setIsProcessing,
    setError,
  } = context;

  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');

  const currentStepIndex = OPTIMIZE_STEPS.findIndex(s => s.key === currentStep);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File, type: 'resume' | 'jd') => {
    try {
      const text = await file.text();
      if (type === 'resume') {
        setResumeText(text);
      } else {
        setJdText(text);
      }
    } catch (e) {
      setError?.(`Failed to read ${type} file`);
    }
  }, [setError]);

  // Analyze resume
  const handleAnalyze = useCallback(async () => {
    if (!resumeText || !jdText) {
      setError?.('Please provide both resume and job description');
      return;
    }

    setIsProcessing?.(true);
    try {
      // Parse documents
      const resume = parseResume(resumeText, 'txt');
      const jd = parseJobDescription(jdText);

      setParsedResume?.(resume);
      setParsedJD?.(jd);

      // Analyze
      const result = analyzeResume(resume, jd);
      setAnalysis?.(result);

      setStep?.('analysis');
    } catch (e) {
      setError?.('Failed to analyze resume. Please check the format.');
    } finally {
      setIsProcessing?.(false);
    }
  }, [resumeText, jdText, setIsProcessing, setParsedResume, setParsedJD, setAnalysis, setStep, setError]);

  // Export handler
  const handleExport = useCallback(async (format: 'docx' | 'pdf' | 'txt') => {
    if (!parsedResume) return;

    setIsProcessing?.(true);
    try {
      const blob = await exportResume(parsedResume, format);
      const filename = getSuggestedFilename(parsedResume, format, parsedJD?.title);
      downloadBlob(blob, filename);
    } catch (e) {
      setError?.(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsProcessing?.(false);
    }
  }, [parsedResume, parsedJD, setIsProcessing, setError]);

  // Export analysis report
  const handleExportReport = useCallback(() => {
    if (!analysis) return;

    const report = generateAnalysisReport(analysis);
    const blob = new Blob([report], { type: 'text/plain' });
    downloadBlob(blob, 'ats_analysis_report.txt');
  }, [analysis]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Step Progress */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {OPTIMIZE_STEPS.map((step, index) => (
            <React.Fragment key={step.key}>
              <button
                onClick={() => index < currentStepIndex && setStep?.(step.key)}
                disabled={index > currentStepIndex}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  index === currentStepIndex
                    ? 'bg-blue-500/20 text-blue-400'
                    : index < currentStepIndex
                    ? 'text-white/70 hover:bg-white/5 cursor-pointer'
                    : 'text-white/30 cursor-not-allowed'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === currentStepIndex
                    ? 'bg-blue-500 text-white'
                    : index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/30'
                }`}>
                  {index < currentStepIndex ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < OPTIMIZE_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <UploadStep
                resumeText={resumeText}
                jdText={jdText}
                onResumeChange={setResumeText}
                onJdChange={setJdText}
                onFileUpload={handleFileUpload}
                onAnalyze={handleAnalyze}
                isProcessing={isProcessing || false}
              />
            </motion.div>
          )}

          {currentStep === 'analysis' && analysis && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto"
            >
              <AnalysisStep
                analysis={analysis}
                onNext={() => setStep?.('optimize')}
                onExportReport={handleExportReport}
              />
            </motion.div>
          )}

          {currentStep === 'optimize' && analysis && (
            <motion.div
              key="optimize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto"
            >
              <OptimizeStep
                analysis={analysis}
                onNext={() => setStep?.('export')}
                onBack={() => setStep?.('analysis')}
              />
            </motion.div>
          )}

          {currentStep === 'export' && parsedResume && (
            <motion.div
              key="export"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <ExportStep
                resume={parsedResume}
                analysis={analysis}
                onExport={handleExport}
                onBack={() => setStep?.('optimize')}
                isProcessing={isProcessing || false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Upload Step Component
function UploadStep({
  resumeText,
  jdText,
  onResumeChange,
  onJdChange,
  onFileUpload,
  onAnalyze,
  isProcessing,
}: {
  resumeText: string;
  jdText: string;
  onResumeChange: (text: string) => void;
  onJdChange: (text: string) => void;
  onFileUpload: (file: File, type: 'resume' | 'jd') => void;
  onAnalyze: () => void;
  isProcessing: boolean;
}) {
  const handleDrop = (e: React.DragEvent, type: 'resume' | 'jd') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileUpload(file, type);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Upload Your Documents
        </h2>
        <p className="text-white/60">
          Paste or upload your resume and the job description you're targeting
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resume Input */}
        <div
          onDrop={(e) => handleDrop(e, 'resume')}
          onDragOver={(e) => e.preventDefault()}
          className="space-y-3"
        >
          <label className="block text-sm font-medium text-white/80">
            Your Resume
          </label>
          <div className="relative">
            <textarea
              value={resumeText}
              onChange={(e) => onResumeChange(e.target.value)}
              placeholder="Paste your resume text here, or drag & drop a .txt file..."
              className="w-full h-64 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <input
              type="file"
              accept=".txt,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file, 'resume');
              }}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/70 cursor-pointer transition-colors"
            >
              Upload File
            </label>
          </div>
          {resumeText && (
            <p className="text-sm text-green-400">
              {resumeText.split(/\s+/).length} words loaded
            </p>
          )}
        </div>

        {/* JD Input */}
        <div
          onDrop={(e) => handleDrop(e, 'jd')}
          onDragOver={(e) => e.preventDefault()}
          className="space-y-3"
        >
          <label className="block text-sm font-medium text-white/80">
            Job Description
          </label>
          <div className="relative">
            <textarea
              value={jdText}
              onChange={(e) => onJdChange(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-64 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <input
              type="file"
              accept=".txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file, 'jd');
              }}
              className="hidden"
              id="jd-upload"
            />
            <label
              htmlFor="jd-upload"
              className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/70 cursor-pointer transition-colors"
            >
              Upload File
            </label>
          </div>
          {jdText && (
            <p className="text-sm text-green-400">
              {jdText.split(/\s+/).length} words loaded
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onAnalyze}
          disabled={!resumeText || !jdText || isProcessing}
          className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Analyze Resume</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Analysis Step Component
function AnalysisStep({
  analysis,
  onNext,
  onExportReport,
}: {
  analysis: NonNullable<ATSOptimizerContext['analysis']>;
  onNext: () => void;
  onExportReport: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            ATS Analysis Results
          </h2>
          <p className="text-white/60">
            Here's how your resume matches the job requirements
          </p>
        </div>
        <button
          onClick={onExportReport}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-sm transition-colors"
        >
          Export Report
        </button>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ScoreCard
          label="Overall"
          score={analysis.overallScore}
          color="blue"
          size="large"
        />
        <ScoreCard
          label="Keywords"
          score={analysis.keywordScore}
          color="purple"
        />
        <ScoreCard
          label="Format"
          score={analysis.formatScore}
          color="green"
        />
        <ScoreCard
          label="Structure"
          score={analysis.structureScore}
          color="yellow"
        />
        <ScoreCard
          label="Metrics"
          score={analysis.quantificationScore}
          color="orange"
        />
      </div>

      {/* Keywords Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-4">Matched Keywords</h3>
          <KeywordCloud
            keywords={analysis.matchedKeywords.map(m => ({
              term: m.jobKeyword,
              matched: true,
              strength: m.strength,
              type: m.matchType,
            }))}
            type="matched"
          />
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-4">Missing Keywords</h3>
          <KeywordCloud
            keywords={analysis.missingKeywords.map(m => ({
              term: m.keyword.term,
              matched: false,
              importance: m.keyword.importance,
              suggestion: m.suggestedAddition,
            }))}
            type="missing"
          />
        </div>
      </div>

      {/* Gap Analysis */}
      <GapAnalysis
        hardRequirements={analysis.hardRequirements}
        softRequirements={analysis.softRequirements}
      />

      {/* Recommendations */}
      <RecommendationList recommendations={analysis.recommendations} />

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <span>View Optimizations</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Optimize Step Component
function OptimizeStep({
  analysis,
  onNext,
  onBack,
}: {
  analysis: NonNullable<ATSOptimizerContext['analysis']>;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Optimization Suggestions
        </h2>
        <p className="text-white/60">
          Review and apply these changes to improve your ATS score
        </p>
      </div>

      {/* Priority Recommendations */}
      <div className="space-y-4">
        {analysis.recommendations.slice(0, 5).map((rec, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border ${
              rec.impact === 'high'
                ? 'bg-red-500/10 border-red-500/30'
                : rec.impact === 'medium'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                rec.impact === 'high'
                  ? 'bg-red-500 text-white'
                  : rec.impact === 'medium'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white">{rec.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    rec.impact === 'high'
                      ? 'bg-red-500/20 text-red-400'
                      : rec.impact === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {rec.impact} impact
                  </span>
                </div>
                <p className="text-sm text-white/60">{rec.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Format Issues */}
      {analysis.formatIssues.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-4">Format Issues</h3>
          <div className="space-y-3">
            {analysis.formatIssues.map((issue, index) => (
              <div key={index} className="flex items-start gap-3">
                <svg className={`w-5 h-5 mt-0.5 ${
                  issue.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-white/80">{issue.description}</p>
                  <p className="text-sm text-white/50">{issue.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Back to Analysis
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <span>Export Resume</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Export Step Component
function ExportStep({
  resume,
  analysis,
  onExport,
  onBack,
  isProcessing,
}: {
  resume: NonNullable<ATSOptimizerContext['parsedResume']>;
  analysis: ATSOptimizerContext['analysis'];
  onExport: (format: 'docx' | 'pdf' | 'txt') => void;
  onBack: () => void;
  isProcessing: boolean;
}) {
  const formats: { key: 'docx' | 'pdf' | 'txt'; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: 'docx',
      label: 'Word Document',
      desc: 'Best for ATS systems and editing',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: 'pdf',
      label: 'PDF Document',
      desc: 'Print-ready format',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'txt',
      label: 'Plain Text',
      desc: 'Simple text format',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Export Your Resume
        </h2>
        <p className="text-white/60">
          Choose your preferred format to download
        </p>
      </div>

      {/* Summary */}
      {analysis && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
          <div className="text-4xl font-bold text-blue-400 mb-2">
            {analysis.overallScore}/100
          </div>
          <p className="text-white/60">ATS Compatibility Score</p>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            <span className="text-green-400">
              {analysis.matchedKeywords.length} keywords matched
            </span>
            <span className="text-yellow-400">
              {analysis.missingKeywords.length} keywords to add
            </span>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="grid md:grid-cols-3 gap-4">
        {formats.map((format) => (
          <motion.button
            key={format.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onExport(format.key)}
            disabled={isProcessing}
            className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-blue-400 mb-3 flex justify-center">
              {format.icon}
            </div>
            <h3 className="text-white font-medium mb-1">{format.label}</h3>
            <p className="text-sm text-white/50">{format.desc}</p>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
