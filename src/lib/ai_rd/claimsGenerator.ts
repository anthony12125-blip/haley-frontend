/**
 * claimsGenerator.ts
 *
 * Claims generator for AI R&D Soundboard
 * Uses Baby Haley to generate feasibility claims from user's idea
 *
 * R&D = 100% Baby Haley
 */

import type { Claim, ClaimType, ClaimPriority } from './rd_questionizer';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * Generate claims using Baby Haley
 * Async version that calls the backend
 */
export async function generateClaimsAsync(concept: string, omega: string): Promise<Claim[]> {
  const cleanConcept = concept.trim();
  const cleanOmega = omega.trim();

  if (!cleanConcept) {
    return [];
  }

  const effectiveOmega = cleanOmega || 'viable and user-friendly implementation';

  try {
    const response = await fetch(`${BACKEND_URL}/logic/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: buildClaimsPrompt(cleanConcept, effectiveOmega),
        context: {
          mode: 'rd_soundboard',
          task: 'generate_claims',
        },
        force_baby: true,
        skip_external_llm: true,
      }),
    });

    if (!response.ok) {
      console.error('[ClaimsGenerator] Baby Haley request failed:', response.status);
      // Fall back to deterministic generation
      return generateClaimsDeterministic(cleanConcept, effectiveOmega);
    }

    const data = await response.json();
    const content = data.response || data.result?.response || '';

    // Parse Baby Haley's response into claims
    const claims = parseClaimsResponse(content, cleanConcept, effectiveOmega);

    if (claims.length === 0) {
      // Fall back to deterministic if parsing failed
      return generateClaimsDeterministic(cleanConcept, effectiveOmega);
    }

    return claims;
  } catch (error) {
    console.error('[ClaimsGenerator] Error calling Baby Haley:', error);
    // Fall back to deterministic generation
    return generateClaimsDeterministic(cleanConcept, effectiveOmega);
  }
}

/**
 * Synchronous deterministic claims generator (fallback)
 * Used when Baby Haley is unavailable
 */
export function generateClaims(concept: string, omega: string): Claim[] {
  const cleanConcept = concept.trim();
  const cleanOmega = omega.trim() || 'viable and user-friendly implementation';

  if (!cleanConcept) {
    return [];
  }

  return generateClaimsDeterministic(cleanConcept, cleanOmega);
}

function buildClaimsPrompt(concept: string, omega: string): string {
  return `You are an R&D feasibility analyst. Generate 5-8 testable feasibility claims for this project.

PROJECT IDEA: ${concept}
SUCCESS CRITERIA: ${omega}

Output format (one claim per line):
CLAIM|id=C1|type=capability|priority=must|statement=...
CLAIM|id=C2|type=integration|priority=should|statement=...

Types: capability, integration, ux, security, cost, latency, legal, data
Priorities: must (critical), should (important), could (nice-to-have)

Rules:
- Each claim must be testable/verifiable
- Focus on feasibility, not features
- Include technical, business, and user-facing claims
- Be specific to the project, not generic

Output ONLY the CLAIM lines, no other text.`;
}

function parseClaimsResponse(content: string, concept: string, omega: string): Claim[] {
  const claims: Claim[] = [];
  const lines = (content || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('CLAIM|'));

  for (const line of lines) {
    const fields = parseFields(line);
    const id = fields['id'];
    const statement = fields['statement'];

    if (!id || !statement) continue;

    claims.push({
      id,
      statement,
      type: (fields['type'] as ClaimType) || 'other',
      priority: (fields['priority'] as ClaimPriority) || 'should',
    });
  }

  return claims;
}

function parseFields(line: string): Record<string, string> {
  const parts = line.split('|').map(p => p.trim());
  const fields: Record<string, string> = {};
  for (const part of parts.slice(1)) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    fields[key] = val;
  }
  return fields;
}

/**
 * Deterministic fallback claims generator
 */
function generateClaimsDeterministic(concept: string, omega: string): Claim[] {
  const claims: Claim[] = [];

  const claimTemplates: Array<{
    statement: (c: string, o: string) => string;
    type: ClaimType;
    priority: ClaimPriority;
  }> = [
    {
      statement: (c, o) => `Can ${c} be implemented to meet ${o} with current technology?`,
      type: 'capability',
      priority: 'must'
    },
    {
      statement: (c, o) => `Does ${c} require specific API integrations to achieve ${o}?`,
      type: 'integration',
      priority: 'must'
    },
    {
      statement: (c, o) => `Can ${c} provide acceptable UX while delivering ${o}?`,
      type: 'ux',
      priority: 'should'
    },
    {
      statement: (c, o) => `Are there security implications for ${c} given ${o}?`,
      type: 'security',
      priority: 'must'
    },
    {
      statement: (c, o) => `What are the cost constraints for implementing ${c} to achieve ${o}?`,
      type: 'cost',
      priority: 'should'
    },
    {
      statement: (c, o) => `Can ${c} meet latency requirements specified in ${o}?`,
      type: 'latency',
      priority: 'should'
    },
    {
      statement: (c, o) => `Are there legal/compliance requirements for ${c} relative to ${o}?`,
      type: 'legal',
      priority: 'could'
    },
    {
      statement: (c, o) => `How should ${c} handle data privacy/storage given ${o}?`,
      type: 'data',
      priority: 'must'
    }
  ];

  const numClaims = Math.min(
    claimTemplates.length,
    Math.max(5, Math.min(8, Math.floor(concept.length / 20)))
  );

  for (let i = 0; i < numClaims; i++) {
    const template = claimTemplates[i];
    claims.push({
      id: `C${i + 1}`,
      statement: template.statement(concept, omega),
      type: template.type,
      priority: template.priority
    });
  }

  return claims;
}
