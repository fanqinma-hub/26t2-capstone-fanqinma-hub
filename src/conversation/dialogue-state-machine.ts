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
import { sanitizeKoolMessage } from './child-safe-guardrails';

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

/**
 * Helper to resolve and sanitise the correct message/subtitle text for a given phase
 * based on the state's prompt/reprompt/help texts context.
 */
function getMessageForPhase(phase: DialoguePhase, state: ConversationState): string | undefined {
  let rawMsg: string | undefined;
  switch (phase) {
    case 'PROMPT':
    case 'LISTENING':
      rawMsg = state.currentPromptText || KoolMessages.prompt.default;
      break;
    case 'VISUAL_CUE':
      rawMsg = KoolMessages.visualCue.default;
      break;
    case 'REPROMPT':
      rawMsg = state.currentRepromptText || KoolMessages.reprompt.default;
      break;
    case 'TAP_TO_HELP':
      rawMsg = KoolMessages.tapToHelp.default;
      break;
    case 'FINAL_LISTEN':
      rawMsg = state.currentHelpText || KoolMessages.helpResponse.default;
      break;
    case 'AUTO_ADVANCE':
      rawMsg = KoolMessages.fallback.timeout;
      break;
    default:
      return undefined;
  }
  return sanitizeKoolMessage(rawMsg, phase);
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
    case 'START_PROMPT': {
      const promptMsg = sanitizeKoolMessage(
        event.customPromptText || KoolMessages.prompt.default,
        'PROMPT'
      );
      return {
        state: {
          ...createInitialState(),
          phase: 'PROMPT',
          promptId: event.promptId,
          currentPromptText: event.customPromptText,
          currentRepromptText: event.customRepromptText,
          currentHelpText: event.customHelpText,
        },
        action: action('PROMPT', {
          message: promptMsg,
          subtitleText: promptMsg,
          koolVariant: 'prompt',
        }),
      };
    }

    // -- Kool finished delivering the prompt text --------------------------
    case 'PROMPT_DELIVERED': {
      if (state.phase !== 'PROMPT') return noChange(state);
      const promptMsg = getMessageForPhase('LISTENING', state);
      return {
        state: { ...state, phase: 'LISTENING', elapsedMs: 0 },
        action: action('LISTENING', {
          message: promptMsg,
          subtitleText: promptMsg,
          shouldListen: true,
        }),
      };
    }

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
    case 'SKIP': {
      if (state.advanceLocked) return noChange(state);
      const nextPhase = 'AUTO_ADVANCE';
      const msg = getMessageForPhase(nextPhase, state);
      return {
        state: { ...state, phase: nextPhase, advanceLocked: true },
        action: action(nextPhase, {
          message: msg,
          subtitleText: msg,
          koolVariant: 'gentle',
        }),
      };
    }

    // -- Error (mic permission, STT failure, etc.) -------------------------
    case 'ERROR': {
      const msg = sanitizeKoolMessage(KoolMessages.fallback.error, 'IDLE');
      return {
        state: { ...state, phase: 'IDLE', lastError: event.error },
        action: action('IDLE', {
          message: msg,
          subtitleText: msg,
          koolVariant: 'gentle',
        }),
      };
    }

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
    const nextPhase = 'AUTO_ADVANCE';
    const msg = getMessageForPhase(nextPhase, state);
    return {
      state: { ...updated, phase: nextPhase, advanceLocked: true },
      action: action(nextPhase, {
        message: msg,
        subtitleText: msg,
        koolVariant: 'gentle',
      }),
    };
  }

  // 10 s → show tap-to-help
  if (elapsedMs >= TimingThresholds.TAP_TO_HELP_MS && state.phase !== 'FINAL_LISTEN') {
    const nextPhase = 'TAP_TO_HELP';
    const msg = getMessageForPhase(nextPhase, state);
    return {
      state: { ...updated, phase: nextPhase },
      action: action(nextPhase, {
        message: msg,
        subtitleText: msg,
        koolVariant: 'gentle',
        showTapHelp: true,
        shouldListen: true,
      }),
    };
  }

  // 6 s → Kool re-prompts
  if (elapsedMs >= TimingThresholds.REPROMPT_MS && state.phase !== 'TAP_TO_HELP') {
    const nextPhase = 'REPROMPT';
    const msg = getMessageForPhase(nextPhase, state);
    return {
      state: { ...updated, phase: nextPhase },
      action: action(nextPhase, {
        message: msg,
        subtitleText: msg,
        koolVariant: 'gentle',
        shouldListen: true,
      }),
    };
  }

  // 3 s → visual cue
  if (elapsedMs >= TimingThresholds.VISUAL_CUE_MS) {
    const targetPhase = (state.phase === 'REPROMPT' || state.phase === 'TAP_TO_HELP' || state.phase === 'FINAL_LISTEN')
      ? state.phase
      : 'VISUAL_CUE';
    const msg = getMessageForPhase(targetPhase, state);
    return {
      state: { ...updated, phase: targetPhase },
      action: action(targetPhase, {
        message: msg,
        subtitleText: msg,
        koolVariant: 'gentle',
        shouldListen: true,
      }),
    };
  }

  // Still within 0–3 s, keep listening
  const msg = getMessageForPhase('LISTENING', state);
  return {
    state: updated,
    action: action('LISTENING', {
      message: msg,
      subtitleText: msg,
      shouldListen: true,
    }),
  };
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
    const nextPhase = 'AUTO_ADVANCE';
    const msg = getMessageForPhase(nextPhase, state);
    return {
      state: {
        ...state,
        phase: nextPhase,
        attemptCount: newAttemptCount,
        advanceLocked: true,
      },
      action: action(nextPhase, {
        message: msg,
        subtitleText: msg,
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

  const nextPhase = 'FINAL_LISTEN';
  const msg = getMessageForPhase(nextPhase, state);

  return {
    state: {
      ...state,
      phase: nextPhase,
      scaffoldUsed: true,
      elapsedMs: TimingThresholds.TAP_TO_HELP_MS, // keep elapsed baseline
    },
    action: action(nextPhase, {
      message: msg,
      subtitleText: msg,
      koolVariant: 'gentle',
      shouldListen: true,
    }),
  };
}

// ---------------------------------------------------------------------------
// No-op helper – returns the same state with a neutral action
// ---------------------------------------------------------------------------

function noChange(state: ConversationState): TransitionResult {
  const msg = getMessageForPhase(state.phase, state);
  return { state, action: action(state.phase, { message: msg, subtitleText: msg }) };
}
