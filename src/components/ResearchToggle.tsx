'use client';

import { Microscope } from 'lucide-react';

interface ResearchToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export default function ResearchToggle({ enabled, onToggle }: ResearchToggleProps) {
  return (
    <div
      className="toggle-container"
      onClick={onToggle}
      title={enabled ? 'Disable Research Mode' : 'Enable Research Mode'}
    >
      <Microscope size={18} className={enabled ? 'text-primary' : 'text-secondary'} />
      <span className="text-sm font-medium">Research</span>
      <div className={`toggle-switch ${enabled ? 'active' : ''}`}>
        <div className="toggle-knob" />
      </div>
    </div>
  );
}
