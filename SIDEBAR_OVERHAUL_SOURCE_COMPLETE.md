# HALEY FRONTEND - SIDEBAR OVERHAUL V1
## Complete Source Code Drop

**Module**: frontend_sidebar_overhaul_v1  
**Target**: Desktop Only  
**Date**: December 10, 2025  

---

## IMPLEMENTATION REQUIREMENTS SUMMARY

### 1. Remove Hamburger Menu (Desktop Only)
- **Current**: Visible on all devices
- **Required**: Hidden on desktop (>768px), visible on mobile
- **Location**: ChatHeader.tsx line 45-51

### 2. Sidebar Collapse Behavior  
- **Current**: Arrow exists but needs proper full-collapse
- **Required**: Arrow collapses ENTIRE sidebar (ChatGPT-style)
- **Location**: Sidebar.tsx lines 90-96

### 3. Add Haley Quick Launch Button
- **Placement**: Between "New Chat" and "The Seven" section
- **Properties**:
  - Label: "Haley"
  - Icon: Sparkle or star
  - Theme: Destroyer Gray
  - Action: Switch to Baby Haley mode (does NOT start new chat)
  - Always visible: true

### 4. Justice Color Coding & Theme
- **Current Colors Need Update**:
  - Gemini: yellow → **teal**
  - GPT: green → **blue**
  - Claude: red → **orange**
  - Perplexity: cyan → **purple**
  - Meta: purple → **gold**
  - Mistral: blue → (keep or adjust)
  - Grok: pink → **red**

- **Indicator Dots**: Each justice has colored dot with glow effect
- **Theme Hue**: Apply at 20% opacity to:
  - Sidebar background
  - Sidebar icons
  - New chat button
  - Top bar name label
  - Header highlights

### 5. Top Bar Name Switching
- **Current**: Always shows "Haley"
- **Required**: Show selected justice name
  - "Claude" when Claude selected
  - "GPT" when GPT selected
  - "Haley" when no justice selected
- **Location**: ChatHeader.tsx line 55

### 6. Conversation Switching Per Justice
- **Required**: Each justice maintains separate conversation history
- **Behavior**: 
  - Load justice-specific history on selection
  - Preserve state when switching away
- **Location**: page.tsx handleJusticeSelect (line 230)

---

## FILE STRUCTURE

```
src/
├── components/
│   ├── Sidebar.tsx              ⭐ PRIMARY TARGET
│   ├── ChatHeader.tsx           🎯 TOP BAR UPDATE
│   ├── AISwitcher.tsx
│   ├── ChatInput.tsx
│   ├── ChatInputBar.tsx
│   ├── ChatMessages.tsx
│   └── ...
├── hooks/
│   ├── useDeviceDetection.ts    📱 DEVICE DETECTION
│   └── useLongPress.ts
├── lib/
│   ├── authContext.tsx
│   ├── firebaseClient.ts
│   └── haleyApi.ts
├── styles/
│   └── globals.css              🎨 THEME SYSTEM
├── types/
│   └── index.ts                 📝 TYPE DEFINITIONS
└── app/
    ├── page.tsx
    └── chat/
        └── page.tsx             🔧 INTEGRATION POINT
```

---

## COMPLETE SOURCE CODE

### 1. src/components/Sidebar.tsx
**Purpose**: Main sidebar component with justice selection, conversation history, and settings

```typescript
'use client';

import { useState } from 'react';
import {
  X,
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  History,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Users,
  User,
} from 'lucide-react';
import type { ConversationHistory } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  conversations?: ConversationHistory[];
  currentConversationId?: string;
  onNewConversation?: () => void;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  activeJustice?: string | null;
  onSelectJustice?: (justice: string) => void;
  userEmail?: string;
  userPhotoURL?: string;
}

const THE_SEVEN = [
  { id: 'gemini', name: 'Gemini', color: 'hue-yellow' },
  { id: 'gpt', name: 'GPT', color: 'hue-green' },
  { id: 'claude', name: 'Claude', color: 'hue-red' },
  { id: 'llama', name: 'Meta', color: 'hue-purple' },
  { id: 'perplexity', name: 'Perplexity', color: 'hue-cyan' },
  { id: 'mistral', name: 'Mistral', color: 'hue-blue' },
  { id: 'grok', name: 'Grok', color: 'hue-pink' },
];

export default function Sidebar({
  isOpen,
  onClose,
  onSignOut,
  conversations = [],
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  activeJustice,
  onSelectJustice,
  userEmail = 'user@example.com',
  userPhotoURL,
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [theSevenCollapsed, setTheSevenCollapsed] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleJusticeSelect = (justiceId: string) => {
    if (onSelectJustice) {
      onSelectJustice(justiceId);
    }
  };

  return (
    <>
      {/* Overlay - Mobile only */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-80 glass-strong border-r border-border z-50 transform transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Collapse Button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-bold text-gradient">HaleyOS</h2>
            <button 
              onClick={onClose} 
              className="icon-btn"
              title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {/* New Conversation Button */}
          <div className="p-4">
            <button
              onClick={onNewConversation}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span>New Chat</span>
            </button>
          </div>

          {/* The Seven Section - Collapsible */}
          <div className="px-4 mb-4">
            <button
              onClick={() => setTheSevenCollapsed(!theSevenCollapsed)}
              className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-secondary hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>The Seven</span>
              </div>
              {theSevenCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {!theSevenCollapsed && (
              <div className="space-y-2">
                {THE_SEVEN.map((justice) => (
                  <button
                    key={justice.id}
                    onClick={() => handleJusticeSelect(justice.id)}
                    className={`w-full p-2 rounded-lg border transition-all text-left text-sm ${
                      activeJustice === justice.id
                        ? `${justice.color} bg-primary/20 border-primary text-primary`
                        : 'bg-panel-dark border-border text-secondary hover:border-accent hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{justice.name}</span>
                      {activeJustice === justice.id && (
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-2">
            <h3 className="text-sm font-semibold text-secondary mb-2 sticky top-0 bg-panel-dark py-2">
              Recent Chats
            </h3>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <History size={48} className="mx-auto text-secondary opacity-50 mb-3" />
                <p className="text-secondary text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative rounded-lg border transition-all cursor-pointer ${
                    conv.id === currentConversationId
                      ? 'bg-primary/20 border-primary'
                      : 'bg-panel-medium border-border hover:border-accent'
                  }`}
                  onClick={() => onSelectConversation?.(conv.id)}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare size={16} className="mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate mb-1">
                          {conv.title}
                        </h3>
                        <p className="text-xs text-secondary truncate">
                          {conv.lastMessage}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-secondary">
                          <span>{conv.messageCount} messages</span>
                          <span>•</span>
                          <span>{formatDate(conv.timestamp)}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation?.(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity icon-btn !w-6 !h-6"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Google Account Chip */}
          <div className="border-t border-border p-4 space-y-2">
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
              >
                {userPhotoURL ? (
                  <img 
                    src={userPhotoURL} 
                    alt="User" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User size={18} />
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-primary truncate">{userEmail}</div>
                </div>
                <ChevronRight size={16} className={`transition-transform ${showAccountMenu ? 'rotate-90' : ''}`} />
              </button>

              {showAccountMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 glass-strong rounded-xl border border-border p-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setShowAccountMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                  >
                    <Settings size={18} />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      onSignOut();
                      setShowAccountMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/20 text-error transition-colors text-left"
                  >
                    <LogOut size={18} />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gradient">Settings</h2>
            <button onClick={onClose} className="icon-btn"><X size={24} /></button>
          </div>
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">General</h3>
              <div className="space-y-3">
                <SettingRow label="Auto-scroll" type="toggle" />
                <SettingRow label="Sound effects" type="toggle" />
                <SettingRow label="Haptic feedback" type="toggle" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, type, options }: { label: string; type: 'toggle' | 'select' | 'slider'; options?: string[] }) {
  const [value, setValue] = useState(type === 'toggle' ? false : options?.[0] || '');
  if (type === 'toggle') {
    return (
      <div className="flex items-center justify-between p-3 bg-panel-dark rounded-lg">
        <span className="text-sm">{label}</span>
        <div className={`toggle-switch ${value ? 'active' : ''}`} onClick={() => setValue(!value)}>
          <div className="toggle-knob" />
        </div>
      </div>
    );
  }
  return <div className="p-3 bg-panel-dark rounded-lg"><span className="text-sm">{label}</span></div>;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}
```

---

### 2. src/components/ChatHeader.tsx
**Purpose**: Top bar with hamburger menu and title display

```typescript
'use client';

import { Microscope, Puzzle, Menu } from 'lucide-react';
import { useState } from 'react';
import type { SystemStatus, AIMode } from '@/types';

interface ChatHeaderProps {
  aiMode: AIMode;
  activeModels: string[];
  activeJustice: string | null;
  onToggleResearch: () => void;
  onToggleSidebar: () => void;
  onOpenMagicWindow: () => void;
  systemStatus: SystemStatus | null;
  researchEnabled: boolean;
  logicEngineEnabled: boolean;
  onToggleLogicEngine: () => void;
}

export default function ChatHeader({
  aiMode,
  activeModels,
  activeJustice,
  onToggleResearch,
  onToggleSidebar,
  onOpenMagicWindow,
  systemStatus,
  researchEnabled,
  logicEngineEnabled,
  onToggleLogicEngine,
}: ChatHeaderProps) {
  // Get AI mode color hue
  const getAIHue = () => {
    if (activeJustice === 'gemini') return 'hue-yellow';
    if (activeJustice === 'claude') return 'hue-red';
    if (activeJustice === 'gpt') return 'hue-green';
    if (aiMode === 'supreme-court') return 'hue-purple';
    return '';
  };

  return (
    <header className={`glass-strong border-b border-border safe-top ${getAIHue()}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Hamburger Menu */}
        <button
          onClick={onToggleSidebar}
          className="icon-btn"
          title="Toggle sidebar"
        >
          <Menu size={24} />
        </button>

        {/* Center: Haley Title */}
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold text-gradient">Haley</h1>
        </div>

        {/* Right: Microscope and Puzzle Piece */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleResearch}
            className={`icon-btn ${researchEnabled ? 'bg-primary/20 text-primary' : ''}`}
            title="Toggle Research Mode"
          >
            <Microscope size={24} />
          </button>
          <button
            onClick={onToggleLogicEngine}
            className={`icon-btn ${logicEngineEnabled ? 'bg-primary/20 text-primary' : ''}`}
            title="Toggle Logic Engine"
          >
            <Puzzle size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

### 3. src/types/index.ts
**Purpose**: TypeScript type definitions for the application

```typescript
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  operation?: string;
  state_changed?: boolean;
  mama_invoked?: boolean;
  baby_invoked?: boolean;
  syscalls?: number;
  model_used?: string;
  task?: string;
  llm_sources?: string[];
  confidence?: number;
  supreme_court?: boolean;
}

export interface SystemStatus {
  os: string;
  kernel_status: {
    kernel: string;
    syscalls: number;
    processes: number;
    modules: number;
    memory_keys: number;
  };
  baby_pid: number;
  note: string;
  active_llms?: string[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon?: string;
  enabled: boolean;
}

export type AIMode = 'single' | 'multi' | 'supreme-court';

export interface ChatSettings {
  selectedModels: string[];
  mode: AIMode;
  researchEnabled: boolean;
  logicEngineEnabled: boolean;
  voiceEnabled: boolean;
  autoScroll: boolean;
}

export interface DeviceProfile {
  type: 'phone' | 'tablet' | 'desktop';
  width: number;
  height: number;
  touchEnabled: boolean;
}

export interface ThemeConfig {
  background: string;
  colors: {
    primary: string;
    accent: string;
    panelDark: string;
    panelMedium: string;
    panelLight: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
  };
}

export interface MagicWindowContent {
  type: 'visualization' | 'code' | 'image' | 'data';
  content: any;
  title?: string;
}

export interface ConversationHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}
```

---

### 4. src/hooks/useDeviceDetection.ts
**Purpose**: Detect device type for responsive behavior

```typescript
import { useState, useEffect } from 'react';
import type { DeviceProfile } from '@/types';

export function useDeviceDetection(): DeviceProfile {
  const [device, setDevice] = useState<DeviceProfile>({
    type: 'desktop',
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    touchEnabled: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      let type: 'phone' | 'tablet' | 'desktop' = 'desktop';
      
      if (width <= 768) {
        type = 'phone';
      } else if (width <= 1024) {
        type = 'tablet';
      }

      setDevice({
        type,
        width,
        height,
        touchEnabled,
      });
    };

    detectDevice();

    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return device;
}
```

---

### 5. src/styles/globals.css (Key Theme Sections)
**Purpose**: Global styles including theme hues for justice selection

```css
/* AI SELECTION HUE OVERLAYS (VERY SOFT) */
.hue-yellow {
  background: linear-gradient(to bottom, rgba(255, 235, 59, 0.03), transparent) !important;
}

.hue-red {
  background: linear-gradient(to bottom, rgba(244, 67, 54, 0.03), transparent) !important;
}

.hue-green {
  background: linear-gradient(to bottom, rgba(76, 175, 80, 0.03), transparent) !important;
}

.hue-blue {
  background: linear-gradient(to bottom, rgba(33, 150, 243, 0.03), transparent) !important;
}

.hue-purple {
  background: linear-gradient(to bottom, rgba(156, 39, 176, 0.03), transparent) !important;
}

.hue-pink {
  background: linear-gradient(to bottom, rgba(233, 30, 99, 0.03), transparent) !important;
}

.hue-cyan {
  background: linear-gradient(to bottom, rgba(0, 188, 212, 0.03), transparent) !important;
}

/* GLASS EFFECTS */
.glass-strong {
  background: rgba(17, 20, 24, 0.9);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border);
}

/* BUTTON STYLES */
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 20px rgba(45, 107, 168, 0.3);
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: var(--panel-light);
  color: var(--primary);
}
```

---

## INTEGRATION POINT: src/app/chat/page.tsx

**Key sections for sidebar integration**:

```typescript
// Line 22-30: Sidebar state management
const [sidebarOpen, setSidebarOpen] = useState(false);

useEffect(() => {
  if (device.type === 'desktop') {
    setSidebarOpen(true);
  }
}, [device.type]);

// Line 35: Active justice state
const [activeJustice, setActiveJustice] = useState<string | null>(null);

// Line 230-236: Justice selection handler
const handleJusticeSelect = (justice: string) => {
  setActiveJustice(justice);
  setAiMode('single');
  
  // Load justice-specific conversation history
  console.log(`Switched to ${justice} - loading conversation history`);
};

// Line 299-311: Sidebar component usage
<Sidebar
  isOpen={sidebarOpen}
  onClose={() => setSidebarOpen(!sidebarOpen)}
  onSignOut={signOut}
  conversations={conversations}
  currentConversationId={currentConversationId}
  onNewConversation={handleNewConversation}
  onSelectConversation={setCurrentConversationId}
  activeJustice={activeJustice}
  onSelectJustice={handleJusticeSelect}
  userEmail={user.email || undefined}
  userPhotoURL={user.photoURL || undefined}
/>

// Line 318-328: Header integration
<ChatHeader
  aiMode={aiMode}
  activeModels={activeJustice ? [activeJustice] : ['Haley']}
  activeJustice={activeJustice}
  onToggleResearch={() => setResearchEnabled(!researchEnabled)}
  onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
  onOpenMagicWindow={() => setMagicWindowOpen(!magicWindowOpen)}
  systemStatus={systemStatus}
  researchEnabled={researchEnabled}
  logicEngineEnabled={logicEngineEnabled}
  onToggleLogicEngine={() => setLogicEngineEnabled(!logicEngineEnabled)}
/>
```

---

## CHANGE CHECKLIST

### ✅ MUST IMPLEMENT:

1. **Desktop Hamburger Removal**
   - [ ] Add `hidden md:block` to hamburger button in ChatHeader.tsx
   - [ ] Keep visible on mobile (`<768px`)

2. **Sidebar Collapse Arrow**
   - [ ] Make collapse arrow actually collapse sidebar on desktop
   - [ ] Update `onClose` prop behavior

3. **Haley Quick Launch Button**
   - [ ] Add Sparkle icon import
   - [ ] Insert button between New Chat and The Seven
   - [ ] Style with destroyer gray theme
   - [ ] Wire up to switch mode without new chat

4. **Justice Color Updates**
   - [ ] Update THE_SEVEN colors array
   - [ ] Add new hue classes to globals.css
   - [ ] Implement 20% opacity theme propagation

5. **Top Bar Name Switching**
   - [ ] Update ChatHeader to show active justice name
   - [ ] Conditional rendering based on activeJustice prop

6. **Conversation Per Justice**
   - [ ] Create conversation storage per justice ID
   - [ ] Load appropriate history on justice switch
   - [ ] Preserve state when switching away

7. **Indicator Dots with Glow**
   - [ ] Add CSS for glowing dots
   - [ ] Apply color-coded dots per justice
   - [ ] Animate on selection

---

## TESTING REQUIREMENTS

### Desktop Tests:
- [ ] Sidebar opens by default on >768px
- [ ] Hamburger menu hidden on desktop
- [ ] Collapse arrow works properly
- [ ] Haley button visible and functional
- [ ] Justice selection changes theme hue
- [ ] Top bar name updates correctly
- [ ] Conversation history per justice works

### Mobile Tests:
- [ ] Hamburger menu visible on <768px
- [ ] Sidebar slides in/out properly
- [ ] Touch interactions work
- [ ] Theme switching works
- [ ] All buttons accessible

---

## COLOR REFERENCE

**New Justice Colors (per spec)**:
- Gemini: `#00BCD4` (teal/cyan)
- GPT: `#2196F3` (blue)
- Claude: `#FF9800` (orange)
- Perplexity: `#9C27B0` (purple)
- Meta: `#FFD700` (gold)
- Mistral: `#2196F3` (blue)
- Grok: `#F44336` (red)

**Opacity**: 20% (0.20) for theme hue overlays

---

END OF SOURCE DROP
