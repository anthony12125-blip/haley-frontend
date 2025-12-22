/**
 * llmAdapter.ts
 * 
 * Adapter to convert Haley OS backend API to LLMCall signature for rd_questionizer
 */

import { sendMessageSync } from '../haleyApi';
import type { LLMCall } from './rd_questionizer';

/**
 * Creates an LLM call adapter using the existing Haley OS backend
 * 
 * @param provider - AI provider to use (claude, gemini, gpt, etc.)
 * @returns LLMCall function that can be used with rd_questionizer
 */
export function createLLMAdapter(provider: string = 'claude'): LLMCall {
  return async ({ system, user, temperature }) => {
    // Combine system and user prompts into a single message
    // The backend doesn't support separate system prompts, so we prefix the message
    const combinedMessage = `[System Instructions]\n${system}\n\n[User Query]\n${user}`;
    
    try {
      const response = await sendMessageSync(combinedMessage, provider);
      
      if (response.status === 'error') {
        throw new Error(response.error_msg || 'LLM call failed');
      }
      
      // Extract the text response from the result
      const content = response.result?.response || response.result?.content || '';
      
      if (typeof content === 'string') {
        return content;
      }
      
      // If content is an object with text property
      if (content && typeof content === 'object' && 'text' in content) {
        return String(content.text);
      }
      
      throw new Error('Invalid response format from LLM');
    } catch (error) {
      console.error('[LLMAdapter] Error:', error);
      throw error;
    }
  };
}
