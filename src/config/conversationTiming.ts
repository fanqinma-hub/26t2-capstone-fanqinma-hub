// From now on, all 3-second, 6-second, 10-second, and 5-second intervals will be taken from here.
//Do not scatter them in ActivityScreen.tsx or useActivity1DemoFlow.ts.
export const CONVERSATION_TIMING = {
  gentleCueMs: 3_000,
  repromptMs: 6_000,
  tapHelpAvailableMs: 10_000,
  finalListeningAfterHelpMs: 5_000,

  // Demo-only helper timings. These are not clinical thresholds.
  clueReadMs: 1_200,
  microphoneListeningMs: 1_200,
  processingMs: 1_000,
  successCelebrationMs: 1_800,
} as const;

export type ConversationTiming = typeof CONVERSATION_TIMING;