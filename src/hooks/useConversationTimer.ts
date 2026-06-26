import { useCallback, useEffect, useRef, useState } from 'react';

import { conversationTiming } from '@/config/conversation-timing.config';
import { KOOL_SILENCE_COPY } from '@/conversation';
import type {
  ConversationPhase,
  DialogueAction,
  DialogueActionType,
} from '@/types/conversation';

type UseConversationTimerOptions = {
  isActive: boolean;
  onAction?: (action: DialogueAction) => void;
  onAutoAdvance?: () => void;
};

type UseConversationTimerReturn = {
  phase: ConversationPhase;
  currentMessage: string;
  hasShownGentleCue: boolean;
  hasShownReprompt: boolean;
  isTapHelpAvailable: boolean;
  scaffoldUsed: boolean;
  startPrompt: () => void;
  startListeningAfterKoolSpeech: () => void;
  restartListeningTimer: () => void;
  pauseFlowTimer: () => void;
  resumeFlowTimer: () => void;
  stopTimers: () => void;
  handleChildResponse: () => void;
  handleTapToHelp: () => void;
};

const clueReadMs = 1_200;

export function useConversationTimer({
  isActive,
  onAction,
  onAutoAdvance,
}: UseConversationTimerOptions): UseConversationTimerReturn {
  const [phase, setPhase] = useState<ConversationPhase>('intro');
  const [currentMessage, setCurrentMessage] = useState<string>(
    KOOL_SILENCE_COPY.intro,
  );
  const [hasShownGentleCue, setHasShownGentleCue] = useState(false);
  const [hasShownReprompt, setHasShownReprompt] = useState(false);
  const [isTapHelpAvailable, setIsTapHelpAvailable] = useState(false);
  const [scaffoldUsed, setScaffoldUsed] = useState(false);

  const isMountedRef = useRef(true);
  const phaseRef = useRef<ConversationPhase>('intro');

  const flowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flowDeadlineRef = useRef<number | null>(null);
  const flowRemainingDelayRef = useRef<number | null>(null);
  const flowCallbackRef = useRef<(() => void) | null>(null);
  const isFlowTimerPausedRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (flowTimerRef.current) {
      clearTimeout(flowTimerRef.current);
    }

    flowTimerRef.current = null;
    flowDeadlineRef.current = null;
    flowRemainingDelayRef.current = null;
    flowCallbackRef.current = null;
    isFlowTimerPausedRef.current = false;
  }, []);

  const emitAction = useCallback(
    (type: DialogueActionType, nextPhase: ConversationPhase, message?: string) => {
      const action: DialogueAction = {
        type,
        phase: nextPhase,
        message,
        timestamp: Date.now(),
      };

      onAction?.(action);
    },
    [onAction],
  );

  const moveToPhase = useCallback(
    (nextPhase: ConversationPhase, actionType: DialogueActionType, message: string) => {
      if (!isMountedRef.current) {
        return;
      }

      phaseRef.current = nextPhase;
      setPhase(nextPhase);
      setCurrentMessage(message);
      emitAction(actionType, nextPhase, message);
    },
    [emitAction],
  );

  const scheduleFlowTimer = useCallback((delayMs: number, callback: () => void) => {
    if (flowTimerRef.current) {
      clearTimeout(flowTimerRef.current);
    }

    flowCallbackRef.current = callback;
    flowRemainingDelayRef.current = delayMs;
    flowDeadlineRef.current = Date.now() + delayMs;
    isFlowTimerPausedRef.current = false;

    flowTimerRef.current = setTimeout(() => {
      flowTimerRef.current = null;
      flowDeadlineRef.current = null;
      flowRemainingDelayRef.current = null;
      isFlowTimerPausedRef.current = false;

      const currentCallback = flowCallbackRef.current;
      flowCallbackRef.current = null;

      currentCallback?.();
    }, delayMs);
  }, []);

  const pauseFlowTimer = useCallback(() => {
    if (!flowTimerRef.current || !flowDeadlineRef.current) {
      return;
    }

    const remainingMs = Math.max(flowDeadlineRef.current - Date.now(), 0);

    clearTimeout(flowTimerRef.current);

    flowTimerRef.current = null;
    flowDeadlineRef.current = null;
    flowRemainingDelayRef.current = remainingMs;
    isFlowTimerPausedRef.current = true;
  }, []);

  const resumeFlowTimer = useCallback(() => {
    if (!isFlowTimerPausedRef.current || !flowCallbackRef.current) {
      return;
    }

    const delayMs = flowRemainingDelayRef.current ?? 0;

    flowDeadlineRef.current = Date.now() + delayMs;
    isFlowTimerPausedRef.current = false;

    flowTimerRef.current = setTimeout(() => {
      flowTimerRef.current = null;
      flowDeadlineRef.current = null;
      flowRemainingDelayRef.current = null;
      isFlowTimerPausedRef.current = false;

      const currentCallback = flowCallbackRef.current;
      flowCallbackRef.current = null;

      currentCallback?.();
    }, delayMs);
  }, []);

  const stopTimers = useCallback(() => {
    clearAllTimers();
    emitAction('STOP_TIMERS', phaseRef.current);
  }, [clearAllTimers, emitAction]);

  const scheduleSupportFlowFromNow = useCallback(() => {
    scheduleFlowTimer(conversationTiming.gentleCueMs, () => {
      setHasShownGentleCue(true);
      moveToPhase('gentleCue', 'SHOW_GENTLE_CUE', KOOL_SILENCE_COPY.gentleCue);

      scheduleFlowTimer(conversationTiming.repromptMs, () => {
        setHasShownReprompt(true);
        moveToPhase('reprompt', 'SHOW_REPROMPT', KOOL_SILENCE_COPY.reprompt);

        scheduleFlowTimer(conversationTiming.tapToHelpMs, () => {
          setIsTapHelpAvailable(true);
          moveToPhase(
            'tapHelpAvailable',
            'SHOW_TAP_TO_HELP',
            KOOL_SILENCE_COPY.tapHelpAvailable,
          );
        });
      });
    });
  }, [moveToPhase, scheduleFlowTimer]);

  const startPrompt = useCallback(() => {
    clearAllTimers();

    setHasShownGentleCue(false);
    setHasShownReprompt(false);
    setIsTapHelpAvailable(false);
    setScaffoldUsed(false);

    moveToPhase('prompt', 'SHOW_PROMPT', KOOL_SILENCE_COPY.prompt);
    scheduleSupportFlowFromNow();
  }, [clearAllTimers, moveToPhase, scheduleSupportFlowFromNow]);

  const startListeningAfterKoolSpeech = useCallback(() => {
    if (phaseRef.current !== 'prompt') {
      return;
    }

    clearAllTimers();

    setHasShownGentleCue(false);
    setHasShownReprompt(false);
    setIsTapHelpAvailable(false);

    moveToPhase('listening', 'START_LISTENING', KOOL_SILENCE_COPY.listening);
    scheduleSupportFlowFromNow();
  }, [clearAllTimers, moveToPhase, scheduleSupportFlowFromNow]);

  const restartListeningTimer = useCallback(() => {
    clearAllTimers();

    setHasShownGentleCue(false);
    setHasShownReprompt(false);
    setIsTapHelpAvailable(false);

    moveToPhase('listening', 'START_LISTENING', KOOL_SILENCE_COPY.listening);
    scheduleSupportFlowFromNow();
  }, [clearAllTimers, moveToPhase, scheduleSupportFlowFromNow]);

  const handleChildResponse = useCallback(() => {
    clearAllTimers();
    moveToPhase('processing', 'START_PROCESSING', KOOL_SILENCE_COPY.processing);
  }, [clearAllTimers, moveToPhase]);

  const handleTapToHelp = useCallback(() => {
    clearAllTimers();

    setScaffoldUsed(true);
    setIsTapHelpAvailable(false);

    moveToPhase('cluePresented', 'SHOW_CLUE', KOOL_SILENCE_COPY.cluePresented);

    scheduleFlowTimer(clueReadMs, () => {
      moveToPhase(
        'finalListening',
        'START_FINAL_LISTENING',
        KOOL_SILENCE_COPY.finalListening,
      );

      scheduleFlowTimer(conversationTiming.finalListeningMs, () => {
        moveToPhase('autoAdvance', 'AUTO_ADVANCE', KOOL_SILENCE_COPY.autoAdvance);
        onAutoAdvance?.();
      });
    });
  }, [clearAllTimers, moveToPhase, onAutoAdvance, scheduleFlowTimer]);

  useEffect(() => {
    if (isActive) {
      startPrompt();
    }

    return () => {
      clearAllTimers();
    };
  }, [isActive, startPrompt, clearAllTimers]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    phase,
    currentMessage,
    hasShownGentleCue,
    hasShownReprompt,
    isTapHelpAvailable,
    scaffoldUsed,
    startPrompt,
    startListeningAfterKoolSpeech,
    restartListeningTimer,
    pauseFlowTimer,
    resumeFlowTimer,
    stopTimers,
    handleChildResponse,
    handleTapToHelp,
  };
}