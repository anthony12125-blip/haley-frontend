'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Expanded theme types to support multiple variants
type ThemeMode = 'light' | 'dark' | 'system';
type LightVariant = 'light-default' | 'light-anthropic' | 'light-space-inverse';
type DarkVariant = 'dark-default';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  lightVariant: LightVariant;
  setLightVariant: (variant: LightVariant) => void;
  darkVariant: DarkVariant;
  setDarkVariant: (variant: DarkVariant) => void;
  effectiveTheme: 'light' | 'dark';
  effectiveVariant: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [lightVariant, setLightVariantState] = useState<LightVariant>('light-default');
  const [darkVariant, setDarkVariantState] = useState<DarkVariant>('dark-default');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');
  const [effectiveVariant, setEffectiveVariant] = useState<string>('dark-default');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('haley_theme') as ThemeMode;
    const savedLightVariant = localStorage.getItem('haley_light_variant') as LightVariant;
    const savedDarkVariant = localStorage.getItem('haley_dark_variant') as DarkVariant;
    
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    if (savedLightVariant && ['light-default', 'light-anthropic', 'light-space-inverse'].includes(savedLightVariant)) {
      setLightVariantState(savedLightVariant);
    }
    if (savedDarkVariant && ['dark-default'].includes(savedDarkVariant)) {
      setDarkVariantState(savedDarkVariant);
    }
  }, []);

  // Handle system theme detection and variant application
  useEffect(() => {
    const getSystemTheme = (): 'light' | 'dark' => {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    };

    const applyTheme = () => {
      const newEffectiveTheme = theme === 'system' ? getSystemTheme() : theme;
      const newEffectiveVariant = newEffectiveTheme === 'light' ? lightVariant : darkVariant;
      
      setEffectiveTheme(newEffectiveTheme);
      setEffectiveVariant(newEffectiveVariant);
      
      // Apply theme class to document
      if (typeof document !== 'undefined') {
        // Remove all theme classes
        document.documentElement.classList.remove(
          'light', 
          'dark',
          'light-default',
          'light-anthropic',
          'light-space-inverse',
          'dark-default'
        );
        
        // Add the base theme class (light or dark)
        document.documentElement.classList.add(newEffectiveTheme);
        
        // Add the variant class
        document.documentElement.classList.add(newEffectiveVariant);
      }
    };

    applyTheme();

    // Listen for system theme changes
    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
      // Legacy browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme, lightVariant, darkVariant]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('haley_theme', newTheme);
  };

  const setLightVariant = (variant: LightVariant) => {
    setLightVariantState(variant);
    localStorage.setItem('haley_light_variant', variant);
  };

  const setDarkVariant = (variant: DarkVariant) => {
    setDarkVariantState(variant);
    localStorage.setItem('haley_dark_variant', variant);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      lightVariant,
      setLightVariant,
      darkVariant,
      setDarkVariant,
      effectiveTheme,
      effectiveVariant
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
