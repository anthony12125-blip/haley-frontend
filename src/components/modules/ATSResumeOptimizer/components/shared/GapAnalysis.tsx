'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Requirement } from '../../types';

interface GapAnalysisProps {
  hardRequirements: Requirement[];
  softRequirements: Requirement[];
}

export default function GapAnalysis({
  hardRequirements,
  softRequirements,
}: GapAnalysisProps) {
  const metHard = hardRequirements.filter(r => r.isMet).length;
  const metSoft = softRequirements.filter(r => r.isMet).length;

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white">Requirements Analysis</h3>
        <div className="flex gap-4 text-sm">
          <span className="text-green-400">
            {metHard}/{hardRequirements.length} required met
          </span>
          <span className="text-blue-400">
            {metSoft}/{softRequirements.length} preferred met
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Hard Requirements */}
        {hardRequirements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-white/70 mb-3">Required Qualifications</h4>
            <div className="space-y-2">
              {hardRequirements.map((req, index) => (
                <RequirementItem key={index} requirement={req} />
              ))}
            </div>
          </div>
        )}

        {/* Soft Requirements */}
        {softRequirements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-white/70 mb-3">Preferred Qualifications</h4>
            <div className="space-y-2">
              {softRequirements.map((req, index) => (
                <RequirementItem key={index} requirement={req} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>Overall Match</span>
              <span>
                {hardRequirements.length + softRequirements.length > 0
                  ? Math.round(
                      ((metHard + metSoft) /
                        (hardRequirements.length + softRequirements.length)) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    hardRequirements.length + softRequirements.length > 0
                      ? ((metHard + metSoft) /
                          (hardRequirements.length + softRequirements.length)) *
                        100
                      : 0
                  }%`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequirementItem({ requirement }: { requirement: Requirement }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded-lg ${
        requirement.isMet ? 'bg-green-500/10' : 'bg-red-500/10'
      }`}
    >
      <div className={`mt-0.5 ${requirement.isMet ? 'text-green-400' : 'text-red-400'}`}>
        {requirement.isMet ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className="text-white/90">{requirement.text}</p>
        {requirement.evidence && (
          <p className="text-sm text-green-400/70 mt-1">{requirement.evidence}</p>
        )}
        {requirement.gap && (
          <p className="text-sm text-red-400/70 mt-1">{requirement.gap}</p>
        )}
      </div>
    </motion.div>
  );
}
