/**
 * Client-confirmed silence thresholds.
 *
 * Role 3 owns these shared values. Role 4 owns the conversation state machine,
 * timer cancellation and auto-advance behaviour that consume them.
 */
export const conversationTiming = {
  gentleCueMs: 3_000,
  repromptMs: 6_000,
  tapToHelpMs: 10_000,
  finalListeningMs: 5_000,
} as const;
