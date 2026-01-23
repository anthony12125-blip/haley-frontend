# HaleyOS Universal Theme System

## Overview

This document describes the single source of truth for all UI theming in HaleyOS modules.

**The golden rule: Never use raw color classes like `bg-white`, `text-gray-400`, `bg-gray-800`, etc.**

## File Structure

```
src/
├── styles/
│   ├── globals.css          # CSS variables (light/dark mode)
│   └── module-theme.ts      # Component classes (IMPORT FROM HERE)
├── components/
│   └── modules/
│       └── theme.ts         # Legacy re-export (deprecated, use module-theme.ts)
```

## Quick Start

```tsx
// In any module component:
import theme, { cx, components, colors } from '@/styles/module-theme';

function MyModule() {
  return (
    <div className={theme.layout.module}>
      <header className={theme.layout.header}>
        <h1 className={colors.text.primary}>Title</h1>
      </header>
      
      <div className={theme.layout.content}>
        <input className={components.input.base} placeholder="Enter text" />
        <button className={components.button.primary}>Submit</button>
      </div>
    </div>
  );
}
```

## Available Classes

### Layout

| Class | Usage |
|-------|-------|
| `theme.layout.module` | Outer container for entire module |
| `theme.layout.header` | Module header with bottom border |
| `theme.layout.content` | Scrollable content area |
| `theme.layout.footer` | Module footer with top border |
| `theme.layout.section` | Section with vertical spacing |

### Inputs

| Class | Usage |
|-------|-------|
| `components.input.base` | Standard input (text, email, etc.) |
| `components.input.sm` | Small input |
| `components.input.lg` | Large input |
| `components.select` | Select dropdown |
| `components.textarea` | Multi-line textarea |

### Buttons

| Class | Usage |
|-------|-------|
| `components.button.primary` | Primary action button |
| `components.button.secondary` | Secondary action button |
| `components.button.ghost` | Minimal/text button |
| `components.button.danger` | Destructive action |
| `components.button.success` | Success/confirm action |
| `components.button.icon` | Icon-only button |

### Cards

| Class | Usage |
|-------|-------|
| `components.card.base` | Standard card |
| `components.card.elevated` | Card with shadow |
| `components.card.interactive` | Clickable card with hover |

### Colors (for custom styling)

| Class | Usage |
|-------|-------|
| `colors.bg.page` | Page background |
| `colors.bg.panel` | Card/panel background |
| `colors.bg.input` | Input background |
| `colors.bg.hover` | Hover state |
| `colors.text.primary` | Main text |
| `colors.text.secondary` | Secondary text |
| `colors.text.muted` | Placeholder/hint text |
| `colors.border.default` | Standard border |

## Utility Functions

### `cx()` - Class Concatenation

```tsx
import { cx } from '@/styles/module-theme';

// Combine classes, filtering out falsy values
<div className={cx(
  'base-class',
  isActive && 'active-class',
  !disabled && 'enabled-class'
)} />
```

### `variant()` - Variant Selection

```tsx
import { variant, components } from '@/styles/module-theme';

// Select a variant from a set
<button className={variant(components.button, isLoading ? 'secondary' : 'primary')} />
```

## Migration Guide

### Before (Wrong)

```tsx
// ❌ DON'T DO THIS
<input className="bg-white text-gray-900 border border-gray-300" />
<button className="bg-blue-500 hover:bg-blue-600 text-white" />
<div className="bg-gray-800 text-gray-100" />
```

### After (Correct)

```tsx
// ✅ DO THIS
import { components } from '@/styles/module-theme';

<input className={components.input.base} />
<button className={components.button.primary} />
<div className="bg-panel-dark text-text-primary" />
```

## Search & Replace Cheatsheet

Run these replacements across all module files:

| Find | Replace |
|------|---------|
| `bg-white` | `bg-panel-dark` |
| `bg-gray-50` | `bg-panel-dark` |
| `bg-gray-100` | `bg-panel-medium` |
| `bg-gray-200` | `bg-panel-light` |
| `bg-gray-700` | `bg-panel-medium` |
| `bg-gray-800` | `bg-panel-dark` |
| `bg-gray-900` | `bg-panel-dark` |
| `text-white` | `text-text-primary` |
| `text-gray-100` | `text-text-primary` |
| `text-gray-200` | `text-text-primary` |
| `text-gray-300` | `text-text-secondary` |
| `text-gray-400` | `text-text-secondary` |
| `text-gray-500` | `text-text-secondary` |
| `text-gray-600` | `text-text-secondary` |
| `text-gray-900` | `text-text-primary` |
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-border` |
| `border-gray-600` | `border-border` |
| `border-gray-700` | `border-border` |
| `bg-background` | `bg-panel-dark` |
| `text-foreground` | `text-text-primary` |
| `text-muted-foreground` | `text-text-secondary` |

## CSS Variables Reference

These are defined in `globals.css` and automatically switch between light/dark mode:

```css
/* Dark Mode (Default) */
--primary: #2d6ba8;
--accent: #4c82c0;
--panel-dark: #111418;
--panel-medium: #1a1e22;
--panel-light: #22262b;
--text-primary: #e5f2ff;
--text-secondary: #a7b7c9;
--border: #2c3339;
--error: #ff6b6b;
--success: #4fe0b0;

/* Light Mode */
--primary: #4B6CFF;
--panel-dark: #FFFFFF;
--panel-medium: #FFFFFF;
--panel-light: #F5F5F5;
--text-primary: #1A1A1A;
--text-secondary: #666666;
--border: #E0E0E0;
```

## Validation

To check for theme violations, run:

```bash
grep -rn --include="*.tsx" \
  "bg-white\|bg-gray-\|text-gray-\|border-gray-\|bg-background\|text-foreground\|text-muted-foreground" \
  src/components/modules/
```

Any matches are violations that need to be fixed.

## Questions?

If you need a new color or component style, ADD IT TO `module-theme.ts` FIRST, then use it. Never add raw color values directly to components.
