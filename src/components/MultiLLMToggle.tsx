'use client';

/**
 * MultiLLMToggle - Toggleable Multi-LLM Query Control
 * 
 * Replaces Haley's online/offline status indicator.
 * 
 * Purpose:
 * - Haley is OS-level routing infrastructure
 * - If Haley is unavailable, the app does not function
 * - Therefore, an availability indicator is semantically incorrect
 * 
 * Behavior:
 * - OFF (default): Single-model chat, selected model receives query directly
 * - ON: Multi-select enabled, query fans to all selected models
 * 
 * Haley's Role:
 * - Does NOT respond automatically
 * - Acts only when user explicitly clicks: "Summarize", "Compare", "Find differences"
 * - Reads artifacts, not raw model streams
 */

interface MultiLLMToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

export function MultiLLMToggle({ 
  enabled, 
  onChange,
  className = '' 
}: MultiLLMToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-panel-medium ${
          enabled ? 'bg-primary' : 'bg-gray-600'
        }`}
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle Multi-LLM Query"
        title={enabled ? 'Multi-LLM Query: ON' : 'Multi-LLM Query: OFF'}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-xs text-secondary whitespace-nowrap">
        Multi-LLM Query
      </span>
    </div>
  );
}

/**
 * Design Notes:
 * 
 * Toggle Semantics:
 * - OFF = routing policy set to single-model
 * - ON = routing policy set to multi-model fan-out
 * 
 * Models = Workers:
 * - Each selected model is an independent worker
 * - No awareness of other models
 * - Routing occurs one layer above models
 * 
 * Artifacts = Outputs:
 * - Each model response returns as separate artifact card
 * - Collapsible/expandable
 * - Labeled with model name
 * 
 * Haley = Optional Interpreter:
 * - Only acts on explicit user commands
 * - Never auto-ranks, auto-summarizes, or auto-compares
 * - Reads completed artifacts, not live streams
 */
