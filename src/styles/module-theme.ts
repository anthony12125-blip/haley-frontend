/**
 * ============================================================================
 * HALEY OS - UNIVERSAL MODULE THEME SYSTEM
 * ============================================================================
 * 
 * This is the SINGLE SOURCE OF TRUTH for all module styling.
 * 
 * RULES:
 * 1. ALL modules MUST import from this file
 * 2. NEVER use raw color classes (bg-white, text-gray-*, bg-white/*, etc.)
 * 3. ALWAYS use the semantic classes defined here
 * 4. If you need a new style, ADD IT HERE FIRST
 * 
 * The classes here use CSS variables from globals.css which automatically
 * adapt to light/dark mode.
 */

// =============================================================================
// SEMANTIC COLOR TOKENS (mapped to Tailwind classes)
// =============================================================================

export const colors = {
  // Backgrounds - use these for all surface colors
  bg: {
    page: 'bg-panel-dark',           // Deepest background (page level)
    panel: 'bg-panel-medium',        // Cards, containers, sections
    input: 'bg-panel-dark',          // Form inputs, textareas, selects
    elevated: 'bg-panel-light',      // Modals, dropdowns, popovers
    hover: 'bg-panel-light',         // Hover states
    active: 'bg-primary/20',         // Active/selected states
    muted: 'bg-panel-light/50',      // Subtle backgrounds
  },
  
  // Text colors
  text: {
    primary: 'text-text-primary',       // Main text, headings
    secondary: 'text-text-secondary',   // Descriptions, labels
    muted: 'text-text-secondary/60',    // Placeholders, hints
    accent: 'text-primary',             // Links, highlights
    error: 'text-error',                // Error messages
    success: 'text-success',            // Success messages
  },
  
  // Borders
  border: {
    default: 'border-border',
    subtle: 'border-border/50',
    strong: 'border-border',
    focus: 'border-primary',
    error: 'border-error',
    success: 'border-success',
  },
} as const;

// =============================================================================
// COMPONENT CLASSES - Prebuilt combinations for common patterns
// =============================================================================

export const components = {
  // ---------------------------------------------------------------------------
  // INPUTS
  // ---------------------------------------------------------------------------
  input: {
    base: `
      w-full px-4 py-3
      bg-panel-dark 
      border border-border rounded-xl
      text-text-primary 
      placeholder:text-text-secondary/50
      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
      transition-colors duration-200
    `.replace(/\s+/g, ' ').trim(),
    
    sm: `
      w-full px-3 py-2 text-sm
      bg-panel-dark 
      border border-border rounded-lg
      text-text-primary 
      placeholder:text-text-secondary/50
      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
      transition-colors duration-200
    `.replace(/\s+/g, ' ').trim(),
    
    lg: `
      w-full px-5 py-4 text-lg
      bg-panel-dark 
      border border-border rounded-xl
      text-text-primary 
      placeholder:text-text-secondary/50
      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
      transition-colors duration-200
    `.replace(/\s+/g, ' ').trim(),
  },
  
  // Select dropdown
  select: `
    w-full px-4 py-3
    bg-panel-dark 
    border border-border rounded-xl
    text-text-primary
    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
    transition-colors duration-200
    cursor-pointer appearance-none
    bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a7b7c9%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
    bg-no-repeat bg-[position:right_1rem_center]
  `.replace(/\s+/g, ' ').trim(),
  
  // Textarea
  textarea: `
    w-full px-4 py-3 min-h-[120px]
    bg-panel-dark 
    border border-border rounded-xl
    text-text-primary 
    placeholder:text-text-secondary/50
    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
    transition-colors duration-200
    resize-y
  `.replace(/\s+/g, ' ').trim(),

  // ---------------------------------------------------------------------------
  // BUTTONS
  // ---------------------------------------------------------------------------
  button: {
    primary: `
      px-6 py-3
      bg-primary hover:bg-primary/90 active:bg-primary/80
      text-white font-medium
      rounded-xl
      transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `.replace(/\s+/g, ' ').trim(),
    
    secondary: `
      px-6 py-3
      bg-panel-light hover:bg-panel-light/80
      text-text-primary font-medium
      border border-border
      rounded-xl
      transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `.replace(/\s+/g, ' ').trim(),
    
    ghost: `
      px-4 py-2
      bg-transparent hover:bg-panel-light
      text-text-secondary hover:text-text-primary
      rounded-lg
      transition-colors duration-200
    `.replace(/\s+/g, ' ').trim(),
    
    danger: `
      px-6 py-3
      bg-error hover:bg-error/90
      text-white font-medium
      rounded-xl
      transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `.replace(/\s+/g, ' ').trim(),
    
    success: `
      px-6 py-3
      bg-success hover:bg-success/90
      text-white font-medium
      rounded-xl
      transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `.replace(/\s+/g, ' ').trim(),
    
    icon: `
      p-2
      bg-transparent hover:bg-panel-light
      text-text-secondary hover:text-text-primary
      rounded-lg
      transition-colors duration-200
    `.replace(/\s+/g, ' ').trim(),
  },

  // ---------------------------------------------------------------------------
  // CARDS & PANELS
  // ---------------------------------------------------------------------------
  card: {
    base: `
      bg-panel-medium
      border border-border
      rounded-xl
      p-6
    `.replace(/\s+/g, ' ').trim(),
    
    elevated: `
      bg-panel-light
      border border-border
      rounded-xl
      p-6
      shadow-lg
    `.replace(/\s+/g, ' ').trim(),
    
    interactive: `
      bg-panel-medium hover:bg-panel-light
      border border-border hover:border-primary/50
      rounded-xl
      p-6
      cursor-pointer
      transition-all duration-200
    `.replace(/\s+/g, ' ').trim(),
  },

  // ---------------------------------------------------------------------------
  // TABLES
  // ---------------------------------------------------------------------------
  table: {
    container: 'w-full overflow-x-auto',
    table: 'w-full',
    header: 'bg-panel-light',
    headerCell: 'text-left p-3 text-sm font-medium text-text-secondary',
    body: 'divide-y divide-border',
    row: 'hover:bg-panel-light/50 transition-colors',
    cell: 'p-3 text-text-primary',
  },

  // ---------------------------------------------------------------------------
  // BADGES & TAGS
  // ---------------------------------------------------------------------------
  badge: {
    default: `
      inline-flex items-center px-2.5 py-0.5
      bg-panel-light
      text-text-secondary text-xs font-medium
      rounded-full
    `.replace(/\s+/g, ' ').trim(),
    
    primary: `
      inline-flex items-center px-2.5 py-0.5
      bg-primary/20
      text-primary text-xs font-medium
      rounded-full
    `.replace(/\s+/g, ' ').trim(),
    
    success: `
      inline-flex items-center px-2.5 py-0.5
      bg-success/20
      text-success text-xs font-medium
      rounded-full
    `.replace(/\s+/g, ' ').trim(),
    
    error: `
      inline-flex items-center px-2.5 py-0.5
      bg-error/20
      text-error text-xs font-medium
      rounded-full
    `.replace(/\s+/g, ' ').trim(),
  },

  // ---------------------------------------------------------------------------
  // TABS
  // ---------------------------------------------------------------------------
  tabs: {
    container: 'flex gap-1 p-1 bg-panel-dark rounded-xl',
    tab: {
      base: 'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
      active: 'bg-primary/20 text-primary',
      inactive: 'text-text-secondary hover:text-text-primary hover:bg-panel-light',
    },
  },

  // ---------------------------------------------------------------------------
  // MODALS
  // ---------------------------------------------------------------------------
  modal: {
    overlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4',
    container: 'bg-panel-dark border border-border rounded-xl w-full max-w-lg overflow-hidden',
    header: 'p-4 border-b border-border flex items-center justify-between',
    title: 'font-semibold text-lg text-text-primary',
    body: 'p-4',
    footer: 'p-4 border-t border-border flex justify-end gap-3',
  },

  // ---------------------------------------------------------------------------
  // ALERTS
  // ---------------------------------------------------------------------------
  alert: {
    info: `
      p-4 rounded-xl
      bg-primary/10 border border-primary/30
      text-text-primary
    `.replace(/\s+/g, ' ').trim(),
    
    success: `
      p-4 rounded-xl
      bg-success/10 border border-success/30
      text-text-primary
    `.replace(/\s+/g, ' ').trim(),
    
    warning: `
      p-4 rounded-xl
      bg-yellow-500/10 border border-yellow-500/30
      text-text-primary
    `.replace(/\s+/g, ' ').trim(),
    
    error: `
      p-4 rounded-xl
      bg-error/10 border border-error/30
      text-text-primary
    `.replace(/\s+/g, ' ').trim(),
  },
} as const;

// =============================================================================
// LAYOUT CLASSES - For module structure
// =============================================================================

export const layout = {
  // Full module container
  module: 'flex flex-col h-full min-h-0 bg-panel-dark',
  
  // Module header with border
  header: 'flex items-center justify-between p-4 md:p-6 border-b border-border',
  
  // Scrollable content area
  content: 'flex-1 overflow-auto p-4 md:p-6',
  
  // Footer with border
  footer: 'flex items-center justify-end gap-4 p-4 md:p-6 border-t border-border',
  
  // Common section spacing
  section: 'space-y-4',
  
  // Form layout
  form: {
    group: 'space-y-2',
    label: 'block text-sm font-medium text-text-secondary',
    hint: 'text-xs text-text-secondary/60 mt-1',
    error: 'text-xs text-error mt-1',
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Combines multiple class strings, filtering out falsy values
 * Usage: cx('base-class', condition && 'conditional-class', 'another-class')
 */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates a variant selector function for components with multiple states
 * Usage: const buttonClass = variant(components.button, isActive ? 'primary' : 'secondary')
 */
export function variant<T extends Record<string, string>>(
  variants: T,
  selected: keyof T
): string {
  return variants[selected];
}

// =============================================================================
// THEME OBJECT (default export for convenience)
// =============================================================================

const theme = {
  colors,
  components,
  layout,
  cx,
  variant,
  
  // Quick access shortcuts
  input: components.input.base,
  select: components.select,
  textarea: components.textarea,
  button: components.button,
  card: components.card.base,
} as const;

export default theme;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ThemeColors = typeof colors;
export type ThemeComponents = typeof components;
export type ThemeLayout = typeof layout;
