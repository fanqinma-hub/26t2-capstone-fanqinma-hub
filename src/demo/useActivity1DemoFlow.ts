import { useCallback, useEffect, useRef, useState } from 'react';

import type { KoolMascotState, MicrophoneButtonState } from '@/components/child-ui';
import type { ActivityScreenVisualState } from '@/components/activity';

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
  gentleCueMs: 3_000,
  repromptMs: 6_000,
  tapHelpAvailableMs: 10_000,
  clueReadMs: 1_200,
  finalListeningMs: 5_000,
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

const presentationByState: Record<Activity1DemoState, DemoPresentation> = {
  intro: {
    message: 'Hi! Let’s find some size words together.',
    mascotState: 'wave',
    microphoneState: 'idle',
    visualState: 'prompt',
    isSpeaking: true,
  },
  prompt: {
    message: 'What can you see in this picture?',
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'prompt',
    isSpeaking: true,
  },
  listening: {
    message: 'I’m listening. Tell me a size word when you are ready.',
    mascotState: 'listening',
    microphoneState: 'listening',
    statusLine: 'Listening',
    visualState: 'listening',
  },
  gentleCue: {
    message: 'Take your time. What looks very big?',
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'gentleCue',
    isSpeaking: true,
  },
  reprompt: {
    message: 'Look at the watermelon and the cup. Which one is big?',
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'reprompt',
    isSpeaking: true,
  },
  tapHelpAvailable: {
    message: 'Need a clue? Tap the little question mark.',
    mascotState: 'idle',
    microphoneState: 'idle',
    visualState: 'tapHelpAvailable',
  },
  cluePresented: {
    message: 'This is a watermelon. Can you tell me its size?',
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'cluePresented',
    isSpeaking: true,
  },
  finalListening: {
    message: 'One last try. Is it big, small, tiny, huge, or medium?',
    mascotState: 'speaking',
    microphoneState: 'idle',
    visualState: 'finalListening',
    isSpeaking: true,
  },
  processing: {
    message: 'Kool is thinking…',
    mascotState: 'thinking',
    microphoneState: 'processing',
    statusLine: 'Kool is thinking…',
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
    message: 'You finished Activity 1. Let’s look at your demo report!',
    mascotState: 'success',
    microphoneState: 'disabled',
    visualState: 'complete',
  },
};

export type UseActivity1DemoFlowOptions = {
  initialState?: Activity1DemoState;
  outcome?: Activity1DemoOutcome;
};

export function useActivity1DemoFlow({ initialState = 'prompt', outcome = 'success' }: UseActivity1DemoFlowOptions = {}) {
  const [state, setState] = useState<Activity1DemoState>(initialState);
  const stateRef = useRef(state);
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timerIds.current.forEach(clearTimeout);
    timerIds.current = [];
  }, []);

  const transition = useCallback((nextState: Activity1DemoState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const timerId = setTimeout(callback, delayMs);
    timerIds.current.push(timerId);
  }, []);

  const schedulePromptSequence = useCallback(() => {
    clearTimers();
    transition('prompt');
    schedule(() => transition('gentleCue'), activity1DemoTiming.gentleCueMs);
    schedule(() => transition('reprompt'), activity1DemoTiming.repromptMs);
    schedule(() => transition('tapHelpAvailable'), activity1DemoTiming.tapHelpAvailableMs);
  }, [clearTimers, schedule, transition]);

  const scheduleInitialPromptTimers = useCallback(() => {
    clearTimers();
    schedule(() => transition('gentleCue'), activity1DemoTiming.gentleCueMs);
    schedule(() => transition('reprompt'), activity1DemoTiming.repromptMs);
    schedule(() => transition('tapHelpAvailable'), activity1DemoTiming.tapHelpAvailableMs);
  }, [clearTimers, schedule, transition]);

  const resolveOutcome = useCallback(() => {
    const nextState = outcome === 'retry' ? 'retry' : 'success';
    transition(nextState);
    if (nextState === 'success') {
      schedule(() => transition('complete'), activity1DemoTiming.successCelebrationMs);
    }
  }, [outcome, schedule, transition]);

  const onMicrophonePress = useCallback(() => {
    if (['processing', 'success', 'complete'].includes(stateRef.current)) return;

    clearTimers();
    transition('listening');
    schedule(() => transition('processing'), activity1DemoTiming.microphoneListeningMs);
    schedule(resolveOutcome, activity1DemoTiming.microphoneListeningMs + activity1DemoTiming.processingMs);
  }, [clearTimers, resolveOutcome, schedule, transition]);

  const onHelpPress = useCallback(() => {
    if (stateRef.current !== 'tapHelpAvailable') return;

    clearTimers();
    transition('cluePresented');
    schedule(() => transition('finalListening'), activity1DemoTiming.clueReadMs);
    schedule(resolveOutcome, activity1DemoTiming.clueReadMs + activity1DemoTiming.finalListeningMs);
  }, [clearTimers, resolveOutcome, schedule, transition]);

  const selectDevelopmentState = useCallback(
    (nextState: Activity1DemoState) => {
      if (nextState === 'prompt') {
        schedulePromptSequence();
        return;
      }

      clearTimers();
      transition(nextState);
    },
    [clearTimers, schedulePromptSequence, transition],
  );

  useEffect(() => {
    if (initialState === 'prompt') scheduleInitialPromptTimers();
    return clearTimers;
  }, [clearTimers, initialState, scheduleInitialPromptTimers]);

  const presentation = presentationByState[state];
  return {
    ...presentation,
    clearTimers,
    isHelpAvailable: state === 'tapHelpAvailable' || state === 'cluePresented',
    isHighlightingHelp: state === 'cluePresented',
    onHelpPress,
    onMicrophonePress,
    selectDevelopmentState,
    state,
  };
}
