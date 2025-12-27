/**
 * LLM Identity Registry
 * Static configuration for LLM provider visual identities
 * BUILD #18
 */

export interface LLMIdentity {
  initial: string;
  color: string;
  name: string;
}

/**
 * Registry mapping provider names to their visual identities
 */
const LLM_IDENTITY_REGISTRY: Record<string, LLMIdentity> = {
  gemini: {
    initial: 'G',
    color: '#3b82f6', // blue-600
    name: 'Gemini',
  },
  gpt: {
    initial: 'C',
    color: '#10b981', // green-600
    name: 'GPT',
  },
  claude: {
    initial: 'A',
    color: '#8b5cf6', // purple-600
    name: 'Claude',
  },
  llama: {
    initial: 'L',
    color: '#f97316', // orange-600
    name: 'Llama',
  },
  perplexity: {
    initial: 'P',
    color: '#06b6d4', // cyan-600
    name: 'Perplexity',
  },
  mistral: {
    initial: 'M',
    color: '#dc2626', // red-600
    name: 'Mistral',
  },
  grok: {
    initial: 'X',
    color: '#ca8a04', // yellow-600
    name: 'Grok',
  },
};

/**
 * Get LLM identity by provider name
 * @param providerName - The provider name (case-insensitive)
 * @returns LLMIdentity object with initial, color, and name
 */
export function getLLMIdentity(providerName: string): LLMIdentity {
  const normalized = providerName.toLowerCase().trim();

  if (LLM_IDENTITY_REGISTRY[normalized]) {
    return LLM_IDENTITY_REGISTRY[normalized];
  }

  // Fallback for unknown providers
  return {
    initial: providerName[0]?.toUpperCase() || '?',
    color: '#6b7280', // gray-500
    name: providerName,
  };
}

/**
 * Get all registered LLM identities
 */
export function getAllLLMIdentities(): Record<string, LLMIdentity> {
  return { ...LLM_IDENTITY_REGISTRY };
}

/**
 * Check if a provider is registered
 */
export function isRegisteredProvider(providerName: string): boolean {
  const normalized = providerName.toLowerCase().trim();
  return normalized in LLM_IDENTITY_REGISTRY;
}
