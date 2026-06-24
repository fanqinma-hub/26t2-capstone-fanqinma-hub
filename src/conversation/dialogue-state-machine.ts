/**
 * dialogue-state-machine.ts
 *
 * Pure-function state machine for Kool's conversation timing flow.
 * Given the current ConversationState and a DialogueEvent, it returns
 * the next state plus a DialogueAction that tells the UI what to show.
 *
 * This module has ZERO side-effects — no timers, no React, no I/O.
 * Timer orchestration lives in the useConversationTimer hook.
 *
 * Owner: Role 4 – Conversation Flow, Timing & Child-Safe AI Lead
 *
 * Phase chain (silence path):
 *   IDLE → PROMPT → LISTENING → VISUAL_CUE → REPROMPT
 *        → TAP_TO_HELP → FINAL_LISTEN → AUTO_ADVANCE
 *
 * A USER_RESPONSE event at any listening phase short-circuits to
 * processing and then back to PROMPT (next question) or COMPLETE.
 */

import { TimingThresholds, KoolMessages, SafetyLimits } from '@/constants/conversation.config';
import type {
  ConversationState,
  DialogueAction,
  DialogueEvent,
  DialoguePhase,
  TransitionResult,
} from '@/types/dialogue.types';

// ---------------------------------------------------------------------------
// Factory – creates a fresh idle state
// ---------------------------------------------------------------------------

export function createInitialState(): ConversationState {
  return {
    phase: 'IDLE',
    promptId: null,
    elapsedMs: 0,
    scaffoldUsed: false,
    attemptCount: 0,
    advanceLocked: false,
    lastError: null,
  };
}

// ---------------------------------------------------------------------------
// Action builders – small helpers that pair a phase with its UI instruction
// ---------------------------------------------------------------------------

function action(
  phase: DialoguePhase,
  overrides: Partial<Omit<DialogueAction, 'phase'>> = {},
): DialogueAction {
  return { phase, ...overrides };
}

// ---------------------------------------------------------------------------
// Core transition function (pure)
// ---------------------------------------------------------------------------

export function transition(
  state: ConversationState,
  event: DialogueEvent,
): TransitionResult {
  switch (event.type) {
    // -- Start a new prompt ------------------------------------------------
    case 'START_PROMPT':
      return {
        state: {
          ...createInitialState(),
          phase: 'PROMPT',
          promptId: event.promptId,
        },
        action: action('PROMPT', {
          message: KoolMessages.prompt.default,
          koolVariant: 'prompt',
        }),
      };

    // -- Kool finished delivering the prompt text --------------------------
    case 'PROMPT_DELIVERED':
      if (state.phase !== 'PROMPT') return noChange(state);
      return {
        state: { ...state, phase: 'LISTENING', elapsedMs: 0 },
        action: action('LISTENING', { shouldListen: true }),
      };

    // -- Timer tick – drives the silence-timeout chain --------------------
    case 'TIMER_TICK':
      return handleTimerTick(state, event.elapsedMs);

    // -- Child spoke – process the response --------------------------------
    case 'USER_RESPONSE':
      return handleUserResponse(state);

    // -- Child tapped the help target --------------------------------------
    case 'TAP_HELP':
      return handleTapHelp(state);

    // -- Manual skip (dev / therapist mode) --------------------------------
    case 'SKIP':
      if (state.advanceLocked) return noChange(state);
      return {
        state: { ...state, phase: 'AUTO_ADVANCE', advanceLocked: true },
        action: action('AUTO_ADVANCE', {
          message: KoolMessages.fallback.default,
          koolVariant: 'gentle',
        }),
      };

    // -- Error (mic permission, STT failure, etc.) -------------------------
    case 'ERROR':
      return {
        state: { ...state, phase: 'IDLE', lastError: event.error },
        action: action('IDLE', {
          message: KoolMessages.fallback.error,
          koolVariant: 'gentle',
        }),
      };

    // -- Full reset --------------------------------------------------------
    case 'RESET':
      return {
        state: createInitialState(),
        action: action('IDLE'),
      };

    default:
      return noChange(state);
  }
}

// ---------------------------------------------------------------------------
// Timer tick handler – the heart of the 3 / 6 / 10 / final-5 s flow
// ---------------------------------------------------------------------------

function handleTimerTick(
  state: ConversationState,
  elapsedMs: number,
): TransitionResult {
  // Only tick when we are in a listening-related phase
  const listeningPhases: DialoguePhase[] = [
    'LISTENING',
    'VISUAL_CUE',
    'REPROMPT',
    'TAP_TO_HELP',
    'FINAL_LISTEN',
  ];
  if (!listeningPhases.includes(state.phase)) {
    return noChange(state);
  }

  const updated: ConversationState = { ...state, elapsedMs };

  // Final listen window expired → auto-advance
  if (elapsedMs >= TimingThresholds.FINAL_LISTEN_MS) {
    if (state.advanceLocked) return noChange(state);
    return {
      state: { ...updated, phase: 'AUTO_ADVANCE', advanceLocked: true },
      action: action('AUTO_ADVANCE', {
        message: KoolMessages.fallback.timeout,
        koolVariant: 'gentle',
      }),
    };
  }

  // 10 s → show tap-to-help
  if (elapsedMs >= TimingThresholds.TAP_TO_HELP_MS && state.phase !== 'FINAL_LISTEN') {
    if (state.phase === 'TAP_TO_HELP') return { state: updated, action: action('TAP_TO_HELP', { showTapHelp: true, shouldListen: true }) };
    return {
      state: { ...updated, phase: 'TAP_TO_HELP' },
      action: action('TAP_TO_HELP', {
        message: KoolMessages.tapToHelp.default,
        koolVariant: 'gentle',
        showTapHelp: true,
        shouldListen: true,
      }),
    };
  }

  // 6 s → Kool re-prompts
  if (elapsedMs >= TimingThresholds.REPROMPT_MS && state.phase !== 'TAP_TO_HELP') {
    if (state.phase === 'REPROMPT') return { state: updated, action: action('REPROMPT', { shouldListen: true }) };
    return {
      state: { ...updated, phase: 'REPROMPT' },
      action: action('REPROMPT', {
        message: KoolMessages.reprompt.default,
        koolVariant: 'gentle',
        shouldListen: true,
      }),
    };
  }

  // 3 s → visual cue
  if (elapsedMs >= TimingThresholds.VISUAL_CUE_MS) {
    if (state.phase === 'VISUAL_CUE' || state.phase === 'REPROMPT') return { state: updated, action: action(state.phase, { shouldListen: true }) };
    return {
      state: { ...updated, phase: 'VISUAL_CUE' },
      action: action('VISUAL_CUE', {
        message: KoolMessages.visualCue.default,
        koolVariant: 'gentle',
        shouldListen: true,
      }),
    };
  }

  // Still within 0–3 s, keep listening
  return { state: updated, action: action('LISTENING', { shouldListen: true }) };
}

// ---------------------------------------------------------------------------
// User response handler
// ---------------------------------------------------------------------------

function handleUserResponse(state: ConversationState): TransitionResult {
  // Ignore responses when we are not in a listening-capable phase
  const canRespond: DialoguePhase[] = [
    'LISTENING',
    'VISUAL_CUE',
    'REPROMPT',
    'TAP_TO_HELP',
    'FINAL_LISTEN',
  ];
  if (!canRespond.includes(state.phase)) {
    return noChange(state);
  }

  const newAttemptCount = state.attemptCount + 1;

  // Too many attempts → auto-advance
  if (newAttemptCount >= SafetyLimits.MAX_ATTEMPTS_PER_PROMPT) {
    return {
      state: {
        ...state,
        phase: 'AUTO_ADVANCE',
        attemptCount: newAttemptCount,
        advanceLocked: true,
      },
      action: action('AUTO_ADVANCE', {
        message: KoolMessages.fallback.default,
        koolVariant: 'gentle',
      }),
    };
  }

  // Successful response → the caller (hook) decides whether to advance
  // to the next prompt or mark COMPLETE.  We transition to IDLE so the
  // hook can call START_PROMPT for the next question.
  return {
    state: {
      ...state,
      phase: 'IDLE',
      attemptCount: newAttemptCount,
      elapsedMs: 0,
    },
    action: action('IDLE'),
  };
}

// ---------------------------------------------------------------------------
// Tap-to-help handler
// ---------------------------------------------------------------------------

function handleTapHelp(state: ConversationState): TransitionResult {
  if (state.phase !== 'TAP_TO_HELP') {
    return noChange(state);
  }

  return {
    state: {
      ...state,
      phase: 'FINAL_LISTEN',
      scaffoldUsed: true,
      elapsedMs: TimingThresholds.TAP_TO_HELP_MS, // keep elapsed baseline
    },
    action: action('FINAL_LISTEN', {
      message: KoolMessages.helpResponse.default,
      koolVariant: 'gentle',
      shouldListen: true,
    }),
  };
}

// ---------------------------------------------------------------------------
// No-op helper – returns the same state with a neutral action
// ---------------------------------------------------------------------------

function noChange(state: ConversationState): TransitionResult {
  return { state, action: action(state.phase) };
}
