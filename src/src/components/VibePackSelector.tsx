'use client';

import { useVibePack } from '@/contexts/VibePackContext';
import { VIBE_PACKS } from '@/lib/vibePacks';

export default function VibePackSelector() {
  const { currentPack, setVibePackId } = useVibePack();

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-2">Vibe Pack</h3>
        <p className="text-xs text-secondary mb-3">
          Choose status words shown during processing
        </p>
      </div>

      <div className="space-y-2">
        {VIBE_PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => setVibePackId(pack.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentPack.id === pack.id
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'hover:bg-panel-light border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{pack.label}</span>
              {currentPack.id === pack.id && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            {currentPack.id === pack.id && (
              <div className="text-xs text-secondary mt-1">
                {pack.thinking_words.length + pack.generating_words.length} words
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
