'use client';

import { Puzzle } from 'lucide-react';

interface LogicEngineToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export default function LogicEngineToggle({ enabled, onToggle }: LogicEngineToggleProps) {
  return (
    <div
      className="toggle-container"
      onClick={onToggle}
      title={enabled ? 'Disable Logic Engine' : 'Enable Logic Engine'}
    >
      <Puzzle size={18} className={enabled ? 'text-primary' : 'text-secondary'} />
      <span className="text-sm font-medium">Logic Engine</span>
      <div className={`toggle-switch ${enabled ? 'active' : ''}`}>
        <div className="toggle-knob" />
      </div>
    </div>
  );
}
