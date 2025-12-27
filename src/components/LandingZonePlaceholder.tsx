'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface LandingZonePlaceholderProps {
  id: string;
  initials: string;
  color: string;
  title?: string;
  description?: string;
}

export default function LandingZonePlaceholder({
  id,
  initials,
  color,
  title = 'Landing Zone',
  description = 'Placeholder for future agent/tool integration',
}: LandingZonePlaceholderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Compact Card */}
      <button
        onClick={() => setIsExpanded(true)}
        className="relative w-full h-20 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
        style={{ border: `2px solid ${color}` }}
        aria-label={`Expand ${title}`}
      >
        {/* Initials Badge - Top Left */}
        <div
          className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>

        {/* Title - Center */}
        <div className="flex items-center justify-center h-full">
          <span className="text-sm text-gray-300 font-medium">{title}</span>
        </div>
      </button>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
            style={{ border: `2px solid ${color}` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-800 rounded"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="text-gray-300 text-sm">
              <p>{description}</p>
              <div className="mt-4 p-3 bg-gray-800 rounded">
                <p className="text-xs text-gray-400">
                  Zone ID: <span className="text-gray-300">{id}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
