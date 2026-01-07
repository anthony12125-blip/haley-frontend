/**
 * llmAdapter.ts
 *
 * Baby Haley adapter for R&D Soundboard
 *
 * R&D Phase: 100% Baby Haley via /logic/process
 * BUILD Phase: External LLMs (routed by Baby Haley based on task type)
 */

import type { LLMCall } from './rd_questionizer';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * Creates a Baby Haley call adapter for R&D operations
 * All R&D work goes through Baby Haley - no external LLM calls
 *
 * @returns LLMCall function that uses Baby Haley via /logic/process
 */
export function createBabyHaleyAdapter(): LLMCall {
  return async ({ system, user, temperature }) => {
    // Combine system and user prompts for Baby Haley
    const combinedMessage = `${system}\n\n${user}`;

    try {
      const response = await fetch(`${BACKEND_URL}/logic/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: combinedMessage,
          context: {
            mode: 'rd_soundboard',
            task: 'questionize_claims',
            temperature: temperature ?? 0.2,
          },
          // Force Baby Haley - no external LLM routing for R&D
          force_baby: true,
          skip_external_llm: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Baby Haley request failed: ${response.status}`);
      }

      const data = await response.json();

      // Extract response from Baby Haley
      const content = data.response || data.result?.response || data.result?.content || '';

      if (typeof content === 'string') {
        return content;
      } else if (content && typeof content === 'object' && 'text' in content) {
        return String(content.text);
      }

      throw new Error('Invalid response format from Baby Haley');
    } catch (error) {
      console.error('[BabyHaleyAdapter] Error:', error);
      throw error;
    }
  };
}

/**
 * @deprecated Use createBabyHaleyAdapter() for R&D operations
 * External LLMs should only be used in BUILD phase
 */
export function createLLMAdapter(provider: string = 'claude'): LLMCall {
  console.warn('[LLMAdapter] External LLM calls in R&D are deprecated. Use createBabyHaleyAdapter() instead.');
  // Redirect to Baby Haley for safety
  return createBabyHaleyAdapter();
}
