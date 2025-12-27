export interface LLMIdentity {
  initial: string;
  color: string;
  name: string;
}

const LLM_IDENTITY_REGISTRY: Record<string, LLMIdentity> = {
  gemini: {
    initial: 'G',
    color: '#3b82f6',
    name: 'Gemini',
  },
  gpt: {
    initial: 'C',
    color: '#10b981',
    name: 'GPT',
  },
  claude: {
    initial: 'A',
    color: '#8b5cf6',
    name: 'Claude',
  },
  llama: {
    initial: 'L',
    color: '#f97316',
    name: 'Llama',
  },
  perplexity: {
    initial: 'P',
    color: '#06b6d4',
    name: 'Perplexity',
  },
  mistral: {
    initial: 'M',
    color: '#dc2626',
    name: 'Mistral',
  },
  grok: {
    initial: 'X',
    color: '#ca8a04',
    name: 'Grok',
  },
};

export function getLLMIdentity(providerName: string): LLMIdentity {
  const normalized = providerName.toLowerCase().trim();

  if (LLM_IDENTITY_REGISTRY[normalized]) {
    return LLM_IDENTITY_REGISTRY[normalized];
  }

  return {
    initial: providerName[0]?.toUpperCase() || '?',
    color: '#6b7280',
    name: providerName,
  };
}

export function getAllLLMIdentities(): Record<string, LLMIdentity> {
  return { ...LLM_IDENTITY_REGISTRY };
}

export function isRegisteredProvider(providerName: string): boolean {
  const normalized = providerName.toLowerCase().trim();
  return normalized in LLM_IDENTITY_REGISTRY;
}
