'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ATSMode } from '../types';

interface ModeSelectorProps {
  onSelectMode: (mode: ATSMode) => void;
  profileCount: number;
}

export default function ModeSelector({ onSelectMode, profileCount }: ModeSelectorProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Choose Your Mode
          </h2>
          <p className="text-white/60 text-lg">
            Select how you want to optimize your resume for ATS systems
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Optimize Mode Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMode('optimize')}
            className="group relative p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl text-left hover:border-blue-500/50 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">
                Optimize Mode
              </h3>
              <p className="text-white/60 mb-6">
                Upload your existing resume and a job description. Get detailed ATS analysis, keyword gaps, and an optimized version.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>ATS compatibility score</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Keyword gap analysis</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Auto-optimized resume</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Export to DOCX/PDF/TXT</span>
                </div>
              </div>

              <div className="mt-8 flex items-center text-blue-400 font-medium">
                <span>Start Optimizing</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </motion.button>

          {/* Generate Mode Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMode('generate')}
            className="group relative p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-white/10 rounded-2xl text-left hover:border-emerald-500/50 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">
                Generate Mode
              </h3>
              <p className="text-white/60 mb-6">
                Build a master profile once, then generate perfectly tailored resumes for each job application.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Master profile with all experience</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI-powered content selection</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Automatic keyword injection</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>One profile, infinite resumes</span>
                </div>
              </div>

              {profileCount > 0 && (
                <div className="mt-4 px-3 py-1.5 bg-emerald-500/10 rounded-full inline-flex items-center gap-2 text-sm text-emerald-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{profileCount} profile{profileCount > 1 ? 's' : ''} saved</span>
                </div>
              )}

              <div className="mt-8 flex items-center text-emerald-400 font-medium">
                <span>Start Generating</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Mode Comparison */}
        <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10">
          <h4 className="text-white font-medium mb-4">Which mode should I use?</h4>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-blue-400 font-medium mb-2">Use Optimize Mode when:</p>
              <ul className="space-y-1 text-white/60">
                <li>• You have an existing resume to improve</li>
                <li>• You want to check ATS compatibility</li>
                <li>• You need quick analysis and fixes</li>
                <li>• Applying to a single position</li>
              </ul>
            </div>
            <div>
              <p className="text-emerald-400 font-medium mb-2">Use Generate Mode when:</p>
              <ul className="space-y-1 text-white/60">
                <li>• You apply to many different positions</li>
                <li>• You want maximum customization per job</li>
                <li>• You have diverse experience to highlight</li>
                <li>• You want a reusable career database</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
