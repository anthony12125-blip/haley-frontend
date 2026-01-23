'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface MatchedKeyword {
  term: string;
  matched: true;
  strength: number;
  type: 'exact' | 'synonym' | 'partial';
}

interface MissingKeyword {
  term: string;
  matched: false;
  importance: 'critical' | 'important' | 'nice-to-have';
  suggestion?: string;
}

type KeywordItem = MatchedKeyword | MissingKeyword;

interface KeywordCloudProps {
  keywords: KeywordItem[];
  type: 'matched' | 'missing';
  maxItems?: number;
}

export default function KeywordCloud({
  keywords,
  type,
  maxItems = 20,
}: KeywordCloudProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordItem | null>(null);

  const displayKeywords = keywords.slice(0, maxItems);

  if (displayKeywords.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        {type === 'matched' ? 'No keywords matched' : 'No missing keywords detected'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {displayKeywords.map((keyword, index) => (
          <motion.button
            key={keyword.term}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => setSelectedKeyword(keyword)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              keyword.matched
                ? keyword.strength >= 0.9
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : keyword.strength >= 0.5
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : keyword.importance === 'critical'
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : keyword.importance === 'important'
                ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {keyword.term}
            {keyword.matched && keyword.type !== 'exact' && (
              <span className="ml-1 text-xs opacity-60">
                ({keyword.type})
              </span>
            )}
            {!keyword.matched && keyword.importance === 'critical' && (
              <span className="ml-1">!</span>
            )}
          </motion.button>
        ))}
      </div>

      {keywords.length > maxItems && (
        <p className="text-sm text-white/40">
          +{keywords.length - maxItems} more keywords
        </p>
      )}

      {/* Tooltip/Details */}
      {selectedKeyword && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-white">{selectedKeyword.term}</h4>
              {selectedKeyword.matched ? (
                <div className="text-sm text-white/60 mt-1">
                  <p>Match type: {selectedKeyword.type}</p>
                  <p>Match strength: {Math.round(selectedKeyword.strength * 100)}%</p>
                </div>
              ) : (
                <div className="text-sm text-white/60 mt-1">
                  <p>Importance: {selectedKeyword.importance}</p>
                  {selectedKeyword.suggestion && (
                    <p className="mt-2 text-white/80">{selectedKeyword.suggestion}</p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedKeyword(null)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex flex-wrap gap-4 text-xs text-white/40">
          {type === 'matched' ? (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Exact match
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" /> Synonym match
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Partial match
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> Important
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white/30" /> Nice to have
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
