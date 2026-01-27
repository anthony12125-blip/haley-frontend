// ============================================================================
// NAVIGATOR MODULE - TYPE DEFINITIONS
// ============================================================================

/**
 * DOMAIN EXPERT
 * A downloadable, shareable knowledge package for a specific domain.
 * Contains everything needed to provide real-time guidance.
 */
export interface DomainExpert {
  id: string;
  name: string;
  description: string;
  domain: string;

  // Setup configuration
  complexityTriggers: string[];
  dataNeeds: string[];
  dataSources: string[];

  // State detection
  stateSchema: StateSchema;

  // Proactive assistance
  proactiveTriggers: ProactiveTrigger[];

  // Mode definitions for vector pre-scoping
  modes: DomainMode[];

  // Metadata
  createdAt: number;
  updatedAt: number;
  version?: string;
  author?: string;
}

/**
 * STATE SCHEMA
 * Defines how the Navigator detects the current state/mode.
 * Different domain types use different detection methods.
 */
export interface StateSchema {
  type: 'game' | 'software' | 'physical' | 'custom';
  fields: StateField[];
}

export interface StateField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  detectFrom: 'screenshot' | 'dom' | 'api' | 'manual';
}

/**
 * PROACTIVE TRIGGER
 * Conditions that cause Navigator to speak up without being asked.
 */
export interface ProactiveTrigger {
  id: string;
  name: string;
  condition: string;
  enabled: boolean;
}

/**
 * DOMAIN MODE
 * A specific context within the domain that pre-scopes the vector search.
 * e.g., "Battle Mode" in a game only loads battle-relevant data.
 */
export interface DomainMode {
  id: string;
  name: string;
  description: string;
  vectorScope: string[];  // Which data categories to load
  detectBy: string;       // How to detect this mode
}

/**
 * CURRENT TASK
 * The user's current objective with step-by-step guidance.
 */
export interface CurrentTask {
  id: string;
  description: string;
  steps: TaskStep[];
  currentStepIndex: number;
}

export interface TaskStep {
  id: string;
  instruction: string;
  completed: boolean;
  target?: string;  // DOM selector, coordinates, or description
}

/**
 * NAVIGATOR OVERLAY
 * Visual guidance elements drawn on screen.
 */
export interface NavigatorOverlay {
  id: string;
  type: 'circle' | 'arrow' | 'highlight' | 'path';
  target: string;
  color: string;
  label?: string;
}

/**
 * SNAPSHOT
 * A point-in-time capture of the current state.
 */
export interface Snapshot {
  id: string;
  timestamp: number;
  modeId: string | null;
  stateData: Record<string, unknown>;
  screenshot?: string;  // Base64 if using image capture
}

/**
 * NAVIGATOR SESSION
 * Active session state when a Domain Expert is running.
 */
export interface NavigatorSession {
  expertId: string;
  startedAt: number;
  currentMode: DomainMode | null;
  currentTask: CurrentTask | null;
  snapshots: Snapshot[];
  overlays: NavigatorOverlay[];
  settings: NavigatorSettings;
}

/**
 * NAVIGATOR SETTINGS
 * User-configurable options for the active session.
 */
export interface NavigatorSettings {
  snapshotInterval: number;  // milliseconds
  voiceEnabled: boolean;
  proactiveAlertsEnabled: boolean;
  overlaysEnabled: boolean;
  windowPosition: { x: number; y: number };
  windowExpanded: boolean;
}

/**
 * DOMAIN DATA CHUNK
 * A piece of domain knowledge stored in the local database.
 */
export interface DomainDataChunk {
  id: string;
  expertId: string;
  category: string;
  content: string;
  embedding?: number[];  // Pre-computed for similarity search
  metadata: Record<string, unknown>;
}

/**
 * QUERY CONTEXT
 * Everything needed to process a user query.
 */
export interface QueryContext {
  query: string;
  mode: DomainMode | null;
  snapshot: Snapshot | null;
  relevantChunks: DomainDataChunk[];
}

/**
 * NAVIGATOR RESPONSE
 * The response from the Logic Engine.
 */
export interface NavigatorResponse {
  type: 'tactical' | 'strategic' | 'proactive';
  message: string;
  nextStep?: string;
  task?: CurrentTask;
  overlays?: NavigatorOverlay[];
}
