'use client';

interface ThinkingToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function ThinkingToggle({ enabled, onToggle, disabled }: ThinkingToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
      aria-label="Toggle deep reasoning"
      title={enabled ? 'Deep reasoning enabled' : 'Deep reasoning disabled'}
    >
      {/* Thinking emoji outline icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={enabled ? 'var(--haley-secondary)' : 'var(--haley-input-placeholder)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors"
      >
        {/* Face circle */}
        <circle cx="12" cy="12" r="9" />
        {/* Left eye */}
        <circle cx="9" cy="10" r="0.5" fill={enabled ? 'var(--haley-secondary)' : 'var(--haley-input-placeholder)'} />
        {/* Right eye */}
        <circle cx="15" cy="10" r="0.5" fill={enabled ? 'var(--haley-secondary)' : 'var(--haley-input-placeholder)'} />
        {/* Thinking expression (curved line) */}
        <path d="M8 14 Q12 16 16 14" />
        {/* Thought bubble dots */}
        <circle cx="17" cy="6" r="1" opacity="0.7" />
        <circle cx="19" cy="4" r="0.7" opacity="0.5" />
        <circle cx="20.5" cy="2.5" r="0.5" opacity="0.3" />
      </svg>
    </button>
  );
}
