/**
 * Universal Module Theme Constants
 *
 * All modules should import from this file to maintain consistent theming.
 * These classes use CSS variables defined in globals.css that automatically
 * switch between light and dark mode.
 */

export const moduleTheme = {
  // Main container - use for the outermost module wrapper
  container: 'flex flex-col h-full min-h-0',

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
  input: 'bg-panel-dark border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',

  // Common button styling
  button: {
    primary: 'bg-primary hover:bg-primary/90 text-white',
    secondary: 'bg-panel-light hover:bg-panel-medium text-text-primary',
    ghost: 'hover:bg-panel-light text-text-secondary',
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

// Helper to combine theme classes with custom classes
export const cx = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(' ');
