'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Mic, MicOff, Compass, Target, ListChecks,
  ChevronRight, Circle, CheckCircle2, Loader2, X,
  Maximize2, Minimize2, Move, Settings, Plus, Trash2,
  Play, Pause, Eye, EyeOff, AlertCircle, Sparkles,
  Globe, Volume2, VolumeX, Bell, BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import theme from '@/styles/module-theme';
import NavigatorBrowser, { NavigatorBrowserRef, Snapshot, BrowserState } from './NavigatorBrowser';
import NavigatorOverlays, { NavigatorOverlay } from './NavigatorOverlays';
import VMViewer from '@/components/modules/VMViewer/VMViewer';
import {
  createVMSession, waitForSession, terminateSession,
  getUserModuleSession, type VMSession
} from '@/lib/vmApi';
import { useAuth } from '@/lib/authContext';

// ============================================================================
// API CONFIG
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://logic-engine-core2-409495160162.us-central1.run.app';

// ============================================================================
// TYPES
// ============================================================================

interface NavigatorProps {
  onBack: () => void;
}

type NavigatorMode = 'setup' | 'active' | 'browser';
type SetupStep = 'domain' | 'complexity' | 'data-needs' | 'data-sources' | 'state-schema' | 'triggers' | 'review';

// Default Haley expert — used when launching browser directly without setup wizard
const HALEY_DEFAULT_EXPERT: DomainExpert = {
  id: 'haley_default',
  name: 'Haley',
  description: 'Haley controls the browser for you. Just tell her what you need.',
  domain: 'General Web Browsing',
  complexityTriggers: [],
  dataNeeds: [],
  dataSources: [],
  stateSchema: { type: 'software', fields: [] },
  proactiveTriggers: [],
  modes: [],
  createdAt: 0,
  updatedAt: 0,
};

interface DomainExpert {
  id: string;
  name: string;
  description: string;
  domain: string;
  complexityTriggers: string[];
  dataNeeds: string[];
  dataSources: string[];
  stateSchema: StateSchema;
  proactiveTriggers: ProactiveTrigger[];
  modes: DomainMode[];
  createdAt: number;
  updatedAt: number;
}

interface StateSchema {
  type: 'game' | 'software' | 'physical' | 'custom';
  fields: StateField[];
}

interface StateField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  detectFrom: 'screenshot' | 'dom' | 'api' | 'manual';
}

interface ProactiveTrigger {
  id: string;
  name: string;
  condition: string;
  enabled: boolean;
}

interface DomainMode {
  id: string;
  name: string;
  description: string;
  vectorScope: string[];
  detectBy: string;
}

interface CurrentTask {
  id: string;
  description: string;
  steps: TaskStep[];
  currentStepIndex: number;
}

interface TaskStep {
  id: string;
  instruction: string;
  completed: boolean;
  target?: string;
}

interface NavigatorSettings {
  snapshotInterval: number;
  voiceEnabled: boolean;
  proactiveAlertsEnabled: boolean;
  overlaysEnabled: boolean;
}

interface ProactiveAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  timestamp: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function loadExpertToBackend(expert: DomainExpert): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/navigator/load-expert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expert }),
    });
    return await response.json();
  } catch (error) {
    console.error('[Navigator] Failed to load expert to backend:', error);
    return { success: false, error: String(error) };
  }
}

async function queryNavigator(
  expertId: string,
  query: string,
  snapshot?: Snapshot | null
): Promise<{
  success: boolean;
  response?: {
    type: 'tactical' | 'strategic' | 'proactive';
    message: string;
    next_step?: string;
    task?: CurrentTask;
    overlays?: NavigatorOverlay[];
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/api/navigator/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expert_id: expertId,
        query,
        snapshot: snapshot ? {
          id: snapshot.id,
          timestamp: snapshot.timestamp,
          mode_id: null,
          state_data: snapshot.stateData,
        } : null,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('[Navigator] Query failed:', error);
    return { success: false, error: String(error) };
  }
}

async function sendSnapshot(
  expertId: string,
  snapshot: Snapshot
): Promise<{
  success: boolean;
  alert?: {
    type: string;
    message: string;
    next_step?: string;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/api/navigator/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expert_id: expertId,
        snapshot: {
          id: snapshot.id,
          timestamp: snapshot.timestamp,
          mode_id: null,
          state_data: snapshot.stateData,
        },
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('[Navigator] Snapshot failed:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = 'navigator_domain_experts';
const SETTINGS_KEY = 'navigator_settings';

function loadDomainExperts(): DomainExpert[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveDomainExperts(experts: DomainExpert[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(experts));
  }
}

function loadSettings(): NavigatorSettings {
  if (typeof window === 'undefined') {
    return { snapshotInterval: 5000, voiceEnabled: true, proactiveAlertsEnabled: true, overlaysEnabled: true };
  }
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? JSON.parse(saved) : {
    snapshotInterval: 5000,
    voiceEnabled: true,
    proactiveAlertsEnabled: true,
    overlaysEnabled: true,
  };
}

function saveSettings(settings: NavigatorSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}

// ============================================================================
// SETUP FLOW COMPONENT
// ============================================================================

interface SetupFlowProps {
  onComplete: (expert: DomainExpert) => void;
  onCancel: () => void;
}

function SetupFlow({ onComplete, onCancel }: SetupFlowProps) {
  const [step, setStep] = useState<SetupStep>('domain');
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    complexityTriggers: [''],
    dataNeeds: [''],
    dataSources: [''],
    stateSchemaType: 'software' as StateSchema['type'],
    stateFields: [] as StateField[],
    proactiveTriggers: [] as ProactiveTrigger[],
    modes: [] as DomainMode[],
  });

  const steps: { id: SetupStep; title: string; question: string }[] = [
    { id: 'domain', title: 'Domain', question: 'What is this domain?' },
    { id: 'complexity', title: 'Complexity', question: 'When does complexity overwhelm you?' },
    { id: 'data-needs', title: 'Data Needs', question: 'What do you need to know in those moments?' },
    { id: 'data-sources', title: 'Data Sources', question: 'Where do we get that data from?' },
    { id: 'state-schema', title: 'State Schema', question: 'How will I know what mode you\'re in?' },
    { id: 'triggers', title: 'Triggers', question: 'When do you want me to speak up proactively?' },
    { id: 'review', title: 'Review', question: 'Let\'s review your Domain Expert' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);
  const currentStepData = steps[currentStepIndex];

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].id);
    }
  };

  const handleComplete = () => {
    const expert: DomainExpert = {
      id: `expert_${Date.now()}`,
      name: formData.name,
      domain: formData.domain,
      description: formData.description,
      complexityTriggers: formData.complexityTriggers.filter(t => t.trim()),
      dataNeeds: formData.dataNeeds.filter(d => d.trim()),
      dataSources: formData.dataSources.filter(s => s.trim()),
      stateSchema: {
        type: formData.stateSchemaType,
        fields: formData.stateFields,
      },
      proactiveTriggers: formData.proactiveTriggers,
      modes: formData.modes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onComplete(expert);
  };

  const addArrayItem = (key: 'complexityTriggers' | 'dataNeeds' | 'dataSources') => {
    setFormData(prev => ({ ...prev, [key]: [...prev[key], ''] }));
  };

  const updateArrayItem = (key: 'complexityTriggers' | 'dataNeeds' | 'dataSources', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => i === index ? value : item),
    }));
  };

  const removeArrayItem = (key: 'complexityTriggers' | 'dataNeeds' | 'dataSources', index: number) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const addProactiveTrigger = () => {
    setFormData(prev => ({
      ...prev,
      proactiveTriggers: [...prev.proactiveTriggers, {
        id: `trigger_${Date.now()}`,
        name: '',
        condition: '',
        enabled: true,
      }],
    }));
  };

  const addMode = () => {
    setFormData(prev => ({
      ...prev,
      modes: [...prev.modes, {
        id: `mode_${Date.now()}`,
        name: '',
        description: '',
        vectorScope: [],
        detectBy: '',
      }],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <button onClick={onCancel} className="text-text-secondary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-1">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentStepIndex ? 'bg-primary' : 'bg-panel-light'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          {currentStepData.question}
        </h2>

        {step === 'domain' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Name your Domain Expert</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Warhammer 2 High Elves, Photoshop Basics"
                className={theme.input}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Domain</label>
              <input
                type="text"
                value={formData.domain}
                onChange={e => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="e.g., Total War: Warhammer 2, Adobe Photoshop"
                className={theme.input}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What will this Domain Expert help you with?"
                rows={3}
                className={theme.input}
              />
            </div>
          </div>
        )}

        {step === 'complexity' && (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm mb-4">
              Describe the moments when you feel overwhelmed. These help me understand when you need my help.
            </p>
            {formData.complexityTriggers.map((trigger, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={trigger}
                  onChange={e => updateArrayItem('complexityTriggers', index, e.target.value)}
                  placeholder="e.g., When I get ambushed in battle"
                  className={`${theme.input} flex-1`}
                />
                {formData.complexityTriggers.length > 1 && (
                  <button
                    onClick={() => removeArrayItem('complexityTriggers', index)}
                    className="p-3 text-text-secondary hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayItem('complexityTriggers')}
              className="flex items-center gap-2 text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" /> Add another trigger
            </button>
          </div>
        )}

        {step === 'data-needs' && (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm mb-4">
              What information do you need in those overwhelming moments?
            </p>
            {formData.dataNeeds.map((need, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={need}
                  onChange={e => updateArrayItem('dataNeeds', index, e.target.value)}
                  placeholder="e.g., Unit stats and counters"
                  className={`${theme.input} flex-1`}
                />
                {formData.dataNeeds.length > 1 && (
                  <button
                    onClick={() => removeArrayItem('dataNeeds', index)}
                    className="p-3 text-text-secondary hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayItem('dataNeeds')}
              className="flex items-center gap-2 text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" /> Add another data need
            </button>
          </div>
        )}

        {step === 'data-sources' && (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm mb-4">
              Where should we gather this information from?
            </p>
            {formData.dataSources.map((source, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={source}
                  onChange={e => updateArrayItem('dataSources', index, e.target.value)}
                  placeholder="e.g., Game wiki URL, Official documentation"
                  className={`${theme.input} flex-1`}
                />
                {formData.dataSources.length > 1 && (
                  <button
                    onClick={() => removeArrayItem('dataSources', index)}
                    className="p-3 text-text-secondary hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayItem('dataSources')}
              className="flex items-center gap-2 text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" /> Add another source
            </button>
          </div>
        )}

        {step === 'state-schema' && (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm mb-4">
              How will I detect what mode you're in?
            </p>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Domain Type</label>
              <select
                value={formData.stateSchemaType}
                onChange={e => setFormData(prev => ({ ...prev, stateSchemaType: e.target.value as StateSchema['type'] }))}
                className={theme.input}
              >
                <option value="game">Game (screenshot-based)</option>
                <option value="software">Software (DOM/UI-based)</option>
                <option value="physical">Physical Space</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-text-secondary">Mode Definitions</label>
                <button onClick={addMode} className="text-xs text-primary hover:text-primary/80">+ Add Mode</button>
              </div>
              {formData.modes.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-sm border border-dashed border-border rounded-xl">
                  Define modes to help me understand your context.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.modes.map((mode, index) => (
                    <div key={mode.id} className="p-4 bg-panel-medium rounded-xl border border-border">
                      <input
                        type="text"
                        value={mode.name}
                        onChange={e => {
                          const updated = [...formData.modes];
                          updated[index].name = e.target.value;
                          setFormData(prev => ({ ...prev, modes: updated }));
                        }}
                        placeholder="Mode name (e.g., Battle Mode)"
                        className={`${theme.input} mb-2`}
                      />
                      <input
                        type="text"
                        value={mode.detectBy}
                        onChange={e => {
                          const updated = [...formData.modes];
                          updated[index].detectBy = e.target.value;
                          setFormData(prev => ({ ...prev, modes: updated }));
                        }}
                        placeholder="How to detect (e.g., battle UI visible)"
                        className={theme.input}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'triggers' && (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm mb-4">
              When should I alert you without being asked?
            </p>
            {formData.proactiveTriggers.length === 0 ? (
              <div className="text-center py-8 text-text-secondary text-sm border border-dashed border-border rounded-xl">
                No proactive triggers defined yet.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.proactiveTriggers.map((trigger, index) => (
                  <div key={trigger.id} className="p-4 bg-panel-medium rounded-xl border border-border">
                    <input
                      type="text"
                      value={trigger.name}
                      onChange={e => {
                        const updated = [...formData.proactiveTriggers];
                        updated[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, proactiveTriggers: updated }));
                      }}
                      placeholder="Trigger name (e.g., Flanking Alert)"
                      className={`${theme.input} mb-2`}
                    />
                    <input
                      type="text"
                      value={trigger.condition}
                      onChange={e => {
                        const updated = [...formData.proactiveTriggers];
                        updated[index].condition = e.target.value;
                        setFormData(prev => ({ ...prev, proactiveTriggers: updated }));
                      }}
                      placeholder="Condition (e.g., health < 20)"
                      className={theme.input}
                    />
                  </div>
                ))}
              </div>
            )}
            <button onClick={addProactiveTrigger} className="flex items-center gap-2 text-primary hover:text-primary/80">
              <Plus className="w-4 h-4" /> Add proactive trigger
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="p-4 bg-panel-medium rounded-xl border border-border">
              <h3 className="font-medium text-text-primary mb-1">{formData.name || 'Unnamed Expert'}</h3>
              <p className="text-sm text-text-secondary">{formData.domain}</p>
              <p className="text-sm text-text-secondary mt-2">{formData.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2">Complexity Triggers</h4>
              <ul className="space-y-1">
                {formData.complexityTriggers.filter(t => t.trim()).map((trigger, i) => (
                  <li key={i} className="text-sm text-text-primary flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    {trigger}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2">Modes ({formData.modes.length})</h4>
              <div className="flex flex-wrap gap-2">
                {formData.modes.map(mode => (
                  <span key={mode.id} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                    {mode.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2">Proactive Triggers ({formData.proactiveTriggers.length})</h4>
              {formData.proactiveTriggers.length > 0 ? (
                <ul className="space-y-1">
                  {formData.proactiveTriggers.map(trigger => (
                    <li key={trigger.id} className="text-sm text-text-primary flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {trigger.name}: {trigger.condition}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary">None - I'll only respond when asked</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="px-6 py-4 border-t border-border flex justify-between">
        <button onClick={currentStepIndex === 0 ? onCancel : handleBack} className={theme.button.secondary}>
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </button>
        {step === 'review' ? (
          <button onClick={handleComplete} disabled={!formData.name || !formData.domain} className={theme.button.primary}>
            Create Domain Expert
          </button>
        ) : (
          <button onClick={handleNext} className={theme.button.primary}>Continue</button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FLOATING NAVIGATOR WINDOW
// ============================================================================

interface FloatingWindowProps {
  expert: DomainExpert;
  currentTask: CurrentTask | null;
  nextStep: string | null;
  nextStepTarget?: string;
  onClose: () => void;
  onVoiceToggle: () => void;
  isListening: boolean;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  isExpanded: boolean;
  onExpandToggle: () => void;
  browserRef?: React.RefObject<NavigatorBrowserRef>;
}

function FloatingWindow({
  expert,
  currentTask,
  nextStep,
  nextStepTarget,
  onClose,
  onVoiceToggle,
  isListening,
  onSendMessage,
  isLoading,
  position,
  onPositionChange,
  isExpanded,
  onExpandToggle,
  browserRef,
}: FloatingWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Auto-reposition to avoid overlapping target element
  useEffect(() => {
    if (!nextStepTarget || !browserRef?.current || !windowRef.current) return;

    const targetRect = browserRef.current.getElementPosition(nextStepTarget);
    if (!targetRect) return;

    const windowRect = windowRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check for overlap
    const overlaps = !(
      position.x + windowRect.width < targetRect.x ||
      position.x > targetRect.x + targetRect.width ||
      position.y + windowRect.height < targetRect.y ||
      position.y > targetRect.y + targetRect.height
    );

    if (overlaps) {
      // Move to opposite side
      let newX = position.x;
      let newY = position.y;

      // Prefer moving horizontally
      if (targetRect.x > viewportWidth / 2) {
        // Target is on right, move window to left
        newX = Math.max(20, targetRect.x - windowRect.width - 40);
      } else {
        // Target is on left, move window to right
        newX = Math.min(viewportWidth - windowRect.width - 20, targetRect.x + targetRect.width + 40);
      }

      // If still overlapping, try vertical movement
      if (newX === position.x) {
        if (targetRect.y > viewportHeight / 2) {
          newY = Math.max(20, targetRect.y - windowRect.height - 40);
        } else {
          newY = Math.min(viewportHeight - windowRect.height - 20, targetRect.y + targetRect.height + 40);
        }
      }

      if (newX !== position.x || newY !== position.y) {
        onPositionChange({ x: newX, y: newY });
      }
    }
  }, [nextStepTarget, browserRef, position, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        onPositionChange({
          x: dragRef.current.startPosX + deltaX,
          y: dragRef.current.startPosY + deltaY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPositionChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <motion.div
      ref={windowRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed bg-panel-dark border border-border rounded-xl shadow-2xl overflow-hidden ${
        isExpanded ? 'w-96' : 'w-72'
      }`}
      style={{ zIndex: 9999, left: 0, top: 0 }}
      onMouseDown={handleMouseDown}
    >
      {/* Title bar */}
      <div className="drag-handle flex items-center justify-between px-3 py-2 bg-panel-medium border-b border-border cursor-move">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600" />
            <button onClick={onExpandToggle} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-medium text-text-primary ml-2">NAVIGATOR</span>
        </div>
        <Compass className="w-4 h-4 text-primary" />
      </div>

      {/* Chat input */}
      <div className="p-3 border-b border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="How do I..."
            className="flex-1 px-3 py-2 bg-panel-medium border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={onVoiceToggle}
            className={`p-2 rounded-lg transition-colors ${
              isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-panel-medium text-text-secondary hover:text-text-primary'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Next Step */}
      <div className="px-3 py-2 border-b border-border bg-primary/5">
        <div className="text-xs text-text-secondary mb-1">NEXT STEP</div>
        <div className="flex items-center gap-2 text-sm text-text-primary">
          <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking...
            </span>
          ) : (
            <span className="line-clamp-2">{nextStep || 'Ask me anything'}</span>
          )}
        </div>
      </div>

      {/* Current Task */}
      <div className="px-3 py-2">
        <div className="text-xs text-text-secondary mb-1">CURRENT TASK</div>
        {currentTask ? (
          <div>
            <div className="text-sm text-text-primary mb-2 line-clamp-1">{currentTask.description}</div>
            <div className="flex items-center gap-1">
              {currentTask.steps.map((step, i) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    step.completed ? 'bg-green-500' : i === currentTask.currentStepIndex ? 'bg-primary' : 'bg-panel-light'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-text-secondary">No active task</div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// PROACTIVE ALERT TOAST
// ============================================================================

function ProactiveAlertToast({ alert, onDismiss }: { alert: ProactiveAlert; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-4 right-4 max-w-sm bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 shadow-lg z-50"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-500">Proactive Alert</p>
          <p className="text-sm text-text-primary mt-1">{alert.message}</p>
        </div>
        <button onClick={onDismiss} className="text-text-secondary hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN NAVIGATOR COMPONENT
// ============================================================================

export default function Navigator({ onBack }: NavigatorProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<NavigatorMode>('setup');
  const [experts, setExperts] = useState<DomainExpert[]>([]);
  const [activeExpert, setActiveExpert] = useState<DomainExpert | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [settings, setSettings] = useState<NavigatorSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);

  // VM session state
  const [vmSession, setVmSession] = useState<VMSession | null>(null);
  const [vmLoading, setVmLoading] = useState(false);
  const [vmError, setVmError] = useState<string | null>(null);

  // Browser state
  const browserRef = useRef<NavigatorBrowserRef>(null);
  const [browserState, setBrowserState] = useState<BrowserState | null>(null);
  const [currentSnapshot, setCurrentSnapshot] = useState<Snapshot | null>(null);

  // Floating window state
  const [windowPosition, setWindowPosition] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 320 : 100, y: 100 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<CurrentTask | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [nextStepTarget, setNextStepTarget] = useState<string | undefined>(undefined);

  // Overlays
  const [overlays, setOverlays] = useState<NavigatorOverlay[]>([]);

  // Proactive alerts
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlert[]>([]);

  // Voice recognition
  const recognitionRef = useRef<any>(null);

  // Load saved experts
  useEffect(() => {
    setExperts(loadDomainExperts());
  }, []);

  // Initialize voice recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('[Navigator] Voice transcript:', transcript);
        handleSendMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('[Navigator] Voice error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Cleanup VM session on unmount or back navigation
  useEffect(() => {
    return () => {
      if (vmSession?.session_id) {
        terminateSession(vmSession.session_id, 'user_navigated_away').catch(console.error);
      }
    };
  }, [vmSession?.session_id]);

  // Check for existing VM session on mount
  useEffect(() => {
    if (!user?.uid) return;
    getUserModuleSession(user.uid, 'navigator').then(session => {
      if (session && (session.status === 'ready' || session.status === 'active')) {
        setVmSession(session);
      }
    }).catch(() => {});
  }, [user?.uid]);

  // Handle snapshot from browser
  const handleSnapshot = useCallback(async (snapshot: Snapshot) => {
    // Don't send snapshots if using default Haley browser (no real expert)
    if (!activeExpert || activeExpert.id === 'haley_default') return;

    setCurrentSnapshot(snapshot);

    if (settings.proactiveAlertsEnabled) {
      const result = await sendSnapshot(activeExpert.id, snapshot);

      if (result.success && result.alert) {
        const newAlert: ProactiveAlert = {
          id: `alert_${Date.now()}`,
          type: 'warning',
          message: result.alert.message,
          timestamp: Date.now(),
        };
        setProactiveAlerts(prev => [...prev, newAlert]);
      }
    }
  }, [activeExpert, settings.proactiveAlertsEnabled]);

  const handleCreateExpert = (expert: DomainExpert) => {
    const updated = [...experts, expert];
    setExperts(updated);
    saveDomainExperts(updated);
    setIsCreating(false);
  };

  const handleActivateExpert = async (expert: DomainExpert) => {
    // Load expert to backend
    const result = await loadExpertToBackend(expert);
    if (!result.success) {
      console.error('[Navigator] Failed to activate expert:', result.error);
    }

    setActiveExpert(expert);
    setMode('active');
  };

  const handleDeleteExpert = (expertId: string) => {
    const updated = experts.filter(e => e.id !== expertId);
    setExperts(updated);
    saveDomainExperts(updated);
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!activeExpert) return;

    setIsLoading(true);
    setOverlays([]);

    const result = await queryNavigator(activeExpert.id, message, currentSnapshot);

    if (result.success && result.response) {
      setNextStep(result.response.next_step || result.response.message);

      if (result.response.task) {
        setCurrentTask(result.response.task);
        // Extract target from first step if available
        if (result.response.task.steps.length > 0) {
          setNextStepTarget(result.response.task.steps[0].target);
        }
      }

      if (result.response.overlays && settings.overlaysEnabled) {
        setOverlays(result.response.overlays);
      }
    } else {
      setNextStep('Sorry, I couldn\'t process that. Try asking differently.');
    }

    setIsLoading(false);
  }, [activeExpert, currentSnapshot, settings.overlaysEnabled]);

  const handleVoiceToggle = useCallback(() => {
    if (!recognitionRef.current || !settings.voiceEnabled) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('[Navigator] Failed to start voice recognition:', error);
      }
    }
  }, [isListening, settings.voiceEnabled]);

  const handleSettingsChange = (newSettings: Partial<NavigatorSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  const dismissAlert = (alertId: string) => {
    setProactiveAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Settings modal
  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
      <div className="bg-panel-dark border border-border rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">Navigator Settings</h2>
          <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-panel-light rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Snapshot Interval</label>
            <select
              value={settings.snapshotInterval}
              onChange={e => handleSettingsChange({ snapshotInterval: Number(e.target.value) })}
              className={theme.input}
            >
              <option value={1000}>1 second</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={0}>Manual only</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Voice Input</p>
              <p className="text-xs text-text-secondary">Enable microphone</p>
            </div>
            <button
              onClick={() => handleSettingsChange({ voiceEnabled: !settings.voiceEnabled })}
              className={`w-10 h-5 rounded-full relative ${settings.voiceEnabled ? 'bg-primary' : 'bg-panel-light'}`}
            >
              <span className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all ${settings.voiceEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Proactive Alerts</p>
              <p className="text-xs text-text-secondary">Alert without asking</p>
            </div>
            <button
              onClick={() => handleSettingsChange({ proactiveAlertsEnabled: !settings.proactiveAlertsEnabled })}
              className={`w-10 h-5 rounded-full relative ${settings.proactiveAlertsEnabled ? 'bg-primary' : 'bg-panel-light'}`}
            >
              <span className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all ${settings.proactiveAlertsEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Visual Overlays</p>
              <p className="text-xs text-text-secondary">Show circles/arrows</p>
            </div>
            <button
              onClick={() => handleSettingsChange({ overlaysEnabled: !settings.overlaysEnabled })}
              className={`w-10 h-5 rounded-full relative ${settings.overlaysEnabled ? 'bg-primary' : 'bg-panel-light'}`}
            >
              <span className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all ${settings.overlaysEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
        <div className="flex justify-end p-4 border-t border-border">
          <button onClick={() => setShowSettings(false)} className={theme.button.primary}>Done</button>
        </div>
      </div>
    </div>
  );

  // Launch browser directly with Haley as controller (no setup wizard)
  const handleLaunchBrowser = async () => {
    setActiveExpert(HALEY_DEFAULT_EXPERT);
    setMode('active');
    setVmError(null);

    // Create VM session for real browser control
    if (user?.uid) {
      setVmLoading(true);
      try {
        // Check for existing session first
        const existing = await getUserModuleSession(user.uid, 'navigator');
        if (existing && (existing.status === 'ready' || existing.status === 'active')) {
          setVmSession(existing);
          setVmLoading(false);
          return;
        }

        const session = await createVMSession({
          user_id: user.uid,
          module_id: 'navigator',
          template_name: 'standard',
          applications: ['chromium'],
          idle_timeout_minutes: 30,
        });

        const readySession = await waitForSession(session.session_id, 120000);
        setVmSession(readySession);
      } catch (err: any) {
        console.error('[Navigator] VM session creation failed:', err);
        setVmError(err.message || 'Failed to create browser session');
        // Falls back to iframe-based NavigatorBrowser
      } finally {
        setVmLoading(false);
      }
    }
  };

  // Handle back from active mode — terminate VM session
  const handleBackFromActive = () => {
    if (vmSession?.session_id) {
      terminateSession(vmSession.session_id, 'user_request').catch(console.error);
    }
    setVmSession(null);
    setVmError(null);
    setActiveExpert(null);
    setMode('setup');
    setOverlays([]);
  };

  // Expert selection / management view
  if (mode === 'setup' && !isCreating) {
    return (
      <div className={theme.layout.module}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-panel-light rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-text-primary">Navigator</h1>
                <p className="text-xs text-text-secondary">AI-Powered Web Browser</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-panel-light rounded-lg">
              <Settings className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Launch Browser CTA — primary action */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="p-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-primary/20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Launch Browser</h2>
              <p className="text-text-secondary max-w-md mx-auto mb-6">
                Open a browser session controlled by Haley. Use voice or text to tell her what to do — book flights, order items, fill forms, browse the web.
              </p>
              <button
                onClick={handleLaunchBrowser}
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors text-lg"
              >
                <Globe className="w-5 h-5" />
                Launch Browser
              </button>
            </div>
          </div>

          {/* Domain Experts section — secondary */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Domain Experts</h3>
              <button onClick={() => setIsCreating(true)} className="flex items-center gap-1 text-sm text-primary hover:text-primary/80">
                <Plus className="w-4 h-4" /> New Expert
              </button>
            </div>
            {experts.length === 0 ? (
              <div className="p-6 bg-panel-medium rounded-xl border border-border text-center">
                <p className="text-sm text-text-secondary">
                  Optionally create Domain Experts for specialized guidance in specific applications.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experts.map(expert => (
                  <div key={expert.id} className="p-4 bg-panel-medium rounded-xl border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-text-primary">{expert.name}</h3>
                        <p className="text-sm text-text-secondary">{expert.domain}</p>
                      </div>
                      <button onClick={() => handleDeleteExpert(expert.id)} className="p-1 text-text-secondary hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-text-secondary mb-4 line-clamp-2">{expert.description}</p>
                    <button onClick={() => handleActivateExpert(expert)} className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors">
                      Activate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showSettings && <SettingsModal />}
      </div>
    );
  }

  // Expert creation flow
  if (isCreating) {
    return (
      <div className={theme.layout.module}>
        <SetupFlow onComplete={handleCreateExpert} onCancel={() => setIsCreating(false)} />
      </div>
    );
  }

  // Active expert mode with browser
  if (mode === 'active' && activeExpert) {
    const isHaleyDefault = activeExpert.id === 'haley_default';

    return (
      <div className={theme.layout.module}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackFromActive}
              className="p-2 hover:bg-panel-light rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {isHaleyDefault ? 'Haley Browser' : activeExpert.name}
              </h1>
              <p className="text-xs text-text-secondary">
                {isHaleyDefault
                  ? vmSession ? 'VM Browser Active' : vmLoading ? 'Starting browser...' : 'Tell Haley what you need'
                  : 'Navigator Active'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Inline voice command button in header */}
            <button
              onClick={handleVoiceToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-panel-light text-text-secondary hover:text-text-primary hover:bg-panel-light/80'
              }`}
              title={isListening ? 'Stop listening' : 'Voice command'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? 'Listening...' : 'Voice'}
            </button>
            <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              vmSession ? 'bg-green-500/20 text-green-400' : vmLoading ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                vmSession ? 'bg-green-400' : vmLoading ? 'bg-yellow-400' : 'bg-blue-400'
              }`} />
              {vmSession ? 'VM Connected' : vmLoading ? 'Connecting...' : 'Active'}
            </span>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-panel-light rounded-lg">
              <Settings className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Browser content area with overlays */}
        <div className="flex-1 relative overflow-hidden">
          {vmLoading ? (
            /* VM session is being created — show loading state */
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-text-primary font-medium">Starting browser session...</p>
                <p className="text-sm text-text-secondary mt-1">This may take up to a minute</p>
              </div>
            </div>
          ) : vmSession?.stream_url ? (
            /* VM session is ready — render WebRTC VMViewer.
               Backend embeds token in stream_url as ?token=..., so parse it out. */
            (() => {
              const url = new URL(vmSession.stream_url!);
              const token = url.searchParams.get('token') || vmSession.stream_token || '';
              url.searchParams.delete('token');
              const baseStreamUrl = url.toString();
              return (
                <VMViewer
                  sessionId={vmSession.session_id}
                  streamUrl={baseStreamUrl}
                  streamToken={token}
                  onDisconnect={() => setVmSession(null)}
                  onError={(err) => {
                    console.error('[Navigator] VM error:', err);
                    setVmError(String(err));
                    setVmSession(null);
                  }}
                  className="w-full h-full"
                />
              );
            })()
          ) : vmError ? (
            /* VM failed — show error with fallback to iframe */
            <div className="flex flex-col h-full">
              <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-500">
                  VM browser unavailable ({vmError}). Using embedded browser — some sites may not load.
                </p>
              </div>
              <div className="flex-1 relative">
                <NavigatorBrowser
                  ref={browserRef}
                  snapshotInterval={settings.snapshotInterval}
                  onSnapshot={handleSnapshot}
                  onStateChange={setBrowserState}
                />
              </div>
            </div>
          ) : (
            /* No VM session — fallback to iframe NavigatorBrowser */
            <NavigatorBrowser
              ref={browserRef}
              snapshotInterval={settings.snapshotInterval}
              onSnapshot={handleSnapshot}
              onStateChange={setBrowserState}
            />
          )}

          {/* Overlays layer — only when using iframe browser */}
          {!vmSession && settings.overlaysEnabled && overlays.length > 0 && (
            <NavigatorOverlays
              overlays={overlays}
              getElementPosition={browserRef.current?.getElementPosition}
              onOverlayClick={overlay => {
                console.log('[Navigator] Overlay clicked:', overlay);
                setOverlays(prev => prev.filter(o => o.id !== overlay.id));
              }}
            />
          )}

          {/* Persistent mic button floating over browser (bottom-right) */}
          <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3">
            {/* Quick text input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).elements.namedItem('browserCommand') as HTMLInputElement;
                if (input.value.trim() && !isLoading) {
                  handleSendMessage(input.value.trim());
                  input.value = '';
                }
              }}
              className="flex items-center gap-2 bg-panel-dark/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg"
            >
              <input
                name="browserCommand"
                type="text"
                placeholder={isHaleyDefault ? 'Tell Haley what to do...' : 'Ask Navigator...'}
                className="bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none w-64"
                disabled={isLoading}
              />
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`p-2 rounded-full transition-colors ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-primary/20 text-primary hover:bg-primary/30'
                  }`}
                  title={isListening ? 'Stop' : 'Speak'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Floating Navigator Window — only for Domain Experts, not for Haley default */}
        {!isHaleyDefault && (
          <FloatingWindow
            expert={activeExpert}
            currentTask={currentTask}
            nextStep={nextStep}
            nextStepTarget={nextStepTarget}
            onClose={handleBackFromActive}
            onVoiceToggle={handleVoiceToggle}
            isListening={isListening}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            position={windowPosition}
            onPositionChange={setWindowPosition}
            isExpanded={isExpanded}
            onExpandToggle={() => setIsExpanded(!isExpanded)}
            browserRef={browserRef}
          />
        )}

        {/* Proactive Alerts */}
        <AnimatePresence>
          {proactiveAlerts.slice(-1).map(alert => (
            <ProactiveAlertToast key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
          ))}
        </AnimatePresence>

        {showSettings && <SettingsModal />}
      </div>
    );
  }

  return null;
}
