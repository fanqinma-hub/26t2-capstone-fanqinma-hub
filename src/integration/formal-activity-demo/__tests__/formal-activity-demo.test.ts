import { sceneAssetManifest } from '@/components/activity/scene-asset-manifest';
import { activityRouteIds } from '@/config/app-config';
import { conversationTiming } from '@/config/conversation-timing.config';
import type { FocusTargetId } from '@/types/visual.types';

import { getFormalDemoRegistryIssues } from '../formal-activity-demo.content';
import {
  formalActivityDemoRegistry,
  getNextFormalActivityRouteId,
  parseFormalActivityRouteId,
} from '../formal-activity-demo.registry';
import {
  buildFormalActivityDemoViewModel,
  createInitialFormalActivityDemoState,
  formalActivityDemoReducer,
} from '../formal-activity-demo.state';
import {
  formalDemoFixtureTiming,
  getFormalDemoScheduledTransition,
} from '../formal-activity-demo.timing';

describe('formal Activity fixture demo integration', () => {
  it('registers the canonical 6/6/4/4/5 question sequence', () => {
    expect(Object.keys(formalActivityDemoRegistry)).toEqual(activityRouteIds);
    expect(activityRouteIds.map((routeId) =>
      formalActivityDemoRegistry[routeId].definition.questions.length,
    )).toEqual([6, 6, 4, 4, 5]);
    expect(getFormalDemoRegistryIssues()).toEqual([]);
  });

  it('uses distinct question copy and preserves the Activity 5 shell and crab comparison', () => {
    for (const routeId of activityRouteIds) {
      const prompts = formalActivityDemoRegistry[routeId].definition.questions.map(
        (question) => question.promptText,
      );
      expect(new Set(prompts).size).toBe(prompts.length);
    }
    expect(formalActivityDemoRegistry['5'].definition.questions[4].focusTargetIds).toEqual([
      'activity-5:shell',
      'activity-5:crab',
    ]);
  });

  it('keeps every emitted target inside its question and scene manifests', () => {
    for (const routeId of activityRouteIds) {
      const state = createInitialFormalActivityDemoState()[routeId];
      const definition = formalActivityDemoRegistry[routeId].definition;
      const manifestIds = new Set<FocusTargetId>(sceneAssetManifest[definition.sceneAssetKey].focusTargets.map((target) => target.id));
      definition.questions.forEach((question, questionIndex) => {
        const viewModel = buildFormalActivityDemoViewModel(routeId, {
          ...state,
          questionIndex,
          visualState: 'tapHelpAvailable',
          scaffoldStage: 2,
        });
        expect(viewModel.activeFocusTargetIds.every((id) => manifestIds.has(id))).toBe(true);
        expect(viewModel.activeFocusTargetIds.every((id) => question.focusTargetIds.includes(id))).toBe(true);
      });
    }
  });

  it('parses only the five canonical route ids and advances to Unit Complete', () => {
    expect(parseFormalActivityRouteId('1')).toBe('1');
    expect(parseFormalActivityRouteId(['5'])).toBe('5');
    expect(parseFormalActivityRouteId('6')).toBeNull();
    expect(parseFormalActivityRouteId(undefined)).toBeNull();
    expect(activityRouteIds.map(getNextFormalActivityRouteId)).toEqual(['2', '3', '4', '5', null]);
  });

  it('shows the visual-only reward only after Activities 1, 3, and 5', () => {
    expect(activityRouteIds.map((routeId) =>
      formalActivityDemoRegistry[routeId].showsFixtureReward,
    )).toEqual([true, false, true, false, true]);
  });

  it('follows prompt delivery, 3/6/10 second scaffolds, clue, and final five seconds', () => {
    let state = createInitialFormalActivityDemoState();
    const reduce = (type: 'DELIVERY_SETTLED' | 'SILENCE_STAGE_DUE' | 'TAP_HELP') => {
      state = formalActivityDemoReducer(state, { type, routeId: '1' });
      return state['1'];
    };

    expect(getFormalDemoScheduledTransition(state['1'])).toEqual({
      action: 'DELIVERY_SETTLED', delayMs: formalDemoFixtureTiming.deliveryMs,
    });
    expect(reduce('DELIVERY_SETTLED')).toMatchObject({ visualState: 'listening', scaffoldStage: 0 });
    expect(getFormalDemoScheduledTransition(state['1'])?.delayMs).toBe(conversationTiming.gentleCueMs);
    expect(reduce('SILENCE_STAGE_DUE')).toMatchObject({ visualState: 'gentleCue', scaffoldStage: 0 });
    expect(reduce('DELIVERY_SETTLED')).toMatchObject({ visualState: 'listening', scaffoldStage: 1 });
    expect(getFormalDemoScheduledTransition(state['1'])?.delayMs).toBe(conversationTiming.repromptMs);
    expect(reduce('SILENCE_STAGE_DUE')).toMatchObject({ visualState: 'reprompt', scaffoldStage: 1 });
    expect(reduce('DELIVERY_SETTLED')).toMatchObject({ visualState: 'listening', scaffoldStage: 2 });
    expect(getFormalDemoScheduledTransition(state['1'])?.delayMs).toBe(conversationTiming.tapToHelpMs);
    expect(reduce('SILENCE_STAGE_DUE')).toMatchObject({ visualState: 'tapHelpAvailable', scaffoldStage: 2 });
    expect(reduce('TAP_HELP')).toMatchObject({ visualState: 'cluePresented', scaffoldStage: 3 });
    expect(reduce('DELIVERY_SETTLED')).toMatchObject({ visualState: 'finalListening', scaffoldStage: 3 });
    expect(getFormalDemoScheduledTransition(state['1'])?.delayMs).toBe(conversationTiming.finalListeningMs);
    expect(reduce('SILENCE_STAGE_DUE')).toMatchObject({ questionIndex: 1, visualState: 'prompt', scaffoldStage: 0 });
  });

  it('pauses silence scheduling during capture and returns deterministic feedback', () => {
    let state = createInitialFormalActivityDemoState();
    state = formalActivityDemoReducer(state, { type: 'DELIVERY_SETTLED', routeId: '1' });
    state = formalActivityDemoReducer(state, { type: 'MICROPHONE_START', routeId: '1' });
    expect(getFormalDemoScheduledTransition(state['1'])).toBeNull();
    state = formalActivityDemoReducer(state, { type: 'MICROPHONE_STOP', routeId: '1' });
    expect(state['1'].visualState).toBe('processing');
    expect(getFormalDemoScheduledTransition(state['1'])).toEqual({
      action: 'PROCESSING_SETTLED', delayMs: formalDemoFixtureTiming.processingMs,
    });
    state = formalActivityDemoReducer(state, { type: 'PROCESSING_SETTLED', routeId: '1' });
    expect(buildFormalActivityDemoViewModel('1', state['1'])).toMatchObject({
      visualState: 'feedback', canContinue: true,
    });
  });

  it('replays the current scaffold without changing question progress', () => {
    let state = createInitialFormalActivityDemoState();
    state = formalActivityDemoReducer(state, { type: 'DELIVERY_SETTLED', routeId: '2' });
    state = formalActivityDemoReducer(state, { type: 'SILENCE_STAGE_DUE', routeId: '2' });
    state = formalActivityDemoReducer(state, { type: 'DELIVERY_SETTLED', routeId: '2' });
    const before = state['2'].questionIndex;
    state = formalActivityDemoReducer(state, { type: 'REPLAY_CURRENT', routeId: '2' });
    expect(state['2']).toMatchObject({ questionIndex: before, visualState: 'gentleCue', scaffoldStage: 1 });
  });

  it('keeps Activity 4 on the client original scene', () => {
    const state = createInitialFormalActivityDemoState();
    const viewModel = buildFormalActivityDemoViewModel('4', state['4']);
    expect(viewModel.sceneAssetKey).toBe('farmers-market');
  });
});
