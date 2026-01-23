'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recommendation } from '../../types';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filtered = recommendations.filter(
    rec => filter === 'all' || rec.impact === filter
  );

  const categoryIcons: Record<string, React.ReactNode> = {
    keyword: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
    content: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    format: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    quantification: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    structure: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white">Recommendations</h3>
        <div className="flex gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === f
                  ? f === 'high'
                    ? 'bg-red-500/20 text-red-400'
                    : f === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : f === 'low'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All' : `${f.charAt(0).toUpperCase() + f.slice(1)} Impact`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-white/40 py-4">No recommendations in this category</p>
        ) : (
          filtered.map((rec, index) => (
            <motion.div
              key={`${rec.priority}-${rec.title}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg border transition-all ${
                expanded === rec.priority
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
              }`}
            >
              <button
                onClick={() => setExpanded(expanded === rec.priority ? null : rec.priority)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      rec.impact === 'high'
                        ? 'bg-red-500/20 text-red-400'
                        : rec.impact === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {categoryIcons[rec.category] || categoryIcons.content}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">#{rec.priority}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          rec.impact === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : rec.impact === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {rec.impact}
                      </span>
                      <span className="text-xs text-white/30 capitalize">{rec.category}</span>
                    </div>
                    <h4 className="font-medium text-white mt-1">{rec.title}</h4>
                  </div>
                  <svg
                    className={`w-5 h-5 text-white/40 transition-transform ${
                      expanded === rec.priority ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {expanded === rec.priority && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0">
                      <div className="pl-12 border-l-2 border-white/10 ml-2">
                        <p className="text-white/70">{rec.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-sm text-white/50">
        <span>{recommendations.filter(r => r.impact === 'high').length} high priority</span>
        <span>{recommendations.filter(r => r.impact === 'medium').length} medium priority</span>
        <span>{recommendations.filter(r => r.impact === 'low').length} low priority</span>
      </div>
    </div>
  );
}
