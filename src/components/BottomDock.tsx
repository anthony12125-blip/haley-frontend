'use client';

import LandingZonePlaceholder from './LandingZonePlaceholder';

interface LandingZone {
  id: string;
  initials: string;
  color: string;
  title: string;
  description?: string;
}

interface BottomDockProps {
  zones?: LandingZone[];
}

const DEFAULT_ZONES: LandingZone[] = [
  {
    id: 'zone-gemini',
    initials: 'G',
    color: '#3b82f6',
    title: 'Gemini Zone',
    description: 'Reserved for Gemini LLM integration',
  },
  {
    id: 'zone-claude',
    initials: 'A',
    color: '#8b5cf6',
    title: 'Claude Zone',
    description: 'Reserved for Claude LLM integration',
  },
  {
    id: 'zone-gpt',
    initials: 'C',
    color: '#10b981',
    title: 'GPT Zone',
    description: 'Reserved for GPT LLM integration',
  },
];

export default function BottomDock({ zones = DEFAULT_ZONES }: BottomDockProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-gray-900 border-t border-gray-700 z-30">
      {/* Horizontal Scrolling Row */}
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="flex items-center gap-3 h-full px-4 py-2">
          {zones.map((zone) => (
            <div key={zone.id} className="flex-shrink-0 w-[140px]">
              <LandingZonePlaceholder
                id={zone.id}
                initials={zone.initials}
                color={zone.color}
                title={zone.title}
                description={zone.description}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Build Info Badge - Top Right */}
      <div className="absolute top-2 right-2 bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">
        Build #18
      </div>
    </div>
  );
}
