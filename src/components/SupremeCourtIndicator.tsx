'use client';

import { Users, Zap } from 'lucide-react';

interface SupremeCourtIndicatorProps {
  activeModels: string[];
  status?: 'idle' | 'debating' | 'consensus';
}

export default function SupremeCourtIndicator({ activeModels, status = 'idle' }: SupremeCourtIndicatorProps) {
  if (activeModels.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-panel-medium border border-border rounded-xl">
      <div className="supreme-indicator">
        <Users size={14} />
        <span className="text-xs">SUPREME COURT</span>
        {status === 'debating' && <Zap size={12} className="animate-pulse" />}
      </div>
      <div className="flex -space-x-2">
        {activeModels.map((model, index) => (
          <div
            key={model}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold border-2 border-panel-dark"
            title={model}
            style={{
              background: `hsl(${index * 60}, 70%, 60%)`,
            }}
          >
            {model[0].toUpperCase()}
          </div>
        ))}
      </div>
      <div className="text-xs text-secondary">
        {activeModels.length} AIs
      </div>
    </div>
  );
}
