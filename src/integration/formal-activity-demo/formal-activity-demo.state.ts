import { sceneAssetManifest } from '@/components/activity/scene-asset-manifest';
import type { ActivityRouteId } from '@/config/app-config';
import type {
  ActivityScreenViewModel,
  ChildVisualState,
  FocusTargetId,
  MascotState,
} from '@/types/visual.types';

import { formalActivityDemoRegistry } from './formal-activity-demo.registry';

export type FormalScaffoldStage = 0 | 1 | 2 | 3;

export type FormalActivityDemoProgress = Readonly<{
  questionIndex: number;
  visualState: ChildVisualState;
  scaffoldStage: FormalScaffoldStage;
  isCapturing: boolean;
  rewardVisible: boolean;
}>;

export type FormalActivityDemoState = Readonly<
  Record<ActivityRouteId, FormalActivityDemoProgress>
>;

export type FormalActivityDemoAction =
  | Readonly<{ type: 'RESET_DEMO' }>
  | Readonly<{ type: 'DELIVERY_SETTLED'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'SILENCE_STAGE_DUE'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'PROCESSING_SETTLED'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'REPLAY_CURRENT'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'TAP_HELP'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'MICROPHONE_START'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'MICROPHONE_STOP'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'ADVANCE_QUESTION'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'SHOW_REWARD'; routeId: ActivityRouteId }>
  | Readonly<{ type: 'HIDE_REWARD'; routeId: ActivityRouteId }>;

function initialProgress(): FormalActivityDemoProgress {
  return {
    questionIndex: 0,
    visualState: 'prompt',
    scaffoldStage: 0,
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

function replayState(progress: FormalActivityDemoProgress): ChildVisualState {
  if (progress.visualState === 'feedback' || progress.visualState === 'complete') {
    return progress.visualState;
  }
  if (progress.visualState === 'finalListening' || progress.scaffoldStage === 3) {
    return 'cluePresented';
  }
  if (progress.visualState === 'tapHelpAvailable' || progress.scaffoldStage === 2) {
    return 'reprompt';
  }
  if (progress.scaffoldStage === 1) return 'gentleCue';
  return 'prompt';
}

function advanceQuestion(
  state: FormalActivityDemoState,
  routeId: ActivityRouteId,
): FormalActivityDemoState {
  const current = state[routeId];
  const questionTotal = formalActivityDemoRegistry[routeId].definition.questions.length;
  const completing = current.questionIndex + 1 >= questionTotal;
  return replaceProgress(state, routeId, {
    ...current,
    questionIndex: completing ? questionTotal - 1 : current.questionIndex + 1,
    visualState: completing ? 'complete' : 'prompt',
    scaffoldStage: 0,
    isCapturing: false,
  });
}

export function formalActivityDemoReducer(
  state: FormalActivityDemoState,
  action: FormalActivityDemoAction,
): FormalActivityDemoState {
  if (action.type === 'RESET_DEMO') return createInitialFormalActivityDemoState();

  const current = state[action.routeId];

  if (action.type === 'DELIVERY_SETTLED') {
    const settled = {
      prompt: { visualState: 'listening', scaffoldStage: 0 },
      gentleCue: { visualState: 'listening', scaffoldStage: 1 },
      reprompt: { visualState: 'listening', scaffoldStage: 2 },
      cluePresented: { visualState: 'finalListening', scaffoldStage: 3 },
    } as const;
    const next = settled[current.visualState as keyof typeof settled];
    if (!next) return state;
    return replaceProgress(state, action.routeId, {
      ...current,
      ...next,
      isCapturing: false,
    });
  }

  if (action.type === 'SILENCE_STAGE_DUE') {
    if (current.visualState === 'finalListening') {
      return advanceQuestion(state, action.routeId);
    }
    if (current.visualState !== 'listening') return state;
    const visualState = current.scaffoldStage === 0
      ? 'gentleCue'
      : current.scaffoldStage === 1
        ? 'reprompt'
        : 'tapHelpAvailable';
    return replaceProgress(state, action.routeId, {
      ...current,
      visualState,
      isCapturing: false,
    });
  }

  if (action.type === 'PROCESSING_SETTLED') {
    if (current.visualState !== 'processing') return state;
    return replaceProgress(state, action.routeId, {
      ...current,
      visualState: 'feedback',
    });
  }

  if (action.type === 'REPLAY_CURRENT') {
    if (current.visualState === 'processing' || current.isCapturing) return state;
    return replaceProgress(state, action.routeId, {
      ...current,
      visualState: replayState(current),
      isCapturing: false,
    });
  }

  if (action.type === 'TAP_HELP') {
    if (current.visualState !== 'tapHelpAvailable') return state;
    return replaceProgress(state, action.routeId, {
      ...current,
      visualState: 'cluePresented',
      scaffoldStage: 3,
      isCapturing: false,
    });
  }

  if (action.type === 'MICROPHONE_START') {
    const canCapture = current.visualState === 'listening' || current.visualState === 'finalListening';
    if (!canCapture) return state;
    return replaceProgress(state, action.routeId, { ...current, isCapturing: true });
  }

  if (action.type === 'MICROPHONE_STOP') {
    if (!current.isCapturing) return state;
    return replaceProgress(state, action.routeId, {
      ...current,
      visualState: 'processing',
      isCapturing: false,
    });
  }

  if (action.type === 'ADVANCE_QUESTION') {
    return advanceQuestion(state, action.routeId);
  }

  if (action.type === 'SHOW_REWARD') {
    return replaceProgress(state, action.routeId, { ...current, rewardVisible: true });
  }

  return replaceProgress(state, action.routeId, { ...current, rewardVisible: false });
}

function mascotFor(state: ChildVisualState): MascotState {
  if (state === 'listening' || state === 'finalListening') return 'listening';
  if (state === 'processing') return 'thinking';
  if (state === 'feedback' || state === 'complete') return 'success';
  if (state === 'tapHelpAvailable') return 'idle';
  return 'speaking';
}

export function buildFormalActivityDemoViewModel(
  routeId: ActivityRouteId,
  progress: FormalActivityDemoProgress,
): ActivityScreenViewModel {
  const entry = formalActivityDemoRegistry[routeId];
  const definition = entry.definition;
  const question = definition.questions[progress.questionIndex];
  const scene = sceneAssetManifest[definition.sceneAssetKey];
  const processing = progress.visualState === 'processing';
  const complete = progress.visualState === 'complete';
  const listening = progress.visualState === 'listening' || progress.visualState === 'finalListening';
  const canStartMicrophone = listening && !progress.isCapturing;
  const questionTargets = question.focusTargetIds;
  const targetsActive =
    progress.visualState === 'gentleCue' ||
    progress.visualState === 'reprompt' ||
    progress.visualState === 'tapHelpAvailable' ||
    progress.visualState === 'cluePresented' ||
    progress.visualState === 'finalListening' ||
    progress.visualState === 'feedback' ||
    (progress.visualState === 'listening' && progress.scaffoldStage > 0);

  let koolMessage = question.promptText;
  if (progress.visualState === 'gentleCue' || (progress.visualState === 'listening' && progress.scaffoldStage === 1)) {
    koolMessage = question.gentleCueText;
  } else if (progress.visualState === 'reprompt' || progress.visualState === 'tapHelpAvailable' || (progress.visualState === 'listening' && progress.scaffoldStage === 2)) {
    koolMessage = progress.visualState === 'tapHelpAvailable'
      ? 'Need a clue? Tap the little question mark.'
      : question.repromptText;
  } else if (progress.visualState === 'cluePresented' || progress.visualState === 'finalListening') {
    koolMessage = question.helpText;
  } else if (processing) {
    koolMessage = 'Let me think about what you said…';
  } else if (progress.visualState === 'feedback') {
    koolMessage = question.recastText;
  } else if (complete) {
    koolMessage = definition.completeText;
  }

  const activeFocusTargetIds = targetsActive ? questionTargets : [];
  const manifestIds = new Set<FocusTargetId>(scene.focusTargets.map((target) => target.id));
  if (activeFocusTargetIds.some((targetId) => !manifestIds.has(targetId))) {
    throw new Error(`Activity ${entry.activity} emitted an unknown focus target.`);
  }

  return {
    activityId: `activity-${entry.activity}`,
    title: definition.title,
    sceneAssetKey: definition.sceneAssetKey,
    sceneAspectRatio: scene.aspectRatio,
    focusTargets: scene.focusTargets,
    activityProgress: { current: entry.activity, total: 5 },
    questionProgress: { current: progress.questionIndex + 1, total: definition.questions.length },
    visualState: progress.visualState,
    koolMessage,
    mascotState: mascotFor(progress.visualState),
    microphoneState: progress.isCapturing
      ? 'listening'
      : processing
        ? 'processing'
        : canStartMicrophone
          ? 'idle'
          : 'disabled',
    audioLevel: progress.isCapturing ? 0.62 : 0,
    activeFocusTargetIds: activeFocusTargetIds as readonly FocusTargetId[],
    showClueTargets: progress.visualState === 'tapHelpAvailable',
    celebrationIntensity: progress.visualState === 'feedback' ? 'gentle' : complete ? 'standard' : null,
    canBack: !processing,
    canSkip: !processing && !complete,
    canReplay: !processing && !progress.isCapturing,
    canContinue: progress.visualState === 'feedback' || complete,
    canStartMicrophone,
    canStopMicrophone: progress.isCapturing,
  };
}
