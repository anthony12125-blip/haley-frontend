'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ATSMode,
  ATSWorkflowStep,
  ATSOptimizerContext,
  MasterProfile,
  ParsedResume,
  ParsedJobDescription,
  ATSAnalysis,
  GeneratedResume,
  SelectionDecision,
  ATSPreferences,
} from './types';
import ModeSelector from './components/ModeSelector';
import OptimizeWorkflow from './components/OptimizeWorkflow';
import GenerateWorkflow from './components/GenerateWorkflow';

interface ATSResumeOptimizerProps {
  onBack: () => void;
}

const DEFAULT_PREFERENCES: ATSPreferences = {
  includeProjects: true,
  includeSoftSkills: false,
  maxBulletsPerJob: 5,
  resumeLength: 'auto',
  prioritizeRecent: true,
};

export default function ATSResumeOptimizer({ onBack }: ATSResumeOptimizerProps) {
  // Mode and workflow state
  const [mode, setMode] = useState<ATSMode | null>(null);
  const [optimizeStep, setOptimizeStep] = useState<ATSWorkflowStep>('upload');
  const [generateStep, setGenerateStep] = useState<ATSWorkflowStep>('profile-select');

  // Data state
  const [profiles, setProfiles] = useState<MasterProfile[]>(() => loadProfiles());
  const [activeProfile, setActiveProfile] = useState<MasterProfile | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [parsedJD, setParsedJD] = useState<ParsedJobDescription | null>(null);
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [selectionDecision, setSelectionDecision] = useState<SelectionDecision | null>(null);
  const [preferences, setPreferences] = useState<ATSPreferences>(DEFAULT_PREFERENCES);

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile management
  const saveProfile = useCallback((profile: MasterProfile) => {
    setProfiles(prev => {
      const existing = prev.findIndex(p => p.id === profile.id);
      const updated = existing >= 0
        ? [...prev.slice(0, existing), profile, ...prev.slice(existing + 1)]
        : [...prev, profile];
      persistProfiles(updated);
      return updated;
    });
    setActiveProfile(profile);
  }, []);

  const deleteProfile = useCallback((profileId: string) => {
    setProfiles(prev => {
      const updated = prev.filter(p => p.id !== profileId);
      persistProfiles(updated);
      return updated;
    });
    if (activeProfile?.id === profileId) {
      setActiveProfile(null);
    }
  }, [activeProfile]);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setOptimizeStep('upload');
    setGenerateStep('profile-select');
    setParsedResume(null);
    setParsedJD(null);
    setAnalysis(null);
    setGeneratedResume(null);
    setSelectionDecision(null);
    setError(null);
  }, []);

  // Mode change handler
  const handleModeChange = useCallback((newMode: ATSMode | null) => {
    if (newMode !== mode) {
      resetWorkflow();
    }
    setMode(newMode);
  }, [mode, resetWorkflow]);

  // Context object for child components
  const context: ATSOptimizerContext = useMemo(() => ({
    mode: mode || 'optimize',
    currentStep: mode === 'optimize' ? optimizeStep : generateStep,
    profiles,
    activeProfile,
    parsedResume,
    parsedJD,
    analysis,
    generatedResume,
    selectionDecision,
    preferences,
    isProcessing,
    error,
    // Actions
    setMode: handleModeChange,
    setStep: (step: ATSWorkflowStep) => {
      if (mode === 'optimize') {
        setOptimizeStep(step);
      } else {
        setGenerateStep(step);
      }
    },
    setActiveProfile,
    setParsedResume,
    setParsedJD,
    setAnalysis,
    setGeneratedResume,
    setSelectionDecision,
    setPreferences,
    setIsProcessing,
    setError,
    saveProfile,
    deleteProfile,
    resetWorkflow,
  }), [
    mode, optimizeStep, generateStep, profiles, activeProfile,
    parsedResume, parsedJD, analysis, generatedResume, selectionDecision,
    preferences, isProcessing, error, handleModeChange, saveProfile,
    deleteProfile, resetWorkflow,
  ]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#1a1a2e]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">
              ATS Resume Optimizer
            </h1>
            <p className="text-sm text-white/50">
              {mode === 'optimize'
                ? 'Analyze and optimize your resume for ATS systems'
                : mode === 'generate'
                ? 'Generate tailored resumes from your master profile'
                : 'Choose your optimization mode'}
            </p>
          </div>
        </div>

        {mode && (
          <button
            onClick={() => handleModeChange(null)}
            className="px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Switch Mode
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!mode ? (
            <motion.div
              key="mode-selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <ModeSelector
                onSelectMode={handleModeChange}
                profileCount={profiles.length}
              />
            </motion.div>
          ) : mode === 'optimize' ? (
            <motion.div
              key="optimize-workflow"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <OptimizeWorkflow context={context} />
            </motion.div>
          ) : (
            <motion.div
              key="generate-workflow"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <GenerateWorkflow context={context} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/90 text-white rounded-lg shadow-lg flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// LocalStorage helpers
function loadProfiles(): MasterProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('ats_master_profiles');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function persistProfiles(profiles: MasterProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ats_master_profiles', JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to persist profiles:', e);
  }
}
