import { useCallback, useEffect, useMemo } from 'react';

import { sceneAssetManifest } from '@/components/activity';
import type { ActivityRouteId } from '@/config/app-config';
import type {
  ActivityScreenActions,
  ChildVisualState,
  FocusTargetId,
} from '@/types/visual.types';

import { useFormalActivityDemoSession } from './FormalActivityDemoProvider';
import { formalActivityDemoRegistry } from './formal-activity-demo.registry';
import { buildFormalActivityDemoViewModel } from './formal-activity-demo.state';

const automaticTransitions: Partial<
  Record<ChildVisualState, Readonly<{ delayMs: number; next: ChildVisualState }>>
> = {
  prompt: { delayMs: 5000, next: 'gentleCue' },
  gentleCue: { delayMs: 1800, next: 'reprompt' },
  reprompt: { delayMs: 5000, next: 'tapHelpAvailable' },
  cluePresented: { delayMs: 1600, next: 'finalListening' },
  processing: { delayMs: 900, next: 'feedback' },
};

export type FormalActivityDemoCallbacks = Readonly<{
  onBack(): void;
  onAdvance(): void;
}>;

export function useFormalActivityDemo(
  routeId: ActivityRouteId,
  callbacks: FormalActivityDemoCallbacks,
) {
  const { state, dispatch } = useFormalActivityDemoSession();
  const entry = formalActivityDemoRegistry[routeId];
  const progress = state[routeId];
  const viewModel = useMemo(
    () => buildFormalActivityDemoViewModel(routeId, progress),
    [progress, routeId],
  );
  const scene = sceneAssetManifest[viewModel.sceneAssetKey];

  useEffect(() => {
    if (progress.isCapturing || progress.rewardVisible) return undefined;
    const transition = automaticTransitions[progress.visualState];
    if (!transition) return undefined;

    const timer = setTimeout(() => {
      dispatch({
        type: 'SET_VISUAL_STATE',
        routeId,
        visualState: transition.next,
      });
    }, transition.delayMs);
    return () => clearTimeout(timer);
  }, [dispatch, progress.isCapturing, progress.rewardVisible, progress.visualState, routeId]);

  const advanceQuestion = useCallback(
    () => dispatch({ type: 'ADVANCE_QUESTION', routeId }),
    [dispatch, routeId],
  );

  const onContinue = useCallback(() => {
    if (progress.visualState === 'feedback') {
      advanceQuestion();
      return;
    }
    if (progress.visualState !== 'complete') return;

    if (entry.showsFixtureReward) {
      dispatch({ type: 'SHOW_REWARD', routeId });
      return;
    }
    callbacks.onAdvance();
  }, [advanceQuestion, callbacks, dispatch, entry.showsFixtureReward, progress.visualState, routeId]);

  const onRewardContinue = useCallback(() => {
    dispatch({ type: 'HIDE_REWARD', routeId });
    callbacks.onAdvance();
  }, [callbacks, dispatch, routeId]);

  const actions = useMemo<ActivityScreenActions>(
    () => ({
      onBack: callbacks.onBack,
      onReplay: () =>
        dispatch({ type: 'SET_VISUAL_STATE', routeId, visualState: 'prompt' }),
      onMicrophoneStart: () => {
        if (!viewModel.canStartMicrophone) return;
        dispatch({ type: 'MICROPHONE_START', routeId });
      },
      onMicrophoneStop: () => {
        if (!viewModel.canStopMicrophone) return;
        dispatch({ type: 'MICROPHONE_STOP', routeId });
      },
      onClue: (_targetId: FocusTargetId) => {
        if (progress.visualState !== 'tapHelpAvailable') return;
        dispatch({
          type: 'SET_VISUAL_STATE',
          routeId,
          visualState: 'cluePresented',
        });
      },
      onSkip: advanceQuestion,
      onContinue,
    }),
    [
      advanceQuestion,
      callbacks.onBack,
      dispatch,
      onContinue,
      progress.visualState,
      routeId,
      viewModel.canStartMicrophone,
      viewModel.canStopMicrophone,
    ],
  );

  return {
    actions,
    entry,
    onRewardContinue,
    progress,
    scene,
    viewModel,
  } as const;
}
