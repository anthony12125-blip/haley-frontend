export interface LLMIdentity {
  initial: string;
  color: string;
  name: string;
}

const LLM_IDENTITY_REGISTRY: Record<string, LLMIdentity> = {
  haley: {
    initial: 'H',
    color: '#ff006e',
    name: 'Haley',
  },
};

export function getLLMIdentity(providerName: string): LLMIdentity {
  const normalized = providerName?.toLowerCase().trim();

  if (normalized && LLM_IDENTITY_REGISTRY[normalized]) {
    return LLM_IDENTITY_REGISTRY[normalized];
  }

  // Default to Haley
  return {
    initial: 'H',
    color: '#ff006e',
    name: 'Haley',
  };
}

export function getAllLLMIdentities(): Record<string, LLMIdentity> {
  return { ...LLM_IDENTITY_REGISTRY };
}

export function isRegisteredProvider(providerName: string): boolean {
  const normalized = providerName?.toLowerCase().trim();
  return normalized === 'haley';
}