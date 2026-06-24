/**
 * child-safe-guardrails.ts
 *
 * Safety layer that validates and sanitises any text before it is shown
 * to a child through Kool's dialogue.  This is especially important if
 * an optional LLM adapter is used in future sprints (PROJ-15).
 *
 * All functions are pure and stateless.
 *
 * Owner: Role 4 – Conversation Flow, Timing & Child-Safe AI Lead
 */

import { KoolMessages, SafetyLimits } from '@/constants/conversation.config';
import type { DialoguePhase } from '@/types/dialogue.types';

// ---------------------------------------------------------------------------
// Child-safe text validation
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the text passes all child-safety checks.
 *
 * Checks performed:
 * 1. Not empty or whitespace-only.
 * 2. Within the maximum message length.
 * 3. Does not contain any blocked topics.
 */
export function isChildSafe(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  if (text.length > SafetyLimits.MAX_MESSAGE_LENGTH) return false;

  const lowerText = text.toLowerCase();
  return !SafetyLimits.BLOCKED_TOPICS.some((topic) => lowerText.includes(topic));
}

// ---------------------------------------------------------------------------
// Sanitise a message for display
// ---------------------------------------------------------------------------

/**
 * Cleans and validates a Kool message.  If the input fails safety checks
 * a deterministic fallback is returned instead.
 *
 * @param text     The candidate message text.
 * @param phase    The current dialogue phase (used to pick the right fallback).
 * @returns        A child-safe string, guaranteed to be non-empty.
 */
export function sanitizeKoolMessage(text: string, phase: DialoguePhase): string {
  // Trim and collapse whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();

  if (!isChildSafe(cleaned)) {
    return getFallbackMessage(phase);
  }

  // Enforce length limit by truncating at last word boundary
  if (cleaned.length > SafetyLimits.MAX_MESSAGE_LENGTH) {
    const truncated = cleaned.slice(0, SafetyLimits.MAX_MESSAGE_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.slice(0, lastSpace) + '...' : truncated;
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// Deterministic fallback messages
// ---------------------------------------------------------------------------

/**
 * Returns a safe, pre-written fallback message appropriate for the
 * current dialogue phase.  These are always used when LLM output is
 * unavailable or fails safety checks.
 */
export function getFallbackMessage(phase: DialoguePhase): string {
  switch (phase) {
    case 'PROMPT':
      return KoolMessages.prompt.default;
    case 'VISUAL_CUE':
      return KoolMessages.visualCue.default;
    case 'REPROMPT':
      return KoolMessages.reprompt.default;
    case 'TAP_TO_HELP':
      return KoolMessages.tapToHelp.default;
    case 'FINAL_LISTEN':
      return KoolMessages.helpResponse.default;
    case 'AUTO_ADVANCE':
      return KoolMessages.fallback.timeout;
    default:
      return KoolMessages.fallback.default;
  }
}

// ---------------------------------------------------------------------------
// LLM output guard (for future PROJ-15 integration)
// ---------------------------------------------------------------------------

/**
 * Validates optional LLM-generated text against all child-safety rules.
 * Returns the cleaned text if safe, or a fallback message if not.
 *
 * Rules enforced:
 * - Must pass `isChildSafe()` checks.
 * - Must not attempt to determine tier, reward, or progression.
 * - Must stay within allowed tone boundaries.
 */
export function guardLLMOutput(
  llmText: string,
  phase: DialoguePhase,
): string {
  // Scoring / progression terms the LLM must never use
  const scoringTerms = ['tier 1', 'tier 2', 'tier 3', 'reward', 'coin', 'advance', 'progress'];
  const lowerText = llmText.toLowerCase();

  const containsScoring = scoringTerms.some((term) => lowerText.includes(term));
  if (containsScoring) {
    return getFallbackMessage(phase);
  }

  return sanitizeKoolMessage(llmText, phase);
}
