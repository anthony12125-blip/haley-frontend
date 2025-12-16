'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

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

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">Theme</h3>
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
      <p className="text-xs text-text-secondary">
        {theme === 'system' 
          ? 'Automatically switches between light and dark based on your system settings'
          : theme === 'light'
          ? 'Always use light mode'
          : 'Always use dark mode'
        }
      </p>
    </div>
  );
}
