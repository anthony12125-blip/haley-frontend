'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { HaleyCoreGlyph } from '@/components/HaleyCoreGlyph';
import IconSoundboard from '@/components/icons/IconSoundboard';

export default function AiRDSoundboardPage() {
  const router = useRouter();

  return (
    <div className="full-screen flex overflow-hidden">
      {/* Space Background */}
      <div className="space-bg">
        <div className="stars" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="shooting-star"
            style={{
              top: `${Math.random() * 50}%`,
              right: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="glass-strong border-b border-border p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to AI R&D</span>
            </button>
            <div className="flex items-center gap-2">
              <HaleyCoreGlyph size={24} className="text-primary" />
              <span className="text-lg font-bold text-gradient">Haley</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20">
                <IconSoundboard 
                  className="text-primary" 
                  style={{ width: '64px', height: '64px' }}
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gradient mb-4">
              AI R&D Soundboard
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-secondary mb-8">
              Soundboard v1 ships next delta.
            </p>

            {/* Additional Info */}
            <div className="glass rounded-xl border border-border p-6 text-left">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-secondary">
                    The Soundboard will provide quick access to audio controls and AI voice features.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-secondary">
                    Stay tuned for interactive audio experiments and real-time voice synthesis.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-secondary">
                    This is part of the AI R&D Experimentation Zone - your safe space for testing new features.
                  </p>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => router.push('/')}
              className="mt-8 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors text-sm font-medium text-primary mx-auto"
            >
              <ArrowLeft size={18} />
              <span>Back to AI R&D</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
