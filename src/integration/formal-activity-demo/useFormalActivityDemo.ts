import { useCallback, useEffect, useMemo } from 'react';

import { sceneAssetManifest } from '@/components/activity/scene-asset-manifest';
import type { ActivityRouteId } from '@/config/app-config';
import type {
  ActivityScreenActions,
  FocusTargetId,
} from '@/types/visual.types';

import { useFormalActivityDemoSession } from './FormalActivityDemoProvider';
import { formalActivityDemoRegistry } from './formal-activity-demo.registry';
import { buildFormalActivityDemoViewModel } from './formal-activity-demo.state';
import { getFormalDemoScheduledTransition } from './formal-activity-demo.timing';

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
    const transition = getFormalDemoScheduledTransition(progress);
    if (!transition) return undefined;
    const timer = setTimeout(
      () => dispatch({ type: transition.action, routeId }),
      transition.delayMs,
    );
    return () => clearTimeout(timer);
  }, [dispatch, progress, routeId]);

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
      onReplay: () => dispatch({ type: 'REPLAY_CURRENT', routeId }),
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
        dispatch({ type: 'TAP_HELP', routeId });
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
