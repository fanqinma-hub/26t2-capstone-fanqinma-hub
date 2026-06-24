/**
 * dialogue-actions.ts
 *
 * Generates the scripted dialogue strings that Kool uses during the
 * conversation flow: recasts, re-prompts, help responses and fallbacks.
 *
 * All output is deterministic and child-safe.  The optional LLM adapter
 * (PROJ-15) may replace some of these in later sprints, but these
 * functions will always serve as the guaranteed fallback.
 *
 * Owner: Role 4 – Conversation Flow, Timing & Child-Safe AI Lead
 */

import { KoolMessages } from '@/constants/conversation.config';
import { sanitizeKoolMessage } from './child-safe-guardrails';

// ---------------------------------------------------------------------------
// Recast – used when the child responds at Tier 1 (noun only)
// ---------------------------------------------------------------------------

/**
 * Generates a Kool recast that models the target adjective naturally.
 *
 * Example:
 *   generateRecast('tree', 'big') → "Yes! I can see the tree. It is a big tree!"
 *
 * @param noun       The noun the child mentioned.
 * @param adjective  The target size adjective for this prompt.
 */
export function generateRecast(noun: string, adjective: string): string {
  const message = KoolMessages.recast.template
    .replace('{noun}', noun)
    .replace('{adjective}', adjective)
    .replace('{noun}', noun); // template has {noun} twice

  return sanitizeKoolMessage(message, 'PROMPT');
}

// ---------------------------------------------------------------------------
// Re-prompt – Kool re-phrases the question after 6 s of silence
// ---------------------------------------------------------------------------

/**
 * Returns a re-prompt message.  If an activity-specific re-prompt is
 * provided it is sanitised; otherwise the default is used.
 *
 * @param customReprompt  Optional activity-specific re-prompt text.
 */
export function generateReprompt(customReprompt?: string): string {
  if (customReprompt) {
    return sanitizeKoolMessage(customReprompt, 'REPROMPT');
  }
  return KoolMessages.reprompt.default;
}

// ---------------------------------------------------------------------------
// Help response – shown after the child taps "help"
// ---------------------------------------------------------------------------

/**
 * Returns a help message that scaffolds the child's response.
 *
 * @param customHelp  Optional activity-specific help text.
 */
export function generateHelpResponse(customHelp?: string): string {
  if (customHelp) {
    return sanitizeKoolMessage(customHelp, 'FINAL_LISTEN');
  }
  return KoolMessages.helpResponse.default;
}

// ---------------------------------------------------------------------------
// Celebration – positive feedback for Tier 2 / Tier 3 responses
// ---------------------------------------------------------------------------

/**
 * Returns a celebration message based on the tier level.
 *
 * @param tier  The tier classification (2 or 3).
 */
export function generateCelebration(tier: 2 | 3): string {
  return tier === 3
    ? KoolMessages.celebration.tier3
    : KoolMessages.celebration.tier2;
}

// ---------------------------------------------------------------------------
// Fallback – safe message when something unexpected happens
// ---------------------------------------------------------------------------

/**
 * Returns a deterministic fallback for the given reason.
 *
 * @param reason  Why the fallback is needed.
 */
export function generateFallback(
  reason: 'timeout' | 'error' | 'default' = 'default',
): string {
  return KoolMessages.fallback[reason];
}
