# UI State Persistence - Testing Guide

## Quick Test Script

### Test 1: Sidebar State Persistence
```
1. Open HaleyOS on desktop
2. Verify sidebar is open by default
3. Click collapse button (chevron left icon)
4. Verify sidebar collapses to mini mode
5. Refresh the page (F5 or Cmd+R)
6. ✅ PASS: Sidebar remains in mini mode
7. Click expand button (H logo)
8. Verify sidebar expands to full mode
9. Refresh the page
10. ✅ PASS: Sidebar remains expanded
```

### Test 2: Justices Panel State Persistence
```
1. Open HaleyOS
2. Verify "The Seven" section is expanded (showing all 7 justices)
3. Click the "The Seven" header to collapse
4. Verify the panel collapses (shows only header with chevron right)
5. Refresh the page
6. ✅ PASS: "The Seven" remains collapsed
7. Click the header to expand
8. Verify all 7 justices are visible
9. Refresh the page
10. ✅ PASS: "The Seven" remains expanded
```

### Test 3: Cross-Session Persistence
```
1. Open HaleyOS in Chrome
2. Collapse sidebar and collapse "The Seven"
3. Close the browser completely
4. Reopen Chrome and navigate to HaleyOS
5. ✅ PASS: Both states are preserved (sidebar collapsed, Justices collapsed)
```

### Test 4: New Tab Behavior
```
1. Open HaleyOS in a tab
2. Set sidebar to collapsed, "The Seven" to collapsed
3. Open HaleyOS in a new tab (Cmd+T or Ctrl+T)
4. ✅ PASS: New tab opens with same states (sidebar collapsed, Justices collapsed)
```

### Test 5: Mobile Behavior
```
1. Open HaleyOS on mobile or resize browser to mobile width (<768px)
2. Open sidebar using hamburger menu
3. Expand or collapse "The Seven"
4. Refresh page
5. ✅ PASS: Justices state persists (sidebar closes on mobile by default)
```

### Test 6: localStorage Inspection
```
1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage → [your domain]
3. Look for keys:
   - haley_sidebarCollapsed
   - haley_justicesExpanded
4. Toggle sidebar and Justices panel
5. ✅ PASS: Values update in real-time (true/false)
```

### Test 7: Default State (First Visit)
```
1. Open DevTools → Application → Local Storage
2. Delete haley_sidebarCollapsed and haley_justicesExpanded keys
3. Refresh the page
4. ✅ PASS: Sidebar is open on desktop, "The Seven" is expanded
```

### Test 8: Private/Incognito Mode
```
1. Open HaleyOS in private/incognito window
2. Toggle sidebar and Justices panel
3. Refresh page (don't close window)
4. ✅ PASS: States persist within the incognito session
5. Close incognito window and reopen
6. ✅ EXPECTED: States reset (incognito clears on close)
```

## Manual localStorage Testing

### View Current State
```javascript
// Open browser console (F12)
console.log('Sidebar collapsed:', localStorage.getItem('haley_sidebarCollapsed'));
console.log('Justices expanded:', localStorage.getItem('haley_justicesExpanded'));
```

### Set States Manually
```javascript
// Force sidebar to be collapsed
localStorage.setItem('haley_sidebarCollapsed', 'true');

// Force Justices to be collapsed (expanded = false)
localStorage.setItem('haley_justicesExpanded', 'false');

// Refresh to see changes
location.reload();
```

### Clear States (Reset to Defaults)
```javascript
// Clear both states
localStorage.removeItem('haley_sidebarCollapsed');
localStorage.removeItem('haley_justicesExpanded');

// Refresh to see defaults
location.reload();
```

### Test Invalid Data
```javascript
// Set invalid JSON
localStorage.setItem('haley_sidebarCollapsed', 'invalid');
localStorage.setItem('haley_justicesExpanded', 'invalid');

// Refresh - should handle gracefully and use defaults
location.reload();

// Check console for errors (should have none)
```

## Automated Test Suite

### Jest Test Template
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ChatPage from '@/app/chat/page';

describe('UI State Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('sidebar state persists after toggle', () => {
    // Mock desktop device
    const { rerender } = render(<ChatPage />);
    
    // Initial state: sidebar open on desktop
    expect(localStorage.getItem('haley_sidebarCollapsed')).toBe('false');
    
    // Toggle sidebar
    const collapseBtn = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseBtn);
    
    // Check localStorage updated
    expect(localStorage.getItem('haley_sidebarCollapsed')).toBe('true');
    
    // Simulate page reload
    rerender(<ChatPage />);
    
    // Verify state persisted
    expect(localStorage.getItem('haley_sidebarCollapsed')).toBe('true');
  });

  test('justices panel state persists after toggle', () => {
    render(<ChatPage />);
    
    // Initial state: expanded
    expect(localStorage.getItem('haley_justicesExpanded')).toBe('true');
    
    // Click collapse
    const collapseBtn = screen.getByText('The Seven');
    fireEvent.click(collapseBtn);
    
    // Check localStorage updated
    expect(localStorage.getItem('haley_justicesExpanded')).toBe('false');
  });

  test('uses defaults when localStorage is empty', () => {
    render(<ChatPage />);
    
    // On first visit, should use defaults
    // Desktop: sidebar open, Justices expanded
    expect(localStorage.getItem('haley_sidebarCollapsed')).toBe('false');
    expect(localStorage.getItem('haley_justicesExpanded')).toBe('true');
  });
});
```

## Common Issues & Troubleshooting

### Issue: State not persisting
**Symptoms**: Toggles work but don't persist after refresh
**Checks**:
- [ ] Browser DevTools → Application → Local Storage is not disabled
- [ ] Check browser privacy settings (localStorage enabled?)
- [ ] Console shows no localStorage errors
- [ ] Correct keys being used (`haley_sidebarCollapsed`, `haley_justicesExpanded`)

**Fix**:
```javascript
// Test localStorage is working
localStorage.setItem('test', 'hello');
console.log(localStorage.getItem('test')); // Should print 'hello'
localStorage.removeItem('test');
```

### Issue: UI flickers on load
**Symptoms**: Brief flash of wrong state before correct state appears
**Cause**: State initialized after first render
**Current Solution**: We use lazy initialization to prevent this

**Verify Fix**:
```typescript
// Check that useState uses function initialization
const [state, setState] = useState(() => {
  // This runs before first render
  return readFromLocalStorage();
});
```

### Issue: States conflict between tabs
**Symptoms**: Opening new tab shows different state than expected
**Cause**: localStorage is per-domain, shared between tabs
**Expected Behavior**: All tabs should sync to same state
**Note**: This is correct behavior - localStorage shares across tabs

### Issue: Mobile sidebar doesn't persist
**Symptoms**: Mobile sidebar always closes on refresh
**Expected Behavior**: 
- Mobile sidebar overlay should close on refresh (design choice)
- Justices panel state should still persist on mobile
**Verify**: Check that only Justices state persists on mobile, not sidebar overlay

## Regression Testing

After any changes to state management, run this checklist:

### Core Functionality
- [ ] Sidebar toggles correctly
- [ ] Justices panel toggles correctly
- [ ] Both states persist across refresh
- [ ] Both states persist across browser restart
- [ ] Default states correct on first visit

### Edge Cases
- [ ] Works in private/incognito mode
- [ ] Handles missing localStorage gracefully
- [ ] Handles corrupted localStorage data
- [ ] No console errors
- [ ] No TypeScript errors

### UI/UX
- [ ] No UI flicker on page load
- [ ] No layout shift when states apply
- [ ] Smooth transitions maintained
- [ ] Mini sidebar works correctly
- [ ] Mobile overlay behavior correct

### Performance
- [ ] No noticeable delay on page load
- [ ] No excessive localStorage reads/writes
- [ ] State updates are instantaneous

## Success Criteria Summary

All tests should pass with these results:
- ✅ Sidebar collapsed state persists after refresh
- ✅ Sidebar expanded state persists after refresh  
- ✅ Justices collapsed state persists after refresh
- ✅ Justices expanded state persists after refresh
- ✅ No UI flicker or relayout on load
- ✅ No interference with other modules

---

**Last Updated**: December 2024
**Module Version**: ui_state_persistence_v1
