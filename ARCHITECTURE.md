# HaleyOS Frontend - Component Architecture

## 🏗️ Component Hierarchy

```
App (layout.tsx)
└── AuthProvider
    ├── HomePage (landing)
    │   └── Hero + Sign In
    │
    └── ChatPage (main interface)
        ├── SpaceBackground (CSS layer)
        │   ├── Animated Stars
        │   └── Shooting Stars
        │
        ├── AISwitcher (floating, top-center)
        │   ├── AI Mode Bubble
        │   └── Mode Selection Menu (on long press)
        │
        ├── Sidebar (left, collapsible)
        │   ├── New Chat Button
        │   ├── Conversation List
        │   ├── Settings Button
        │   └── Sign Out Button
        │
        ├── ChatHeader (fixed top)
        │   ├── Menu Button (opens sidebar)
        │   ├── HaleyOS Title
        │   ├── SupremeCourtIndicator (conditional)
        │   ├── Status Indicator
        │   └── More Button
        │
        ├── ChatMessages (scrollable center)
        │   ├── MessageBubble (user)
        │   │   ├── Content
        │   │   ├── Timestamp
        │   │   └── Action Buttons (on hover)
        │   │       ├── Copy
        │   │       ├── Read Aloud
        │   │       ├── Share
        │   │       └── More Menu
        │   │           ├── Retry
        │   │           └── Branch
        │   │
        │   ├── MessageBubble (assistant)
        │   │   ├── Content
        │   │   ├── Metadata Badges
        │   │   ├── Timestamp
        │   │   └── Action Buttons
        │   │
        │   └── TypingIndicator (when loading)
        │
        ├── ChatInputBar (fixed bottom)
        │   ├── Toggle Row
        │   │   ├── ResearchToggle
        │   │   └── LogicEngineToggle
        │   │
        │   └── Input Row
        │       ├── File Upload Button
        │       ├── Gallery Button
        │       ├── Text Input / Recording Indicator
        │       ├── Mic Button
        │       └── Send Button
        │
        └── MagicWindowContainer (floating, bottom-left)
            ├── Portal Ring (animated)
            ├── Spark Effects
            └── Content Area
                ├── Header (title + controls)
                └── Dynamic Content
                    ├── Visualization
                    ├── Code
                    ├── Image
                    └── Data
```

## 🔄 Data Flow

```
User Action
    ↓
ChatPage (state management)
    ↓
API Call (haleyApi.ts)
    ↓
Backend (HaleyOS)
    ↓
Response Processing
    ↓
State Update
    ↓
Component Re-render
    ↓
UI Update
```

## 🎨 Style Layers

```
Layer 0: Space Background (fixed)
    └── Stars + Animations

Layer 1: Main Layout (relative)
    └── Sidebar + Chat Area

Layer 10: Messages + Content (z-10)

Layer 40: Sidebar Overlay (z-40, mobile)

Layer 50: Sidebar Panel (z-50)

Layer 1000: Magic Window (z-1000)

Layer 1001: AI Switcher (z-1001)

Layer 1002: Modals (z-1002)
```

## 🧩 Component Responsibilities

### AISwitcher
- **Purpose**: Switch between AI modes
- **Features**: Long press menu, quick cycle
- **State**: Current mode, active models
- **Interactions**: Click, long press

### ChatHeader
- **Purpose**: Navigation and status
- **Features**: Menu, status, supreme court indicator
- **State**: System status, connection state
- **Interactions**: Click menu, click status

### ChatMessages
- **Purpose**: Display conversation
- **Features**: Auto-scroll, message actions
- **State**: Message list, loading state
- **Interactions**: Hover for actions, click actions

### MessageBubble
- **Purpose**: Individual message display
- **Features**: Role-based styling, actions, metadata
- **State**: Message data
- **Interactions**: Hover, click actions, click more

### ChatInputBar
- **Purpose**: User input and controls
- **Features**: Text, voice, file, toggles
- **State**: Input text, recording state, toggles
- **Interactions**: Type, click mic, click send

### MagicWindowContainer
- **Purpose**: Display visualizations
- **Features**: Portal animation, content types
- **State**: Content data, maximized state
- **Interactions**: Click maximize, click close

### Sidebar
- **Purpose**: Navigation and settings
- **Features**: Conversations, settings, sign out
- **State**: Conversations, open/closed
- **Interactions**: Click conversation, click settings

### ResearchToggle / LogicEngineToggle
- **Purpose**: Feature toggles
- **Features**: Visual feedback, smooth animation
- **State**: Enabled/disabled
- **Interactions**: Click to toggle

### SupremeCourtIndicator
- **Purpose**: Show multi-LLM status
- **Features**: Model badges, status animation
- **State**: Active models, debate status
- **Interactions**: None (display only)

## 🔌 Integration Points

### Firebase Auth (authContext.tsx)
```typescript
- signInWithGoogle()
- signOut()
- user state
- loading state
```

### Backend API (haleyApi.ts)
```typescript
- sendMessage(text)
- getSystemStatus()
- API endpoints
```

### Device Detection (useDeviceDetection)
```typescript
- device.type (phone/tablet/desktop)
- device.width
- device.height
- device.touchEnabled
```

### Long Press (useLongPress)
```typescript
- onLongPress callback
- onClick callback
- duration setting
```

## 📱 Responsive Behavior

### Phone (≤768px)
- Sidebar: Overlay (slide in from left)
- AI Switcher: Compact
- Messages: 85% max width
- Magic Window: 280px × 350px
- Input: Full width, safe bottom

### Tablet (769-1024px)
- Sidebar: Collapsible
- AI Switcher: Normal
- Messages: 82% max width
- Magic Window: 320px × 400px
- Input: Optimized touch targets

### Desktop (>1024px)
- Sidebar: Persistent
- AI Switcher: Full features
- Messages: 75% max width
- Magic Window: 320px × 400px
- Input: Standard layout

## 🎭 Animation Triggers

### On Mount
- Stars appear with twinkle
- Shooting stars start cycling
- Components fade in

### On AI Mode Change
- Bubble background transition
- Badge appearance/disappearance
- Supreme court indicator animation

### On Message Send
- Message slides in from bottom
- Typing indicator appears
- Auto-scroll triggered

### On Magic Window Open
- Portal animation plays
- Ring spins
- Sparks pulse
- Content fades in

### On Toggle Switch
- Knob slides
- Background color changes
- Icon color transitions

## 🔐 Protected Routes

```
/ (public)
    └── Landing page with sign in

/chat (protected)
    └── Requires authentication
    └── Redirects to / if not logged in
```

## 📊 State Management

### Global State (ChatPage)
```typescript
- messages: Message[]
- aiMode: AIMode
- activeModels: string[]
- systemStatus: SystemStatus
- researchEnabled: boolean
- logicEngineEnabled: boolean
- magicWindowContent: MagicWindowContent | null
```

### Local Component State
```typescript
- Input text
- Recording state
- Sidebar open/closed
- Menu visibility
- Loading states
```

### Auth State (Context)
```typescript
- user: User | null
- loading: boolean
- signIn/signOut functions
```

## 🎯 Key Patterns

### Composition
- Small, focused components
- Props for configuration
- Children for content

### Container/Presenter
- ChatPage = container
- Components = presenters

### Custom Hooks
- Device detection
- Long press detection
- Reusable logic

### Type Safety
- All props typed
- Interfaces for data
- Strict TypeScript

---

This architecture ensures:
- ✅ Maintainability
- ✅ Scalability
- ✅ Performance
- ✅ Type safety
- ✅ Reusability
