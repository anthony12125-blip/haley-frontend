import type { Message } from '@/types';

export interface MigrationPayload {
  version: string;
  type: string;
  generated_at: string;
  scope: 'single_message' | 'full_chat';
  summary: {
    purpose: string;
    instructions: string[];
    outputs: string[];
    data_blocks: string[];
    constraints: string[];
  };
  meta: {
    normalized: boolean;
    ai_agnostic: boolean;
    source_scope: 'message' | 'chat';
    safe_for: string[];
  };
}

/**
 * Deterministic migration engine that converts chat messages
 * to AI-agnostic summaries suitable for cross-platform transfer
 */
export class MigrationEngine {
  private static readonly FILLER_PATTERNS = [
    /^(sure|okay|alright|got it|understood|absolutely|of course)[,!.]?\s*/gi,
    /^(hello|hi|hey|greetings)[,!.]?\s*/gi,
    /^(i'll|i will|let me|i'm going to)\s+/gi,
    /\s+(for you|to help|happy to|glad to)\s*/gi,
  ];

  private static readonly PLATFORM_PATTERNS = [
    /claude|gpt|gemini|chatgpt|openai|anthropic|google/gi,
    /as an ai|as a language model|i'm an ai/gi,
    /in this conversation|in this chat/gi,
  ];

  /**
   * Clean and normalize text by removing filler and platform-specific references
   */
  private static normalizeText(text: string): string {
    let normalized = text;

    // Remove filler patterns
    this.FILLER_PATTERNS.forEach(pattern => {
      normalized = normalized.replace(pattern, '');
    });

    // Remove platform-specific patterns
    this.PLATFORM_PATTERNS.forEach(pattern => {
      normalized = normalized.replace(pattern, '[AI]');
    });

    // Trim and clean up whitespace
    normalized = normalized.trim().replace(/\s+/g, ' ');

    return normalized;
  }

  /**
   * Extract code blocks from message content
   */
  private static extractCodeBlocks(content: string): string[] {
    const codeBlockPattern = /```[\s\S]*?```/g;
    const matches = content.match(codeBlockPattern);
    return matches || [];
  }

  /**
   * Extract instructions (imperative statements)
   */
  private static extractInstructions(content: string): string[] {
    const instructions: string[] = [];
    const lines = content.split('\n');

    const imperativePatterns = [
      /^(create|add|remove|update|modify|delete|implement|fix|change|replace|configure)\s+/i,
      /^(ensure|make sure|verify|check|validate)\s+/i,
      /^(install|run|execute|build|deploy|test)\s+/i,
    ];

    lines.forEach(line => {
      const trimmed = line.trim();
      const hasImperative = imperativePatterns.some(pattern => pattern.test(trimmed));

      if (hasImperative && trimmed.length > 10) {
        instructions.push(this.normalizeText(trimmed));
      }
    });

    return instructions;
  }

  /**
   * Extract outputs (completed actions, results)
   */
  private static extractOutputs(content: string): string[] {
    const outputs: string[] = [];
    const lines = content.split('\n');

    const outputPatterns = [
      /^(created|added|removed|updated|modified|deleted|implemented|fixed|changed|replaced|configured)\s+/i,
      /^(installed|ran|executed|built|deployed|tested)\s+/i,
      /✅|✓|completed|done|finished/i,
    ];

    lines.forEach(line => {
      const trimmed = line.trim();
      const hasOutput = outputPatterns.some(pattern => pattern.test(trimmed));

      if (hasOutput && trimmed.length > 10) {
        outputs.push(this.normalizeText(trimmed));
      }
    });

    return outputs;
  }

  /**
   * Extract constraints (rules, requirements, limitations)
   */
  private static extractConstraints(content: string): string[] {
    const constraints: string[] = [];
    const lines = content.split('\n');

    const constraintPatterns = [
      /^(must|should|cannot|do not|never|always)\s+/i,
      /^(required|optional|mandatory|forbidden)\s*:/i,
      /^(constraint|limitation|requirement|rule)\s*:/i,
    ];

    lines.forEach(line => {
      const trimmed = line.trim();
      const hasConstraint = constraintPatterns.some(pattern => pattern.test(trimmed));

      if (hasConstraint && trimmed.length > 10) {
        constraints.push(this.normalizeText(trimmed));
      }
    });

    return constraints;
  }

  /**
   * Infer purpose from message content
   */
  private static inferPurpose(content: string, scope: 'message' | 'chat'): string {
    const normalized = this.normalizeText(content);
    const firstSentence = normalized.split(/[.!?]/)[0];

    if (scope === 'message') {
      return firstSentence.substring(0, 150) || 'Response migration';
    }

    return 'Conversation migration';
  }

  /**
   * Migrate a single message to AI-agnostic summary
   */
  static migrateSingleMessage(message: Message): MigrationPayload {
    const content = message.content;
    const codeBlocks = this.extractCodeBlocks(content);
    const instructions = this.extractInstructions(content);
    const outputs = this.extractOutputs(content);
    const constraints = this.extractConstraints(content);
    const purpose = this.inferPurpose(content, 'message');

    return {
      version: '1.1',
      type: 'ai_chat_migration_summary',
      generated_at: new Date().toISOString(),
      scope: 'single_message',
      summary: {
        purpose,
        instructions,
        outputs,
        data_blocks: codeBlocks,
        constraints,
      },
      meta: {
        normalized: true,
        ai_agnostic: true,
        source_scope: 'message',
        safe_for: ['Claude', 'GPT', 'Gemini', 'Other LLMs'],
      },
    };
  }

  /**
   * Migrate full chat to AI-agnostic summary
   */
  static migrateFullChat(messages: Message[]): MigrationPayload {
    const allContent = messages.map(m => m.content).join('\n\n');
    const codeBlocks = this.extractCodeBlocks(allContent);
    const instructions = this.extractInstructions(allContent);
    const outputs = this.extractOutputs(allContent);
    const constraints = this.extractConstraints(allContent);
    const purpose = this.inferPurpose(allContent, 'chat');

    // Deduplicate arrays
    const uniqueInstructions = Array.from(new Set(instructions));
    const uniqueOutputs = Array.from(new Set(outputs));
    const uniqueConstraints = Array.from(new Set(constraints));

    return {
      version: '1.1',
      type: 'ai_chat_migration_summary',
      generated_at: new Date().toISOString(),
      scope: 'full_chat',
      summary: {
        purpose,
        instructions: uniqueInstructions,
        outputs: uniqueOutputs,
        data_blocks: codeBlocks,
        constraints: uniqueConstraints,
      },
      meta: {
        normalized: true,
        ai_agnostic: true,
        source_scope: 'chat',
        safe_for: ['Claude', 'GPT', 'Gemini', 'Other LLMs'],
      },
    };
  }

  /**
   * Copy payload to system clipboard
   */
  static async copyToClipboard(payload: MigrationPayload): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(payload, null, 2);
      await navigator.clipboard.writeText(jsonString);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}
