import { sceneAssetManifest } from '@/components/activity/scene-asset-manifest';
import type { ActivityScreenViewModel, ChildVisualState, FocusTargetId, MascotState, SceneAssetKey } from '@/types/visual.types';

type FlowConfig = Readonly<{
  activity: 1 | 2 | 3 | 4 | 5;
  title: string;
  sceneAssetKey: SceneAssetKey;
  questionTotal: number;
  primaryTargets: readonly FocusTargetId[];
  secondaryTargets: readonly FocusTargetId[];
  copy: Readonly<{ prompt: string; cue: string; clue: string; feedback: string; complete: string }>;
}>;

export type Role2ActivityFlowFixture = Readonly<{
  activity: 1 | 2 | 3 | 4 | 5;
  source: 'Role 2 fixture-driven presentation only';
  states: readonly ActivityScreenViewModel[];
}>;

export const role2ActivityFlowStateOrder: readonly ChildVisualState[] = [
  'prompt', 'listening', 'gentleCue', 'reprompt', 'tapHelpAvailable',
  'cluePresented', 'finalListening', 'processing', 'feedback', 'complete', 'error',
];

const configs: readonly FlowConfig[] = [
  {
    activity: 1, title: 'The Kitchen Bench', sceneAssetKey: 'kitchen-bench', questionTotal: 6,
    primaryTargets: ['activity-1:watermelon'], secondaryTargets: ['activity-1:strawberry'],
    copy: {
      prompt: 'Wow, look at this kitchen! Tell me what you can see.',
      cue: 'Look at the very large green fruit on the left.',
      clue: 'Can you see the tiny red fruit beside it?',
      feedback: 'A BIG watermelon and a tiny strawberry! Great noticing!',
      complete: 'You noticed big things and tiny things everywhere!',
    },
  },
  {
    activity: 2, title: 'At the Park', sceneAssetKey: 'park', questionTotal: 6,
    primaryTargets: ['activity-2:gum-tree'], secondaryTargets: ['activity-2:flower'],
    copy: {
      prompt: 'Oh, we’re at the park today! What can you see here?',
      cue: 'Look at that tree — WOW!',
      clue: 'Look down near the bottom for a tiny thing.',
      feedback: 'A huge tree and a tiny flower! Wonderful describing!',
      complete: 'The huge dog and tiny bird make a funny pair!',
    },
  },
  {
    activity: 3, title: 'The Toy Box', sceneAssetKey: 'toy-box', questionTotal: 4,
    primaryTargets: ['activity-3:teddy-bear'], secondaryTargets: ['activity-3:toy-car'],
    copy: {
      prompt: 'Something in this bedroom is VERY unusual. What do you notice?',
      cue: 'It is so big it almost touches the ceiling!',
      clue: 'Look on the floor for a tiny thing.',
      feedback: 'A tiny toy car! So tiny!',
      complete: 'The gigantic bear and tiny car — what a funny picture!',
    },
  },
  {
    activity: 4, title: 'The Farmer’s Market', sceneAssetKey: 'farmers-market', questionTotal: 4,
    primaryTargets: ['activity-4:big-pumpkin', 'activity-4:medium-pumpkin', 'activity-4:small-pumpkin'],
    secondaryTargets: ['activity-4:bananas', 'activity-4:grapes'],
    copy: {
      prompt: 'Ooh, it’s market day! What can you see on this stall?',
      cue: 'Look at these three pumpkins!',
      clue: 'Which is bigger, the bananas or the grapes?',
      feedback: 'MEDIUM! Not too big, not too small — just medium!',
      complete: 'The big bananas and small grapes! You know your sizes!',
    },
  },
  {
    activity: 5, title: 'The Beach Day', sceneAssetKey: 'beach-day', questionTotal: 5,
    primaryTargets: ['activity-5:wave'], secondaryTargets: ['activity-5:shell', 'activity-5:crab'],
    copy: {
      prompt: 'We made it to the beach! Tell me everything you can see.',
      cue: 'What size is that wave in the background?',
      clue: 'Can you spot the tiniest thing on the whole beach?',
      feedback: 'Yes! A tiny shell and a small crab! You found them!',
      complete: 'You are a SIZE WORD SUPERSTAR!',
    },
  },
];

function mascotFor(state: ChildVisualState): MascotState {
  if (state === 'listening' || state === 'finalListening') return 'listening';
  if (state === 'processing') return 'thinking';
  if (state === 'feedback' || state === 'complete') return 'success';
  if (state === 'tapHelpAvailable') return 'idle';
  return 'speaking';
}

function targetsFor(config: FlowConfig, state: ChildVisualState): readonly FocusTargetId[] {
  if (state === 'gentleCue' || state === 'reprompt') return config.primaryTargets;
  if (state === 'tapHelpAvailable' || state === 'cluePresented' || state === 'finalListening' || state === 'feedback') return config.secondaryTargets;
  return [];
}

function messageFor(config: FlowConfig, state: ChildVisualState) {
  if (state === 'prompt' || state === 'listening') return config.copy.prompt;
  if (state === 'gentleCue' || state === 'reprompt') return config.copy.cue;
  if (state === 'tapHelpAvailable' || state === 'cluePresented' || state === 'finalListening') return config.copy.clue;
  if (state === 'processing') return 'Let me think about what you said…';
  if (state === 'feedback') return config.copy.feedback;
  if (state === 'complete') return config.copy.complete;
  return 'I could not hear that clearly. We can try the microphone again.';
}

function statusFor(state: ChildVisualState) {
  const status: Record<ChildVisualState, string> = {
    prompt: 'Ready for your answer', listening: 'Listening…', gentleCue: 'Here is a gentle clue',
    reprompt: 'Have another go in your own words', tapHelpAvailable: 'Tap a question mark if you would like help',
    cluePresented: 'Picture clue presented', finalListening: 'One last try — Kool is listening',
    processing: 'Thinking about your words', feedback: 'Warm feedback — no correctness penalty',
    complete: 'Activity complete', error: 'Microphone unavailable — try again',
  };
  return status[state];
}

function buildViewModel(config: FlowConfig, state: ChildVisualState, stateIndex: number): ActivityScreenViewModel {
  const scene = sceneAssetManifest[config.sceneAssetKey];
  const listening = state === 'listening' || state === 'finalListening';
  const processing = state === 'processing';
  const error = state === 'error';
  const complete = state === 'complete';
  const questionCurrent = complete ? config.questionTotal : Math.min(config.questionTotal, Math.max(1, Math.floor(stateIndex / 2) + 1));
  return {
    activityId: `activity-${config.activity}`,
    title: config.title,
    sceneAssetKey: config.sceneAssetKey,
    sceneAspectRatio: scene.aspectRatio,
    focusTargets: scene.focusTargets,
    activityProgress: { current: config.activity, total: 5 },
    questionProgress: { current: questionCurrent, total: config.questionTotal },
    visualState: state,
    koolMessage: messageFor(config, state),
    statusLine: statusFor(state),
    mascotState: mascotFor(state),
    microphoneState: error ? 'error' : processing ? 'processing' : listening ? 'listening' : state === 'prompt' ? 'idle' : 'disabled',
    audioLevel: listening ? 0.62 : 0,
    activeFocusTargetIds: targetsFor(config, state),
    showClueTargets: state === 'tapHelpAvailable',
    celebrationIntensity: state === 'feedback' ? 'gentle' : complete ? 'standard' : null,
    canBack: !processing,
    canSkip: !processing && !complete,
    canReplay: !listening && !processing,
    canContinue: state === 'feedback' || complete,
    canStartMicrophone: state === 'prompt' || state === 'reprompt' || error,
    canStopMicrophone: listening,
  };
}

export const role2ActivityFlowFixtures = configs.map((config) => ({
  activity: config.activity,
  source: 'Role 2 fixture-driven presentation only' as const,
  states: role2ActivityFlowStateOrder.map((state, index) => buildViewModel(config, state, index)),
})) satisfies readonly Role2ActivityFlowFixture[];
