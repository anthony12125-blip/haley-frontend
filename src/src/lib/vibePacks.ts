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
];

export function getVibePack(id: string): VibePack {
  return VIBE_PACKS.find(pack => pack.id === id) || VIBE_PACKS[0];
}

export function getRandomWord(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}
