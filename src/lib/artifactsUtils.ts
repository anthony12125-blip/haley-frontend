// Artifacts extraction and cleaning utilities

import type { Artifact } from '@/types';

/**
 * Extract code blocks and other artifacts from message content
 * Returns both the extracted artifacts and cleaned content for TTS
 */
export function extractArtifacts(
  content: string,
  messageId: string
): { artifacts: Artifact[]; cleanedContent: string } {
  const artifacts: Artifact[] = [];
  let cleanedContent = content;

  // Regex to match markdown code blocks: ```language\ncode\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    const code = match[2].trim();

    artifacts.push({
      id: `${messageId}-artifact-${index}`,
      type: 'code',
      content: code,
      language,
      title: `Code Block ${index + 1}`,
      messageId,
    });

    index++;
  }

  // Remove code blocks from content for TTS
  cleanedContent = content.replace(codeBlockRegex, '\n[Code artifact]\n');

  return {
    artifacts,
    cleanedContent: cleanedContent.trim(),
  };
}

/**
 * Get cleaned content for TTS synthesis
 * Removes code blocks and other non-verbal artifacts
 */
export function getCleanContentForTTS(content: string): string {
  const { cleanedContent } = extractArtifacts(content, 'temp');
  return cleanedContent;
}
