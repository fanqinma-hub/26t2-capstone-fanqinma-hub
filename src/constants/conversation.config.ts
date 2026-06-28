/**
 * conversation.config.ts
 *
 * Centralised configuration constants for the Kool conversation / timing
 * engine.  The client specified that timing values should live in a single
 * config file so they can be tuned without editing screen components.
 *
 * Owner: Role 4 – Conversation Flow, Timing & Child-Safe AI Lead
 * Ref:   Client timing thresholds — 3 s / 6 s / 10 s / final 5 s
 */

// ---------------------------------------------------------------------------
// Timing thresholds (milliseconds)
// ---------------------------------------------------------------------------

export const TimingThresholds = {
  /** 3 s – show a gentle visual cue if the child hasn't spoken. */
  VISUAL_CUE_MS: 3_000,
  /** 6 s – Kool re-phrases the question verbally. */
  REPROMPT_MS: 6_000,
  /** 10 s – a "tap here for help" target appears on screen. */
  TAP_TO_HELP_MS: 10_000,
  /** 15 s (10 + 5) – final listening window ends, auto-advance. */
  FINAL_LISTEN_MS: 15_000,
  /** Interval at which the timer fires tick events. */
  TICK_INTERVAL_MS: 250,
} as const;

// ---------------------------------------------------------------------------
// Kool's scripted messages – deterministic, child-safe fallback copy.
// These are used when no activity-specific content is provided.
// ---------------------------------------------------------------------------

export const KoolMessages = {
  prompt: {
    default: 'What can you see in this picture?',
    encourage: 'Have a go! Tell me what you see.',
  },
  visualCue: {
    default: 'Take your time. You can do it!',
  },
  reprompt: {
    default: 'Can you tell me about something in the picture?',
    alternative: 'What about the things on the table? Are they big or small?',
  },
  tapToHelp: {
    default: 'Need a hand? Tap here and I will help you.',
  },
  helpResponse: {
    default: 'Look! I can see something big in the picture. Can you see it too?',
  },
  fallback: {
    default: 'That is okay! Let us look at the next picture together.',
    timeout: 'Great effort! Let us move on to the next one.',
    error: 'Oops, something went wrong. Let us try the next picture.',
  },
  recast: {
    /** Used when the child responds at Tier 1 (noun only, no size word). */
    template: 'Yes! I can see the {noun}. It is a {adjective} {noun}!',
  },
  celebration: {
    tier2: 'Wonderful! You used a great size word!',
    tier3: 'Amazing! What a fantastic description!',
  },
} as const;

// ---------------------------------------------------------------------------
// Safety limits – prevent runaway loops and enforce child-safe boundaries
// ---------------------------------------------------------------------------

export const SafetyLimits = {
  /** Maximum voice attempts per prompt before auto-advancing. */
  MAX_ATTEMPTS_PER_PROMPT: 3,
  /** Maximum character length for any Kool message (including LLM output). */
  MAX_MESSAGE_LENGTH: 120,
  /** Maximum number of prompts per activity. */
  MAX_PROMPTS_PER_ACTIVITY: 10,
  /** Topics that must never appear in Kool's output. */
  BLOCKED_TOPICS: [
    'diagnosis',
    'disorder',
    'wrong',
    'bad',
    'stupid',
    'fail',
    'score',
    'test',
    'grade',
    'punishment',
  ] as readonly string[],
  /** Allow-list of tones for optional LLM wording. */
  ALLOWED_TONES: [
    'warm',
    'encouraging',
    'playful',
    'curious',
    'gentle',
  ] as readonly string[],
} as const;
