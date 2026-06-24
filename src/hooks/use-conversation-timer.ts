/**
 * use-conversation-timer.ts
 *
 * React hook that connects the pure dialogue state machine to a real
 * timer so Activity screens can drive Kool's conversation flow with a
 * simple API.
 *
 * Usage:
 *   const { phase, koolMessage, koolVariant, showTapHelp, actions } =
 *     useConversationTimer();
 *
 *   // Start a prompt
 *   actions.startPrompt('activity1_prompt1');
 *
 *   // When the child speaks (transcript from Role 5)
 *   actions.handleResponse('I see a big tree');
 *
 *   // When the child taps the help button
 *   actions.handleTapHelp();
 *
 * Owner: Role 4 – Conversation Flow, Timing & Child-Safe AI Lead
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { TimingThresholds } from '@/constants/conversation.config';
import {
  createInitialState,
  transition,
} from '@/conversation/dialogue-state-machine';
import type {
  ConversationState,
  DialogueAction,
  DialoguePhase,
} from '@/types/dialogue.types';
import type { KoolDialogueVariant } from '@/components/child-ui/KoolDialogue';

// ---------------------------------------------------------------------------
// Public return type
// ---------------------------------------------------------------------------

export interface ConversationTimerActions {
  /** Begin a new prompt cycle for the given promptId. */
  startPrompt: (promptId: string) => void;
  /** Notify that Kool has finished speaking the prompt text. */
  promptDelivered: () => void;
  /** Called when the child's voice transcript is available. */
  handleResponse: (transcript: string) => void;
  /** Called when the child taps the help target. */
  handleTapHelp: () => void;
  /** Skip to auto-advance (therapist / dev mode). */
  skip: () => void;
  /** Full reset – clears timers and state. */
  reset: () => void;
}

export interface ConversationTimerResult {
  /** Current dialogue phase. */
  phase: DialoguePhase;
  /** Message Kool should display. */
  koolMessage: string | undefined;
  /** Visual variant for KoolDialogue component. */
  koolVariant: KoolDialogueVariant | undefined;
  /** Whether the microphone should be active. */
  shouldListen: boolean;
  /** Whether the tap-to-help target should be visible. */
  showTapHelp: boolean;
  /** Whether scaffold was used for the current prompt. */
  scaffoldUsed: boolean;
  /** Number of voice attempts for the current prompt. */
  attemptCount: number;
  /** Current prompt ID. */
  promptId: string | null;
  /** Latest error, if any. */
  lastError: string | null;
  /** Action dispatchers. */
  actions: ConversationTimerActions;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useConversationTimer(): ConversationTimerResult {
  const [state, setState] = useState<ConversationState>(createInitialState);
  const [lastAction, setLastAction] = useState<DialogueAction>({ phase: 'IDLE' });

  // Refs for the interval timer – avoids stale closures
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<ConversationState>(state);

  // Keep ref in sync with state
  stateRef.current = state;

  // ------------------------------------------------------------------
  // Timer management
  // ------------------------------------------------------------------

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTimeRef.current;
      const result = transition(stateRef.current, {
        type: 'TIMER_TICK',
        elapsedMs,
      });

      setState(result.state);
      setLastAction(result.action);

      // Stop ticking once we've auto-advanced or completed
      if (
        result.state.phase === 'AUTO_ADVANCE' ||
        result.state.phase === 'COMPLETE' ||
        result.state.phase === 'IDLE'
      ) {
        stopTimer();
      }
    }, TimingThresholds.TICK_INTERVAL_MS);
  }, [stopTimer]);

  // ------------------------------------------------------------------
  // Dispatch helper – runs a transition and manages timer lifecycle
  // ------------------------------------------------------------------

  const dispatch = useCallback(
    (event: Parameters<typeof transition>[1]) => {
      const result = transition(stateRef.current, event);
      setState(result.state);
      setLastAction(result.action);

      // Start the timer when we enter LISTENING
      if (result.state.phase === 'LISTENING' && timerRef.current === null) {
        startTimer();
      }

      // Stop the timer on terminal phases
      if (
        result.state.phase === 'IDLE' ||
        result.state.phase === 'AUTO_ADVANCE' ||
        result.state.phase === 'COMPLETE'
      ) {
        stopTimer();
      }

      return result;
    },
    [startTimer, stopTimer],
  );

  // ------------------------------------------------------------------
  // Public actions
  // ------------------------------------------------------------------

  const startPrompt = useCallback(
    (promptId: string) => {
      dispatch({ type: 'START_PROMPT', promptId });
    },
    [dispatch],
  );

  const promptDelivered = useCallback(() => {
    dispatch({ type: 'PROMPT_DELIVERED' });
  }, [dispatch]);

  const handleResponse = useCallback(
    (transcript: string) => {
      dispatch({ type: 'USER_RESPONSE', transcript });
    },
    [dispatch],
  );

  const handleTapHelp = useCallback(() => {
    dispatch({ type: 'TAP_HELP' });
  }, [dispatch]);

  const skip = useCallback(() => {
    dispatch({ type: 'SKIP' });
  }, [dispatch]);

  const reset = useCallback(() => {
    stopTimer();
    dispatch({ type: 'RESET' });
  }, [dispatch, stopTimer]);

  // ------------------------------------------------------------------
  // Cleanup on unmount – prevents leaked timers on route change
  // ------------------------------------------------------------------

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  // ------------------------------------------------------------------
  // Return value
  // ------------------------------------------------------------------

  return {
    phase: state.phase,
    koolMessage: lastAction.message,
    koolVariant: lastAction.koolVariant,
    shouldListen: lastAction.shouldListen ?? false,
    showTapHelp: lastAction.showTapHelp ?? false,
    scaffoldUsed: state.scaffoldUsed,
    attemptCount: state.attemptCount,
    promptId: state.promptId,
    lastError: state.lastError,
    actions: {
      startPrompt,
      promptDelivered,
      handleResponse,
      handleTapHelp,
      skip,
      reset,
    },
  };
}
