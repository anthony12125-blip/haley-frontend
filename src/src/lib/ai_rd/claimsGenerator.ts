/**
 * claimsGenerator.ts
 * 
 * Simple deterministic claims generator for AI R&D Soundboard
 * Generates feasibility claims from concept and omega without calling LLMs
 */

import type { Claim, ClaimType, ClaimPriority } from './rd_questionizer';

/**
 * Generate deterministic claims from concept and omega
 * This is a simple stub for Delta 1 - real deterministic engine comes next
 */
export function generateClaims(concept: string, omega: string): Claim[] {
  const claims: Claim[] = [];
  
  // Clean inputs
  const cleanConcept = concept.trim();
  const cleanOmega = omega.trim();
  
  if (!cleanConcept || !cleanOmega) {
    return [];
  }
  
  // Generate claims based on simple heuristics
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
  
  // Generate 5-8 claims (vary based on input length)
  const numClaims = Math.min(
    claimTemplates.length,
    Math.max(5, Math.min(8, Math.floor(cleanConcept.length / 20)))
  );
  
  for (let i = 0; i < numClaims; i++) {
    const template = claimTemplates[i];
    claims.push({
      id: `C${i + 1}`,
      statement: template.statement(cleanConcept, cleanOmega),
      type: template.type,
      priority: template.priority
    });
  }
  
  return claims;
}
