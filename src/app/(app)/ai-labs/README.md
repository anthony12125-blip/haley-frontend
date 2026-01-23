# AI Labs Module Template

All AI Labs pages inherit the shared app layout from `(app)/layout.tsx` which provides:
- Sidebar with navigation and token counter
- Authentication check
- Space background with stars
- Responsive layout handling

## Page Structure

AI Labs pages should NOT include:
- `full-screen` wrapper
- `space-bg` background
- Standalone header with "Back to Haley" button
- `HaleyCoreGlyph` in header
- `ArrowLeft` navigation

AI Labs pages SHOULD use this structure:

```tsx
'use client';

import { useState } from 'react';
// ... other imports (NO ArrowLeft, NO HaleyCoreGlyph)

export default function YourModulePage() {
  // ... state and logic

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              {/* Your module icon here */}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Your Module Name
          </h1>
          <p className="text-secondary">
            Module description
          </p>
        </div>

        {/* Your module content here */}
        
      </div>
    </div>
  );
}
```

## Key Points

1. The outer div uses `flex-1 flex flex-col overflow-y-auto p-8`
2. Content is wrapped in `max-w-Xxl mx-auto` for centering
3. No navigation - Sidebar handles that
4. No authentication - Layout handles that
5. No background - Layout handles that
