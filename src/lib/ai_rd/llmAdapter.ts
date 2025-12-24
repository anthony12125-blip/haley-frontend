/**
 * llmAdapter.ts
 *
 * Adapter to convert Haley OS backend API to LLMCall signature for rd_questionizer
 */

import { sendMessage } from '../haleyApi';
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
      // Collect streaming response into full text
      let fullResponse = '';

      return new Promise((resolve, reject) => {
        sendMessage(
          combinedMessage,
          provider,
          // onToken - accumulate response
          (token: string) => {
            fullResponse += token;
          },
          // onComplete - resolve with full response
          (response) => {
            if (fullResponse) {
              resolve(fullResponse);
            } else {
              // Fallback to extracting from response object
              const content = response.result?.response || response.result?.content || '';
              if (typeof content === 'string') {
                resolve(content);
              } else if (content && typeof content === 'object' && 'text' in content) {
                resolve(String(content.text));
              } else {
                reject(new Error('Invalid response format from LLM'));
              }
            }
          },
          // onError - reject promise
          (error: string) => {
            reject(new Error(error || 'LLM call failed'));
          }
        );
      });
    } catch (error) {
      console.error('[LLMAdapter] Error:', error);
      throw error;
    }
  };
}
