import { activityRouteIds } from '@/config/app-config';

import {
  buildFormalActivityDemoViewModel,
  createInitialFormalActivityDemoState,
  formalActivityDemoReducer,
} from '../formal-activity-demo.state';
import {
  formalActivityDemoRegistry,
  getNextFormalActivityRouteId,
  parseFormalActivityRouteId,
} from '../formal-activity-demo.registry';

describe('formal Activity fixture demo integration', () => {
  it('registers one fixture for every canonical Activity route', () => {
    expect(Object.keys(formalActivityDemoRegistry)).toEqual(activityRouteIds);
    expect(
      activityRouteIds.map(
        (routeId) => formalActivityDemoRegistry[routeId].fixture.activity,
      ),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it('parses only the five canonical route ids', () => {
    expect(parseFormalActivityRouteId('1')).toBe('1');
    expect(parseFormalActivityRouteId(['5'])).toBe('5');
    expect(parseFormalActivityRouteId('6')).toBeNull();
    expect(parseFormalActivityRouteId(undefined)).toBeNull();
  });

  it('advances through Activities 1 to 5 and then Unit Complete', () => {
    expect(activityRouteIds.map(getNextFormalActivityRouteId)).toEqual([
      '2',
      '3',
      '4',
      '5',
      null,
    ]);
  });

  it('shows the legacy visual reward only after Activities 1, 3, and 5', () => {
    expect(
      activityRouteIds.map(
        (routeId) => formalActivityDemoRegistry[routeId].showsFixtureReward,
      ),
    ).toEqual([true, false, true, false, true]);
  });

  it('runs microphone and deterministic feedback states without reward grants', () => {
    let state = createInitialFormalActivityDemoState();
    state = formalActivityDemoReducer(state, {
      type: 'MICROPHONE_START',
      routeId: '1',
    });
    expect(state['1']).toMatchObject({
      visualState: 'listening',
      isCapturing: true,
      rewardVisible: false,
    });

    state = formalActivityDemoReducer(state, {
      type: 'MICROPHONE_STOP',
      routeId: '1',
    });
    expect(state['1']).toMatchObject({
      visualState: 'processing',
      isCapturing: false,
      rewardVisible: false,
    });

    state = formalActivityDemoReducer(state, {
      type: 'SET_VISUAL_STATE',
      routeId: '1',
      visualState: 'feedback',
    });
    const viewModel = buildFormalActivityDemoViewModel('1', state['1']);
    expect(viewModel.canContinue).toBe(true);
    expect(viewModel.questionProgress).toEqual({ current: 1, total: 6 });
  });

  it('completes an Activity at its final fixture question', () => {
    let state = createInitialFormalActivityDemoState();
    const total = formalActivityDemoRegistry['3'].fixture.states[0]
      .questionProgress.total;

    for (let index = 0; index < total; index += 1) {
      state = formalActivityDemoReducer(state, {
        type: 'ADVANCE_QUESTION',
        routeId: '3',
      });
    }

    expect(state['3']).toMatchObject({
      questionIndex: total - 1,
      visualState: 'complete',
      rewardVisible: false,
    });
  });

  it('keeps the formal Activity 4 view model on the client original scene', () => {
    const state = createInitialFormalActivityDemoState();
    const viewModel = buildFormalActivityDemoViewModel('4', state['4']);
    expect(viewModel.sceneAssetKey).toBe('farmers-market');
    expect(
      viewModel.focusTargets.map((target) => target.id),
    ).toEqual(
      expect.arrayContaining([
        'activity-4:big-pumpkin',
        'activity-4:medium-pumpkin',
        'activity-4:small-pumpkin',
        'activity-4:bananas',
        'activity-4:grapes',
      ]),
    );
  });
});
