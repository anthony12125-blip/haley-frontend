# Changes Made - Justice to Model Renaming

## Summary
Removed all "justice" terminology related to AI model selection and replaced with standard "model" naming.

**Note:** The Supreme Court voting system in the backend is SEPARATE and unchanged. This only affects the UI for selecting which AI model to chat with.

## Frontend Changes

### Files Modified:
1. **src/components/ModeSelector.tsx**
   - `activeJustice` → `activeModel`
   - `onSelectJustice` → `onSelectModel`
   - `THE_SEVEN_JUSTICES` → `AVAILABLE_AI_MODELS`
   - UI text "The Seven" → "AI Models"

2. **src/components/Sidebar.tsx**
   - All justice props renamed to model
   - `THE_SEVEN` → `AI_MODELS`
   - `theSevenCollapsed` → `aiModelsCollapsed`
   - LocalStorage keys updated
   - UI text updated to "AI Models"

3. **src/components/ChatHeader.tsx**
   - `activeJustice` → `activeModel`
   - Updated all references in color/name logic

4. **src/app/page.tsx** & **src/app/chat/page.tsx**
   - `activeJustice` state → `activeModel`
   - `handleJusticeSelect` → `handleModelSelect`
   - All prop passing updated

5. **src/lib/haleyApi.ts** ⭐ **CRITICAL BUG FIX**
   - Added `provider` parameter to `sendMessage()` function
   - This was the main bug - the parameter was never being sent!
   - Now properly sends provider to backend in payload

## What Still Uses "Justice"?
- Module-Matrix's Supreme Court module (internal voting system - NOT related to AI models)
- This is intentional and a separate architectural feature

## Environment Variables
No changes needed to environment variables. The variable names like `GEMINI_API_KEY`, `MISTRAL_API_KEY` etc. are already standard.

## Testing
1. Select a model from the sidebar (e.g., Mistral)
2. Send a message
3. Backend should route to the selected provider
4. Check browser console - should see provider being sent in request payload
