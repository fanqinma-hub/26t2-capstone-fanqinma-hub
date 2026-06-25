/**
 * dialogue.types.ts
 *
 * Core TypeScript types for the Role 4 conversation / timing engine.
 * These types define the contract that other roles (UI, scoring, report)
 * depend on when interacting with Kool's dialogue flow.
 *
 * Owner: Role 4 – Conversation Flow, Timing & Child-Safe AI Lead
 */

import type { KoolDialogueVariant } from '@/components/child-ui/KoolDialogue';

// ---------------------------------------------------------------------------
// Dialogue phases – the state machine moves through these in order when a
// child is silent.  A successful voice response can short-circuit the chain.
// ---------------------------------------------------------------------------

export type DialoguePhase =
  | 'IDLE'           // No active prompt
  | 'PROMPT'         // Kool is speaking / showing a question
  | 'LISTENING'      // Waiting for the child to respond
  | 'VISUAL_CUE'    // 3 s – gentle visual encouragement
  | 'REPROMPT'       // 6 s – Kool re-phrases the question
  | 'TAP_TO_HELP'   // 10 s – "tap here for help" appears
  | 'FINAL_LISTEN'  // After help shown, final 5 s listening window
  | 'AUTO_ADVANCE'  // Timeout – move to next prompt automatically
  | 'COMPLETE';     // All prompts finished for this activity

// ---------------------------------------------------------------------------
// Events that can be dispatched into the state machine
// ---------------------------------------------------------------------------

export type DialogueEvent =
  | {
      type: 'START_PROMPT';
      promptId: string;
      customPromptText?: string;
      customRepromptText?: string;
      customHelpText?: string;
    }
  | { type: 'PROMPT_DELIVERED' }           // Kool finished speaking
  | { type: 'TIMER_TICK'; elapsedMs: number }
  | { type: 'USER_RESPONSE'; transcript: string }
  | { type: 'TAP_HELP' }
  | { type: 'SKIP' }                       // Manual skip (dev / therapist)
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// Action emitted by the state machine – tells the UI / system what to do
// ---------------------------------------------------------------------------

export interface DialogueAction {
  /** The phase the machine just entered. */
  phase: DialoguePhase;
  /** Optional message for Kool to display. */
  message?: string;
  /** Optional subtitle text for UI to render. */
  subtitleText?: string;
  /** Which KoolDialogue visual variant to use. */
  koolVariant?: KoolDialogueVariant;
  /** If true, the microphone should be activated. */
  shouldListen?: boolean;
  /** If true, the tap-to-help target should be visible. */
  showTapHelp?: boolean;
}

// ---------------------------------------------------------------------------
// Internal conversation state tracked by the state machine
// ---------------------------------------------------------------------------

export interface ConversationState {
  /** Current dialogue phase. */
  phase: DialoguePhase;
  /** ID of the active prompt (e.g. "activity1_prompt2"). */
  promptId: string | null;
  /** Milliseconds since the current listening window started. */
  elapsedMs: number;
  /** Whether scaffold (help) was used for the current prompt. */
  scaffoldUsed: boolean;
  /** How many voice attempts the child has made for the current prompt. */
  attemptCount: number;
  /** Prevents duplicate auto-advance calls for the same prompt. */
  advanceLocked: boolean;
  /** Latest error message, if any. */
  lastError: string | null;
  /** Custom prompt text. */
  currentPromptText?: string;
  /** Custom reprompt text. */
  currentRepromptText?: string;
  /** Custom help text. */
  currentHelpText?: string;
}

// ---------------------------------------------------------------------------
// Transition result – returned by the state machine's `transition` function
// ---------------------------------------------------------------------------

export interface TransitionResult {
  /** Updated conversation state. */
  state: ConversationState;
  /** Action to execute (display message, start mic, etc.). */
  action: DialogueAction;
}
