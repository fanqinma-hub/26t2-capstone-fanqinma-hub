import { useCallback, useEffect, useRef, useState } from 'react';

import type { ActivityScreenVisualState } from '@/components/activity';
import type { KoolMascotState, MicrophoneButtonState } from '@/components/child-ui';

import { conversationTiming } from '@/config/conversation-timing.config';
import { KOOL_SILENCE_COPY } from '@/conversation';

import { useConversationTimer } from '@/hooks/useConversationTimer';
import type { ConversationPhase, DialogueAction } from '@/types/conversation';

export type Activity1DemoState =
  | 'intro'
  | 'prompt'
  | 'listening'
  | 'gentleCue'
  | 'reprompt'
  | 'tapHelpAvailable'
  | 'cluePresented'
  | 'finalListening'
  | 'processing'
  | 'success'
  | 'retry'
  | 'complete';

export type Activity1DemoOutcome = 'success' | 'retry';

export const activity1DemoTiming = {
  ...conversationTiming,
  clueReadMs: 1_200,
  microphoneListeningMs: 1_200,
  processingMs: 1_000,
  successCelebrationMs: 1_800,
} as const;

type DemoPresentation = {
  message: string;
  mascotState: KoolMascotState;
  microphoneState: MicrophoneButtonState;
  statusLine?: string;
  visualState: ActivityScreenVisualState;
  isSpeaking?: boolean;
};

function mapConversationPhaseToDemoState(phase: ConversationPhase): Activity1DemoState {
  switch (phase) {
    case 'intro':
      return 'intro';

    case 'prompt':
      return 'prompt';

    case 'listening':
      return 'listening';

    case 'gentleCue':
      return 'gentleCue';

    case 'reprompt':
      return 'reprompt';

    case 'tapHelpAvailable':
      return 'tapHelpAvailable';

    case 'cluePresented':
      return 'cluePresented';

    case 'finalListening':
      return 'finalListening';

    case 'processing':
      return 'processing';

    case 'tierFeedback':
      return 'success';

    case 'autoAdvance':
      return 'retry';

    case 'complete':
      return 'complete';

    case 'retry':
      return 'retry';

    case 'success':
      return 'success';

    case 'error':
      return 'retry';

    default:
      return 'prompt';
  }
}

const presentationByState: Record<Activity1DemoState, DemoPresentation> = {
  intro: {
    message: KOOL_SILENCE_COPY.intro,
    mascotState: 'wave',
    microphoneState: 'idle',
    visualState: 'prompt',
    isSpeaking: true,
  },
  prompt: {
    message: KOOL_SILENCE_COPY.prompt,
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'prompt',
    isSpeaking: true,
  },
  listening: {
    message: KOOL_SILENCE_COPY.listening,
    mascotState: 'listening',
    microphoneState: 'listening',
    statusLine: 'Listening',
    visualState: 'listening',
  },
  gentleCue: {
    message: KOOL_SILENCE_COPY.gentleCue,
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'gentleCue',
    isSpeaking: true,
  },
  reprompt: {
    message: KOOL_SILENCE_COPY.reprompt,
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'reprompt',
    isSpeaking: true,
  },
  tapHelpAvailable: {
    message: KOOL_SILENCE_COPY.tapHelpAvailable,
    mascotState: 'idle',
    microphoneState: 'idle',
    visualState: 'tapHelpAvailable',
  },
  cluePresented: {
    message: KOOL_SILENCE_COPY.cluePresented,
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'cluePresented',
    isSpeaking: true,
  },
  finalListening: {
    message: KOOL_SILENCE_COPY.finalListening,
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'finalListening',
    isSpeaking: true,
  },
  processing: {
    message: KOOL_SILENCE_COPY.processing,
    mascotState: 'thinking',
    microphoneState: 'processing',
    statusLine: KOOL_SILENCE_COPY.processing,
    visualState: 'processing',
  },
  success: {
    message: 'Great describing! You used a size word.',
    mascotState: 'success',
    microphoneState: 'disabled',
    visualState: 'success',
  },
  retry: {
    message: 'Nice try. Let’s look together again.',
    mascotState: 'retry',
    microphoneState: 'error',
    visualState: 'retry',
  },
  complete: {
    message: KOOL_SILENCE_COPY.complete,
    mascotState: 'success',
    microphoneState: 'disabled',
    visualState: 'complete',
  },
};

export type UseActivity1DemoFlowOptions = {
  initialState?: Activity1DemoState;
  outcome?: Activity1DemoOutcome;
  copy?: Partial<Record<Activity1DemoState, string>>;
  onOutcomeResolved?: (outcome: Activity1DemoOutcome) => void;
};

export function useActivity1DemoFlow({
  initialState = 'prompt',
  copy,
  onOutcomeResolved,
}: UseActivity1DemoFlowOptions = {}) {
  const [state, setState] = useState<Activity1DemoState>(initialState);
  const [lastDialogueAction, setLastDialogueAction] = useState<DialogueAction | null>(null);

  const stateRef = useRef<Activity1DemoState>(state);
  const demoTimerIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    demoTimerIds.current.forEach((timerId) => clearTimeout(timerId));
    demoTimerIds.current = [];
  }, []);

  const transition = useCallback((nextState: Activity1DemoState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const handleTimerAction = useCallback(
    (action: DialogueAction) => {
      const systemTime = new Date(action.timestamp).toLocaleTimeString(undefined, {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      });

      console.log('[timer action]', action.type, action.phase, systemTime);

      setLastDialogueAction(action);

      // STOP_TIMERS is only for lifecycle/debug logging.
      // It should not change the visible Activity 1 state.
      if (action.type === 'STOP_TIMERS') {
        return;
      }

      transition(mapConversationPhaseToDemoState(action.phase));
    },
    [transition],
  );

  const handleTimerAutoAdvance = useCallback(() => {
    // Sprint 1 fallback:
    // Later this should move to the next prompt/activity.
    onOutcomeResolved?.('retry');
    transition('retry');
  }, [onOutcomeResolved, transition]);

  const {
    phase: conversationPhase,
    scaffoldUsed,
    startPrompt,
    startListeningAfterKoolSpeech,
    restartListeningTimer,
    pauseFlowTimer,
    resumeFlowTimer,
    stopTimers,
    handleTapToHelp,
  } = useConversationTimer({
    isActive: false,
    onAction: handleTimerAction,
    onAutoAdvance: handleTimerAutoAdvance,
  });

  const startPromptFlow = useCallback(() => {
    clearTimers();
    startPrompt();
  }, [clearTimers, startPrompt]);

  const onMicrophonePress = useCallback(() => {
    if (['processing', 'success', 'complete'].includes(stateRef.current)) {
      return;
    }

    clearTimers();

    // When the child taps to speak, restart the Role 4 silence timer.
    // This means gentleCue appears after 3s, reprompt after another 6s,
    // and tap-to-help after another 10s if no valid response is received.
    restartListeningTimer();
  }, [clearTimers, restartListeningTimer]);

  const onHelpPress = useCallback(() => {
    if (stateRef.current !== 'tapHelpAvailable') {
      return;
    }

    clearTimers();

    // Role 4 owns cluePresented -> finalListening -> autoAdvance.
    handleTapToHelp();
  }, [clearTimers, handleTapToHelp]);

  const selectDevelopmentState = useCallback(
    (nextState: Activity1DemoState) => {
      if (nextState === 'prompt') {
        startPromptFlow();
        return;
      }

      clearTimers();
      stopTimers();
      transition(nextState);
    },
    [clearTimers, startPromptFlow, stopTimers, transition],
  );

  useEffect(() => {
    if (initialState === 'prompt') {
      startPromptFlow();
    } else {
      transition(initialState);
    }

    return () => {
      clearTimers();
      stopTimers();
    };

    // Run once for the initial demo state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presentation = presentationByState[state];

  return {
    ...presentation,
    message: copy?.[state] ?? presentation.message,
    clearTimers,
    conversationPhase,
    lastDialogueAction,
    scaffoldUsed,
    startListeningAfterKoolSpeech,
    pauseFlowTimer,
    resumeFlowTimer,
    isHelpAvailable: state === 'tapHelpAvailable' || state === 'cluePresented',
    isHighlightingHelp: state === 'cluePresented',
    onHelpPress,
    onMicrophonePress,
    selectDevelopmentState,
    state,
  };
}
