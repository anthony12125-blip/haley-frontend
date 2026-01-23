'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ScoreCardProps {
  label: string;
  score: number;
  color?: 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple';
  size?: 'small' | 'medium' | 'large';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    ring: 'stroke-blue-500',
    text: 'text-blue-400',
  },
  green: {
    bg: 'bg-green-500/10',
    ring: 'stroke-green-500',
    text: 'text-green-400',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    ring: 'stroke-yellow-500',
    text: 'text-yellow-400',
  },
  orange: {
    bg: 'bg-orange-500/10',
    ring: 'stroke-orange-500',
    text: 'text-orange-400',
  },
  red: {
    bg: 'bg-red-500/10',
    ring: 'stroke-red-500',
    text: 'text-red-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    ring: 'stroke-purple-500',
    text: 'text-purple-400',
  },
};

const sizeMap = {
  small: {
    container: 'p-3',
    circle: 48,
    stroke: 4,
    text: 'text-lg',
    label: 'text-xs',
  },
  medium: {
    container: 'p-4',
    circle: 64,
    stroke: 5,
    text: 'text-2xl',
    label: 'text-sm',
  },
  large: {
    container: 'p-6',
    circle: 80,
    stroke: 6,
    text: 'text-3xl',
    label: 'text-base',
  },
};

export default function ScoreCard({
  label,
  score,
  color = 'blue',
  size = 'medium',
}: ScoreCardProps) {
  const colors = colorMap[color];
  const sizing = sizeMap[size];

  const radius = (sizing.circle - sizing.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className={`${colors.bg} rounded-xl ${sizing.container} border border-white/10`}>
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: sizing.circle, height: sizing.circle }}>
          {/* Background circle */}
          <svg
            className="absolute inset-0 -rotate-90"
            width={sizing.circle}
            height={sizing.circle}
          >
            <circle
              cx={sizing.circle / 2}
              cy={sizing.circle / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={sizing.stroke}
              className="text-white/10"
            />
          </svg>

          {/* Progress circle */}
          <svg
            className="absolute inset-0 -rotate-90"
            width={sizing.circle}
            height={sizing.circle}
          >
            <motion.circle
              cx={sizing.circle / 2}
              cy={sizing.circle / 2}
              r={radius}
              fill="none"
              className={colors.ring}
              strokeWidth={sizing.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>

          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className={`${sizing.text} font-bold ${colors.text}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {score}
            </motion.span>
          </div>
        </div>

        <span className={`mt-2 ${sizing.label} text-white/60`}>
          {label}
        </span>
      </div>
    </div>
  );
}
