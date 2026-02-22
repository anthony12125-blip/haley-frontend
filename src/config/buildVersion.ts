export const BUILD_VERSION = 117;
// Build 117: Fix animation on old messages - only show streaming animation for new messages with metadata.streaming=true, not bulk-loaded history
// Build 116: Load conversation provider - when selecting a saved conversation, set activeModel from conversation's provider field
// Build 115: Chat persistence fix - pass real userId and conversationId to backend instead of hardcoded 'user'/'default'
// Build 114: State persistence system - OS state saved to Firestore, restored on browser refresh (open modules, nav history, conversation)
// Build 113: Feedback system - FeedbackAdminDashboard, ModuleFeedbackButton, ModuleFeedbackWrapper components
// Build 112: Legal Workflow module - case management, 6-phase delta workflow, multi-LLM verification, FOIA/subpoena generation, conflict checks
// Build 111: LLM fixes - GPT max_tokens 4096, added XAI_API_KEY and TOGETHER_API_KEY env vars
// Build 110: Process Management Phase 2 Complete - Tab styling (40px, rounded-t-lg), process count badge on dashboard icon, truncated tab names
// Build 109: Tab bar UI - ProcessTabBar shows running processes, nav history stack for back button, Haley name = home button, removed long-press switcher
// Build 108: Fix process persistence - back button now backgrounds (not kills) processes, added debug logging to all syscalls
// Build 107: Process Management Phase 2 - ProcessSwitcher component, running indicator dots on module icons, long-press to open switcher, swipe-to-kill, Close All button
// Build 106: Process Management System Phase 1 - ProcessProvider with process table, syscalls (spawn, foreground, background, kill, killAll, updateContext), chat as PID 0 with system priority
// Build 105: CRM Dashboard launch icon - contacts, deals, pipelines, activities UI
// Build 104: CRM Module - Full CRUD for contacts, deals, pipelines, activities with DKRP zero tolerance verification
// Build 103: Fix Dashboard tooltip z-index - tooltips now render above all module cards
// Build 102: AI Photo Studio module - enhance, background removal, retouch, upscale (Replicate API integration)
// Build 66-69: Internal development
// Build 70: DKRP Sentinel Verification + Token Balance UI + Stripe Checkout
// Build 71: Add BuyTokensModal component with token packages and provider costs
// Build 72: Update BuyTokensModal to show token amounts with Popular label
// Build 73: Replace old BuyCreditsModal in TokenBalance with new token-based modal
// Build 74: Change sidebar/balance display from dollars to tokens
// Build 75: R&D Soundboard uses Baby Haley only - no external LLM calls
// Build 76: Revert R&D to working state - use sendMessage via haleyApi
// Build 77: Fix R&D Soundboard flow - add Delta generation after questions phase
// Build 78: R&D Soundboard Development Phase - Delta routing (llm/human), blocking dependencies, building UI
// Build 79: Add Idea Harvester to AI Labs - one-session replication pipeline for AI product posts
// Build 80: Add Roblox Expert to AI Labs - describe scenes, get Lua code and preview
// Build 81: Upgrade Roblox Expert preview to 3D Three.js renderer with orbit controls
// Build 82: Add Engineering Agent + API Keys Manager to AI Labs
// Build 83: Fix fixed elements overlapping sidebar + smooth navigation (useMemo stars, remove page backgrounds)
// Build 84: Fix duplicate Sidebar - layout only renders for non-main-chat pages, add stopPropagation to AI Labs buttons
// Build 85: One Sidebar - removed duplicate from page.tsx, layout.tsx is single source of truth
// Build 86: Remove nested layout wrapper from page.tsx - content only, no duplicate full-screen/space-bg/margins
// Build 87: Fix full page reload on navigation - delete duplicate /app/page.tsx, all routes now use (app) layout
// Build 88: Add diagnostic console.logs to trace navigation issue - [ChatPage], [ApiKeysPage], [Sidebar], [Layout]
// Build 89: Fix navigation - onSelectModel/onSelectConversation no longer navigate to /, only onNewConversation does
// Build 90: STATE-BASED MODULE SWITCHING - No more route changes! Modules render inside page.tsx based on activeModule state.
// Build 91: Add universal back button in ChatHeader + clicking Haley/models exits modules
// Build 92: Header shows Haley when in modules + scrollable AI Models list (max-h-64)
// Build 93: Dashboard launcher - iOS-style module grid replaces sidebar AI Labs
// Build 94: (skipped)
// Build 95: Dashboard background solid with space-bg stars, no transparency
// Build 96: Sidebar height fix - h-dvh + overflow handling for all viewports
// Build 97: Dashboard launch icons - header icon (desktop) + FAB (mobile)
// Build 98: Dashboard redesign - remove categories, drag-to-reorder active modules, localStorage persistence
// Build 99: Fix Multi-LLM fan-out - connect onMultiLLMChange prop to Sidebar
// Build 100: Fix Haley mode - allow null activeModel, use 'haley' provider, persist selection across refresh
