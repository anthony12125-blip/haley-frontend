'use client';

import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useState } from 'react';

export default function ThemeSelector() {
  const { theme, setTheme, lightVariant, setLightVariant, darkVariant, setDarkVariant, effectiveTheme } = useTheme();
  const [showVariants, setShowVariants] = useState(false);

  const themes = [
    {
      id: 'light' as const,
      name: 'Light',
      icon: Sun,
      description: 'Light mode',
    },
    {
      id: 'dark' as const,
      name: 'Dark',
      icon: Moon,
      description: 'Dark mode',
    },
    {
      id: 'system' as const,
      name: 'System',
      icon: Monitor,
      description: 'Use system setting',
    },
  ];

  const lightVariants = [
    {
      id: 'light-default' as const,
      name: 'Classic White',
      description: 'Your current clean white theme',
      preview: 'bg-white border-2 border-gray-200',
    },
    {
      id: 'light-anthropic' as const,
      name: 'Anthropic Style',
      description: 'Off-white background with pure white message bubbles',
      preview: 'bg-[#F5F5F0] border-2 border-gray-300',
    },
    {
      id: 'light-space-inverse' as const,
      name: 'Inverse Space',
      description: 'White sky with black stars - exact inverse of dark theme',
      preview: 'bg-gradient-to-br from-white to-gray-100 border-2 border-gray-400',
    },
  ];

  const darkVariants = [
    {
      id: 'dark-default' as const,
      name: 'Space Theme',
      description: 'Dark space with stars and shooting stars',
      preview: 'bg-gradient-to-br from-[#1B2735] to-[#090A0F] border-2 border-blue-800',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Theme</h3>
        <button
          onClick={() => setShowVariants(!showVariants)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-all hover:bg-panel-light text-text-secondary hover:text-primary"
        >
          <Palette size={14} />
          {showVariants ? 'Hide' : 'Show'} Variants
        </button>
      </div>

      {/* Main theme selector */}
      <div className="grid grid-cols-3 gap-2">
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-primary/20 border-2 border-primary text-primary' 
                  : 'bg-panel-medium border-2 border-transparent hover:border-border hover:bg-panel-light'
                }
              `}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Theme description */}
      <p className="text-xs text-text-secondary">
        {theme === 'system' 
          ? 'Automatically switches between light and dark based on your system settings'
          : theme === 'light'
          ? 'Always use light mode'
          : 'Always use dark mode'
        }
      </p>

      {/* Variant selector */}
      {showVariants && (
        <div className="pt-3 border-t border-border space-y-4 animate-slideDown">
          {/* Light variants */}
          {(theme === 'light' || theme === 'system') && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                <Sun size={14} />
                Light Theme Variants
              </h4>
              <div className="space-y-2">
                {lightVariants.map((variant) => {
                  const isActive = lightVariant === variant.id;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setLightVariant(variant.id)}
                      className={`
                        w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left
                        ${isActive 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'bg-panel-medium border-2 border-transparent hover:border-border hover:bg-panel-light'
                        }
                      `}
                    >
                      <div className={`w-12 h-12 rounded-lg flex-shrink-0 ${variant.preview}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{variant.name}</span>
                          {isActive && <span className="text-xs text-primary">Active</span>}
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{variant.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dark variants */}
          {(theme === 'dark' || theme === 'system') && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                <Moon size={14} />
                Dark Theme Variants
              </h4>
              <div className="space-y-2">
                {darkVariants.map((variant) => {
                  const isActive = darkVariant === variant.id;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setDarkVariant(variant.id)}
                      className={`
                        w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left
                        ${isActive 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'bg-panel-medium border-2 border-transparent hover:border-border hover:bg-panel-light'
                        }
                      `}
                    >
                      <div className={`w-12 h-12 rounded-lg flex-shrink-0 ${variant.preview}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{variant.name}</span>
                          {isActive && <span className="text-xs text-primary">Active</span>}
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{variant.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
