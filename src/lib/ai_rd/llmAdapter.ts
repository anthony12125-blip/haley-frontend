/**
 * LLM Adapter for AI R&D Soundboard
 * Adapter to convert Haley OS backend API to LLMCall signature for rd_questionizer
 */

import { LLMCall } from './rd_questionizer';
import { sendMessage } from '../haleyApi';

/**
 * Creates an LLM call adapter using the existing Haley OS backend
 *
 * @param provider - AI provider to use (claude, gemini, gpt, etc.)
 * @returns LLMCall function that can be used with rd_questionizer
 */
export function createLLMAdapter(provider: string = 'claude'): LLMCall {
  return async (system: string, user: string, temperature?: number): Promise<string> => {
    const combinedMessage = `[System Instructions]\n${system}\n\n[User Query]\n${user}`;

    try {
      let fullResponse = '';

      return new Promise((resolve, reject) => {
        sendMessage(
          combinedMessage,
          provider,
          (token: string) => {
            fullResponse += token;
          },
          (response) => {
            if (fullResponse) {
              resolve(fullResponse);
            } else {
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
