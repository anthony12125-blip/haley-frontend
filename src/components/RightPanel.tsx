'use client';

import LandingZonePlaceholder from './LandingZonePlaceholder';

interface LandingZone {
  id: string;
  initials: string;
  color: string;
  title: string;
  description?: string;
}

interface RightPanelProps {
  zones?: LandingZone[];
}

const DEFAULT_ZONES: LandingZone[] = [
  {
    id: 'zone-1',
    initials: 'A1',
    color: '#3b82f6',
    title: 'Agent Zone 1',
    description: 'Reserved for future agent integration',
  },
  {
    id: 'zone-2',
    initials: 'A2',
    color: '#10b981',
    title: 'Agent Zone 2',
    description: 'Reserved for future agent integration',
  },
  {
    id: 'zone-3',
    initials: 'T1',
    color: '#8b5cf6',
    title: 'Tool Zone 1',
    description: 'Reserved for future tool integration',
  },
];

export default function RightPanel({ zones = DEFAULT_ZONES }: RightPanelProps) {
  return (
    <div className="fixed right-0 top-0 bottom-0 w-[350px] bg-gray-900 border-l border-gray-700 z-30 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-4 py-3 z-10">
        <h2 className="text-sm font-semibold text-white">Landing Zones</h2>
        <p className="text-xs text-gray-400 mt-1">Active agent and tool containers</p>
      </div>

      {/* Vertical Stack of Landing Zones */}
      <div className="p-4 space-y-3">
        {zones.map((zone) => (
          <LandingZonePlaceholder
            key={zone.id}
            id={zone.id}
            initials={zone.initials}
            color={zone.color}
            title={zone.title}
            description={zone.description}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-4 py-2">
        <p className="text-xs text-gray-500 text-center">
          Build #17 - Landing Zones v2.0
        </p>
      </div>
    </div>
  );
}
