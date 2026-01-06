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
    id: "claude",
    label: "Claude",
    thinking_words: ["Thinking…"],
    generating_words: ["Working…"],
    name: 'Claude',
    background: 'linear-gradient(135deg, #F9F5F1 0%, #F5EDE6 100%)',
    colors: {
      primary: '#D97757',
      accent: '#B8542E',
      panelDark: '#F5EDE6',
      panelMedium: '#FAF7F4',
      panelLight: '#FFFFFF',
      textPrimary: '#1A1915',
      textSecondary: '#706E69',
      border: '#E5DED6',
      error: '#D32F2F',
      success: '#2E7D32',
    },
  },
  {
    id: "gpt",
    label: "GPT",
    thinking_words: ["Thinking…"],
    generating_words: ["Working…"],
    name: 'GPT',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F7F7F8 100%)',
    colors: {
      primary: '#10A37F',
      accent: '#10A37F',
      panelDark: '#F7F7F8',
      panelMedium: '#FAFAFA',
      panelLight: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#6E6E80',
      border: '#E5E5E5',
      error: '#EF4444',
      success: '#10A37F',
    },
  },
  {
    id: "gemini",
    label: "Gemini",
    thinking_words: ["Thinking…"],
    generating_words: ["Working…"],
    name: 'Gemini',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #E8F0FE 100%)',
    colors: {
      primary: '#4285F4',
      accent: '#1A73E8',
      panelDark: '#E8F0FE',
      panelMedium: '#F1F3F4',
      panelLight: '#FFFFFF',
      textPrimary: '#202124',
      textSecondary: '#5F6368',
      border: '#DADCE0',
      error: '#EA4335',
      success: '#34A853',
    },
  },
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
  {
    id: "llama",
    label: "Llama",
    thinking_words: ["Thinking…"],
    generating_words: ["Working…"],
    name: 'Llama',
    background: 'linear-gradient(135deg, #0A0A1A 0%, #1A1A3A 100%)',
    colors: {
      primary: '#0668E1',
      accent: '#1877F2',
      panelDark: '#0A0A1A',
      panelMedium: '#141428',
      panelLight: '#1A1A3A',
      textPrimary: '#FFFFFF',
      textSecondary: '#8A8AA0',
      border: '#2A2A4A',
      error: '#FF5555',
      success: '#00D26A',
    },
  },
];

export function getVibePack(id: string): VibePack {
  return VIBE_PACKS.find(pack => pack.id === id) || VIBE_PACKS[0];
}

export function getRandomWord(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}
