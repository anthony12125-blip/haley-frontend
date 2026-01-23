/**
 * Vibe Word Packs - Configurable status words for different Haley states
 *
 * Rules:
 * - Thinking words: Used during reasoning/processing phase
 * - Generating words: Used during token streaming phase
 * - Words only appear during active states (never idle)
 * - UI owns all word selection and rotation logic
 */

export interface VibePack {
  id: string;
  label: string;
  thinking_words: string[];
  generating_words: string[];
  name?: string;
  background?: string;
  colors?: {
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

export const VIBE_PACKS: VibePack[] = [
  {
    id: "default",
    label: "Default",
    thinking_words: [
      "Thinking…",
      "Processing…",
      "Calculating…",
      "Evaluating…",
      "Reasoning…",
      "Inferring…",
      "Connecting dots…",
      "Cross-checking…",
      "Reconciling…",
      "Disambiguating…",
      "Normalizing…",
      "Validating…",
      "Verifying…",
      "Sanity-checking…",
    ],
    generating_words: [
      "Working…",
      "Actioning…",
      "Resolving…",
      "Assembling…",
      "Synthesizing…",
      "Compiling…",
      "Routing…",
      "Dispatching…",
      "Orchestrating…",
      "Sequencing…",
      "Allocating…",
      "Buffering…",
      "Syncing…",
      "Handshaking…",
      "Finalizing…",
    ],
  },
  {
    id: "casual",
    label: "Casual",
    thinking_words: [
      "Brewing…",
      "Percolating…",
      "Steeping…",
      "Simmering…",
      "Letting it cook…",
      "Warming up…",
      "Getting ready…",
      "Gearing up…",
      "Winding up…",
    ],
    generating_words: [
      "Bootstrapping…",
      "Wiring things up…",
      "Running checks…",
      "Patching…",
      "Reconciling state…",
      "Locking it in…",
      "Committing…",
      "Shipping…",
      "Standing by…",
      "Green-lighting…",
    ],
  },
  {
    id: "technical",
    label: "Technical",
    thinking_words: [
      "Analyzing input…",
      "Parsing context…",
      "Building AST…",
      "Type checking…",
      "Semantic analysis…",
      "Constraint solving…",
      "Pattern matching…",
      "Graph traversal…",
      "Backtracking…",
    ],
    generating_words: [
      "Code generation…",
      "Optimizing…",
      "Tree shaking…",
      "Bundling…",
      "Transpiling…",
      "Minifying…",
      "Linking modules…",
      "Resolving deps…",
      "Building output…",
    ],
  },
  // LLM-Native Vibe Packs
  {
    id: "grok",
    label: "Grok",
    thinking_words: ["Thinking…"],
    generating_words: ["Working…"],
    name: 'Grok',
    background: 'linear-gradient(135deg, #000000 0%, #0A0A0A 100%)',
    colors: {
      primary: '#FFFFFF',
      accent: '#FF4444',
      panelDark: '#0A0A0A',
      panelMedium: '#141414',
      panelLight: '#1A1A1A',
      textPrimary: '#FFFFFF',
      textSecondary: '#888888',
      border: '#2A2A2A',
      error: '#FF4444',
      success: '#00FF88',
    },
  },
  {
    id: "perplexity",
    label: "Perplexity",
    thinking_words: ["Thinking…"],
    generating_words: ["Working…"],
    name: 'Perplexity',
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    colors: {
      primary: '#20B2AA',
      accent: '#40E0D0',
      panelDark: '#16213E',
      panelMedium: '#1A1A2E',
      panelLight: '#242442',
      textPrimary: '#FFFFFF',
      textSecondary: '#A0A0B0',
      border: '#2A2A4A',
      error: '#FF6B6B',
      success: '#20B2AA',
    },
  },
  {
    id: "mistral",
    label: "Mistral",
    thinking_words: ["Thinking…"],
    generating_words: ["Working…"],
    name: 'Mistral',
    background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
    colors: {
      primary: '#FF7000',
      accent: '#FF8C00',
      panelDark: '#1A1A1A',
      panelMedium: '#252525',
      panelLight: '#2D2D2D',
      textPrimary: '#FFFFFF',
      textSecondary: '#A0A0A0',
      border: '#404040',
      error: '#FF4444',
      success: '#00C853',
    },
  },
];

export function getVibePack(id: string): VibePack {
  return VIBE_PACKS.find(pack => pack.id === id) || VIBE_PACKS[0];
}

export function getRandomWord(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}
