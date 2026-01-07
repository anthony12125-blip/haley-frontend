/**
 * Simple deterministic claims generator for AI R&D Soundboard
 */

import type { Claim, ClaimType, ClaimPriority } from './rd_questionizer';

export function generateClaims(concept: string, omega: string): Claim[] {
  const cleanConcept = concept.trim();
  const cleanOmega = omega.trim();

  if (!cleanConcept) {
    return [];
  }

  const claims: Claim[] = [
    {
      id: 'C1',
      type: 'capability' as ClaimType,
      priority: 'must' as ClaimPriority,
      statement: `Can ${cleanConcept} be implemented to meet ${cleanOmega} with current technology?`
    },
    {
      id: 'C2',
      type: 'integration' as ClaimType,
      priority: 'must' as ClaimPriority,
      statement: `Does ${cleanConcept} require specific API integrations to achieve ${cleanOmega}?`
    },
    {
      id: 'C3',
      type: 'ux' as ClaimType,
      priority: 'should' as ClaimPriority,
      statement: `Can ${cleanConcept} provide acceptable UX while delivering ${cleanOmega}?`
    },
    {
      id: 'C4',
      type: 'security' as ClaimType,
      priority: 'must' as ClaimPriority,
      statement: `Are there security implications for ${cleanConcept} given ${cleanOmega}?`
    },
    {
      id: 'C5',
      type: 'cost' as ClaimType,
      priority: 'should' as ClaimPriority,
      statement: `What are the cost constraints for implementing ${cleanConcept} to achieve ${cleanOmega}?`
    }
  ];

  return claims;
}
