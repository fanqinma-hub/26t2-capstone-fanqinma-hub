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
// Clinical forbidden words & rules (PROJ-15)
// ---------------------------------------------------------------------------

const CLINICAL_FORBIDDEN_REGEX = /\b(wrong|incorrect|try\s+again|no|mistake)\b/i;

// ---------------------------------------------------------------------------
// Child-safe text validation
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the text passes all child-safety checks.
 *
 * Checks performed:
 * 1. Not empty or whitespace-only.
 * 2. Within the maximum message length.
 * 3. Does not contain any blocked topics from configuration.
 * 4. Does not contain any clinical forbidden words (PROJ-15).
 */
export function isChildSafe(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  if (text.length > SafetyLimits.MAX_MESSAGE_LENGTH) return false;

  const lowerText = text.toLowerCase();
  
  // Check original blocked topics (substring match)
  const containsBlockedTopic = SafetyLimits.BLOCKED_TOPICS.some((topic) => lowerText.includes(topic));
  if (containsBlockedTopic) return false;

  // Check clinical forbidden words (exact word boundary match)
  if (CLINICAL_FORBIDDEN_REGEX.test(lowerText)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Sentence count & response formatting rules (PROJ-15)
// ---------------------------------------------------------------------------

/**
 * Restricts the output text to at most 2 sentences.
 */
export function enforceSentenceLimit(text: string): string {
  const sentences = text.match(/[^.!?]+([.!?]+|$)/g) || [text];
  if (sentences.length > 2) {
    return sentences.slice(0, 2).join('').trim();
  }
  return text.trim();
}

/**
 * Enforces sentence limits (1-2 sentences) and appends engagement prompt "Ready for the next one?"
 * in appropriate phases/contexts.
 */
export function applyResponseRules(
  text: string,
  phase?: DialoguePhase,
  appendEngagement = false
): string {
  let cleaned = text.replace(/\s+/g, ' ').trim();

  // Engagement question is appropriate for AUTO_ADVANCE phase or when explicitly requested (e.g. recasts/celebrations)
  const shouldAppend = phase === 'AUTO_ADVANCE' || appendEngagement;

  if (shouldAppend) {
    const sentences = cleaned.match(/[^.!?]+([.!?]+|$)/g) || [cleaned];
    const firstSentence = sentences[0].trim();
    const formattedFirst = /[.!?]$/.test(firstSentence) ? firstSentence : firstSentence + '!';
    return `${formattedFirst} Ready for the next one?`;
  }

  return enforceSentenceLimit(cleaned);
}

// ---------------------------------------------------------------------------
// Indirect Recast Generator (PROJ-15)
// ---------------------------------------------------------------------------

/**
 * Generates an indirect demonstration recast statement instead of a corrective one.
 * Example: noun='watermelon', adjective='big' -> "A BIG watermelon! So big!"
 */
export function generateClinicalRecast(noun: string, adjective: string): string {
  const formattedNoun = noun.trim().toLowerCase();
  const formattedAdjective = adjective.trim();

  // Determine standard indefinite article 'A' or 'An'
  const startsWithVowel = ['a', 'e', 'i', 'o', 'u'].includes(formattedAdjective[0].toLowerCase());
  const article = startsWithVowel ? 'An' : 'A';

  const recastMsg = `${article} ${formattedAdjective.toUpperCase()} ${formattedNoun}! So ${formattedAdjective.toLowerCase()}!`;

  // By default, a recast is a conversational statement of exactly 2 sentences
  return enforceSentenceLimit(recastMsg);
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
    return applyResponseRules(getFallbackMessage(phase), phase);
  }

  const processed = applyResponseRules(cleaned, phase);

  // Enforce length limit by truncating at last word boundary
  if (processed.length > SafetyLimits.MAX_MESSAGE_LENGTH) {
    const truncated = processed.slice(0, SafetyLimits.MAX_MESSAGE_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.slice(0, lastSpace) + '...' : truncated;
  }

  return processed;
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
    return applyResponseRules(getFallbackMessage(phase), phase);
  }

  return sanitizeKoolMessage(llmText, phase);
}
