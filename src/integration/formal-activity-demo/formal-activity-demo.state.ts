import type { ActivityRouteId } from '@/config/app-config';
import type {
  ActivityScreenViewModel,
  ChildVisualState,
} from '@/types/visual.types';

import {
  formalActivityDemoRegistry,
  type FormalActivityDemoEntry,
} from './formal-activity-demo.registry';

export type FormalActivityDemoProgress = Readonly<{
  questionIndex: number;
  visualState: ChildVisualState;
  isCapturing: boolean;
  rewardVisible: boolean;
}>;

export type FormalActivityDemoState = Readonly<
  Record<ActivityRouteId, FormalActivityDemoProgress>
>;

export type FormalActivityDemoAction =
  | Readonly<{ type: 'RESET_DEMO' }>
  | Readonly<{
      type: 'SET_VISUAL_STATE';
      routeId: ActivityRouteId;
      visualState: ChildVisualState;
    }>
  | Readonly<{ type: 'MICROPHONE_START'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'MICROPHONE_STOP'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'ADVANCE_QUESTION'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'SHOW_REWARD'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'HIDE_REWARD'; routeId: ActivityRouteId }>;

function initialProgress(): FormalActivityDemoProgress {
  return {
    questionIndex: 0,
    visualState: 'prompt',
    isCapturing: false,
    rewardVisible: false,
  };
}

export function createInitialFormalActivityDemoState(): FormalActivityDemoState {
  return {
    '1': initialProgress(),
    '2': initialProgress(),
    '3': initialProgress(),
    '4': initialProgress(),
    '5': initialProgress(),
  };
}

function replaceProgress(
  state: FormalActivityDemoState,
  routeId: ActivityRouteId,
  progress: FormalActivityDemoProgress,
): FormalActivityDemoState {
  return { ...state, [routeId]: progress };
}

export function formalActivityDemoReducer(
  state: FormalActivityDemoState,
  action: FormalActivityDemoAction,
): FormalActivityDemoState {
  if (action.type === 'RESET_DEMO') {
    return createInitialFormalActivityDemoState();
  }

  const current = state[action.routeId];

  if (action.type === 'SET_VISUAL_STATE') {
    return replaceProgress(state, action.routeId, {
      ...current,
      visualState: action.visualState,
      isCapturing: false,
    });
  }

  if (action.type === 'MICROPHONE_START') {
    const finalListening = current.visualState === 'finalListening';
    return replaceProgress(state, action.routeId, {
      ...current,
      visualState: finalListening ? 'finalListening' : 'listening',
      isCapturing: true,
    });
  }

  if (action.type === 'MICROPHONE_STOP') {
    return replaceProgress(state, action.routeId, {
      ...current,
      visualState: 'processing',
      isCapturing: false,
    });
  }

  if (action.type === 'ADVANCE_QUESTION') {
    const questionTotal = formalActivityDemoRegistry[action.routeId].fixture.states[0]
      .questionProgress.total;
    const completing = current.questionIndex + 1 >= questionTotal;
    return replaceProgress(state, action.routeId, {
      ...current,
      questionIndex: completing ? questionTotal - 1 : current.questionIndex + 1,
      visualState: completing ? 'complete' : 'prompt',
      isCapturing: false,
    });
  }

  if (action.type === 'SHOW_REWARD') {
    return replaceProgress(state, action.routeId, {
      ...current,
      rewardVisible: true,
    });
  }

  return replaceProgress(state, action.routeId, {
    ...current,
    rewardVisible: false,
  });
}

function fixtureState(
  entry: FormalActivityDemoEntry,
  visualState: ChildVisualState,
): ActivityScreenViewModel {
  const fixture = entry.fixture.states.find(
    (candidate) => candidate.visualState === visualState,
  );
  if (!fixture) {
    throw new Error(
      `Activity ${entry.activity} has no ${visualState} fixture state.`,
    );
  }
  return fixture;
}

export function buildFormalActivityDemoViewModel(
  routeId: ActivityRouteId,
  progress: FormalActivityDemoProgress,
): ActivityScreenViewModel {
  const entry = formalActivityDemoRegistry[routeId];
  const base = fixtureState(entry, progress.visualState);
  const processing = progress.visualState === 'processing';
  const complete = progress.visualState === 'complete';
  const canStartMicrophone =
    progress.visualState === 'prompt' ||
    progress.visualState === 'reprompt' ||
    progress.visualState === 'finalListening' ||
    progress.visualState === 'error';

  return {
    ...base,
    questionProgress: {
      current: progress.questionIndex + 1,
      total: base.questionProgress.total,
    },
    microphoneState: progress.isCapturing
      ? 'listening'
      : processing
        ? 'processing'
        : progress.visualState === 'error'
          ? 'error'
          : canStartMicrophone
            ? 'idle'
            : 'disabled',
    audioLevel: progress.isCapturing ? 0.62 : 0,
    canBack: !processing,
    canSkip: !processing && !complete,
    canReplay: !processing && !progress.isCapturing,
    canContinue: progress.visualState === 'feedback' || complete,
    canStartMicrophone: canStartMicrophone && !progress.isCapturing,
    canStopMicrophone: progress.isCapturing,
  };
}
