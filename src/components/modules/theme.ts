/**
 * Universal Module Theme Constants
 * 
 * DEPRECATED: This file exists for backward compatibility.
 * Please import from '@/styles/module-theme' instead.
 * 
 * All modules should use the comprehensive theme system in:
 * src/styles/module-theme.ts
 */

// Re-export everything from the new theme system
export { default, colors, components, layout, cx, variant } from '@/styles/module-theme';

// Legacy exports for backward compatibility
export const moduleTheme = {
  // Main container - use for the outermost module wrapper
  container: 'flex flex-col h-full min-h-0 bg-panel-dark',

  // Backgrounds
  bg: {
    page: 'bg-panel-dark',        // Main page background
    panel: 'bg-panel-medium',     // Cards, panels, sections
    input: 'bg-panel-dark',       // Form inputs, selects, textareas
    hover: 'bg-panel-light',      // Hover states
    active: 'bg-primary/20',      // Active/selected states
  },

  // Text colors
  text: {
    primary: 'text-text-primary',     // Main text
    secondary: 'text-text-secondary', // Muted/secondary text
    accent: 'text-primary',           // Accent/link text
  },

  // Borders
  border: {
    default: 'border-border',
    focus: 'focus:border-primary',
  },

  // Common input styling
  input: 'w-full px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors',

  // Common button styling
  button: {
    primary: 'px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50',
    secondary: 'px-6 py-3 bg-panel-light hover:bg-panel-light/80 text-text-primary border border-border rounded-xl transition-colors disabled:opacity-50',
    ghost: 'px-4 py-2 hover:bg-panel-light text-text-secondary hover:text-text-primary rounded-lg transition-colors',
  },

  // Panel/card styling
  panel: 'bg-panel-medium border border-border rounded-xl',

  // Header styling
  header: 'border-b border-border',

  // Tab styling
  tab: {
    active: 'bg-primary/20 text-primary',
    inactive: 'text-text-secondary hover:text-text-primary hover:bg-panel-light',
  },
} as const;
