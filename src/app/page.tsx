'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Sparkles, Brain, Users, Zap } from 'lucide-react';

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/chat');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="full-screen flex items-center justify-center">
        <div className="space-bg">
          <div className="stars" />
        </div>
        <div className="relative z-10 text-center">
          <div className="text-3xl font-bold text-gradient mb-4">HaleyOS</div>
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="full-screen flex items-center justify-center">
      <div className="space-bg">
        <div className="stars" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="shooting-star"
            style={{
              top: `${Math.random() * 100}%`,
              right: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-bold text-gradient mb-6">
            HaleyOS
          </h1>
          <p className="text-xl md:text-2xl text-secondary mb-4">
            The Ultimate Multi-LLM AI Assistant
          </p>
          <p className="text-lg text-secondary/80 max-w-2xl mx-auto">
            Harness the power of multiple AI models working together.
            From single AI responses to supreme court debates.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Sparkles size={32} />}
            title="Single AI"
            description="Fast, efficient responses from your chosen model"
          />
          <FeatureCard
            icon={<Brain size={32} />}
            title="Multi AI"
            description="Multiple models collaborate for better answers"
          />
          <FeatureCard
            icon={<Users size={32} />}
            title="Supreme Court"
            description="All AIs debate to reach consensus on complex topics"
          />
        </div>

        {/* Additional Features */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Badge icon={<Zap />} text="Research Mode" />
          <Badge icon={<Brain />} text="Logic Engine" />
          <Badge text="Voice Input" />
          <Badge text="File Analysis" />
          <Badge text="Magic Window" />
        </div>

        {/* CTA */}
        <div className="glass-strong rounded-2xl p-8 max-w-md mx-auto">
          <h3 className="text-2xl font-bold mb-4">Get Started</h3>
          <p className="text-secondary mb-6">
            Sign in with Google to access HaleyOS
          </p>
          <button
            onClick={signInWithGoogle}
            className="btn-primary w-full flex items-center justify-center gap-3 text-lg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm text-secondary/60">
          <p>Powered by Claude, GPT-4, Gemini, and more</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-strong rounded-xl p-6 hover-lift transition-all">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-secondary text-sm">{description}</p>
    </div>
  );
}

function Badge({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-panel-medium border border-border rounded-full">
      {icon && <span className="text-primary">{icon}</span>}
      <span className="text-sm">{text}</span>
    </div>
  );
}
