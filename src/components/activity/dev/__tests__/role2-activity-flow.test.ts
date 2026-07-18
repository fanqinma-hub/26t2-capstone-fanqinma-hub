import { role2ActivityFlowFixtures, role2ActivityFlowStateOrder } from '@/fixtures/role2-activity-flow.fixture';

import { mascotRasterTransitionMs } from '../../../mascot/mascot-animation.types';
import {
  beginMicrophoneHold,
  endMicrophoneHold,
  isSceneContainerAccessible,
} from '../../activity-presentation-interactions';
import {
  clueBreathingDurationMs,
  clueMarkerMaximumOpacity,
  clueMarkerMinimumOpacity,
  fitSceneFrameWidth,
  getClueMarkerPosition,
  getClueMarkerPositions,
  getSceneCropStyle,
  getSpotlightVisualRect,
  getSpotlightVisualRects,
  isSmallClueTarget,
} from '../../spotlight-geometry';
import { sceneAssetManifest } from '../../scene-asset-manifest';

describe('Role 2 generic Activity presentation fixtures', () => {
  it('covers Activities 1–5 and every canonical child-facing visual state', () => {
    expect(role2ActivityFlowFixtures.map((fixture) => fixture.activity)).toEqual([1, 2, 3, 4, 5]);
    for (const fixture of role2ActivityFlowFixtures) {
      expect(fixture.source).toBe('Role 2 fixture-driven presentation only');
      expect(fixture.states.map((state) => state.visualState)).toEqual(role2ActivityFlowStateOrder);
    }
  });

  it('uses one canonical scene manifest and keeps active ids inside each scene', () => {
    expect(Object.keys(sceneAssetManifest)).toEqual([
      'kitchen-bench', 'park', 'toy-box', 'farmers-market', 'beach-day',
    ]);
    for (const fixture of role2ActivityFlowFixtures) {
      for (const state of fixture.states) {
        const scene = sceneAssetManifest[state.sceneAssetKey];
        expect(state.sceneAspectRatio).toBe(scene.aspectRatio);
        expect(state.focusTargets).toBe(scene.focusTargets);
        const availableIds = new Set<string>(scene.focusTargets.map((target) => target.id));
        expect(state.activeFocusTargetIds.every((id) => availableIds.has(id))).toBe(true);
      }
    }
  });

  it('exposes both progress levels and valid interaction availability', () => {
    for (const fixture of role2ActivityFlowFixtures) {
      for (const state of fixture.states) {
        expect(state.activityProgress).toEqual({ current: fixture.activity, total: 5 });
        expect(state.questionProgress.current).toBeGreaterThanOrEqual(1);
        expect(state.questionProgress.current).toBeLessThanOrEqual(state.questionProgress.total);
        expect(state.audioLevel).toBeGreaterThanOrEqual(0);
        expect(state.audioLevel).toBeLessThanOrEqual(1);
      }
      const listening = fixture.states.find((state) => state.visualState === 'listening')!;
      const processing = fixture.states.find((state) => state.visualState === 'processing')!;
      const complete = fixture.states.find((state) => state.visualState === 'complete')!;
      expect(listening.canStopMicrophone).toBe(true);
      expect(listening.canStartMicrophone).toBe(false);
      expect(processing.canBack).toBe(false);
      expect(processing.canReplay).toBe(false);
      expect(complete.canContinue).toBe(true);
      expect(complete.canSkip).toBe(false);
    }
  });

  it('starts the microphone on hold and stops it on release', () => {
    const holdState = { current: false };
    const onStart = jest.fn();
    const onStop = jest.fn();

    beginMicrophoneHold(false, holdState, onStart);
    expect(onStart).not.toHaveBeenCalled();

    beginMicrophoneHold(true, holdState, onStart);
    expect(holdState.current).toBe(true);
    expect(onStart).toHaveBeenCalledTimes(1);

    // The release callback can close the hold even when it captured the
    // pre-listening render where canStop was still false.
    endMicrophoneHold(false, holdState, onStop);
    expect(holdState.current).toBe(false);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('leaves clue buttons individually accessible instead of grouping the scene', () => {
    expect(isSceneContainerAccessible(false)).toBe(true);
    expect(isSceneContainerAccessible(true)).toBe(false);
  });

  it('keeps raster switching at the approved 220 ms', () => {
    expect(mascotRasterTransitionMs).toBe(220);
  });

  it('centres question marks on their objects and keeps the approved breathing rhythm', () => {
    const largeObject = { x: 0.08, y: 0.18, width: 0.4, height: 0.6 };
    const smallObject = { x: 0.7, y: 0.72, width: 0.08, height: 0.1 };

    expect(isSmallClueTarget(largeObject)).toBe(false);
    expect(getClueMarkerPosition(largeObject)).toEqual({ left: '28%', top: '48%' });
    expect(isSmallClueTarget(smallObject)).toBe(true);
    expect(getClueMarkerPosition(smallObject)).toEqual({ left: '74%', top: '77%' });
    expect(getClueMarkerPosition({ x: 0.34, y: 0.88, width: 0.09, height: 0.07 })).toEqual({
      left: '38.5%',
      top: '91.5%',
    });
    expect(clueBreathingDurationMs).toBe(1100);
    expect(clueMarkerMinimumOpacity).toBe(0.3);
    expect(clueMarkerMaximumOpacity).toBe(0.8);
    expect(getClueMarkerPositions([
      { x: 0.7, y: 0.62, width: 0.08, height: 0.1 },
      { x: 0.76, y: 0.68, width: 0.08, height: 0.1 },
    ])).toEqual([
      { left: '74%', top: '67%' },
      { left: '80%', top: '73%' },
    ]);
  });

  it('reconstructs the scene inside rounded spotlight cut-outs', () => {
    expect(getSceneCropStyle({ x: 0.25, y: 0.2, width: 0.5, height: 0.4 })).toEqual({
      height: '250%',
      left: '-50%',
      top: '-50%',
      width: '200%',
    });
  });

  it('only expands tiny spotlight frames after layout sizing', () => {
    const largeObject = { x: 0.08, y: 0.18, width: 0.4, height: 0.6 };
    const smallObject = { x: 0.7, y: 0.72, width: 0.08, height: 0.1 };

    expect(getSpotlightVisualRect(largeObject, { width: 300, height: 200 })).toEqual(largeObject);
    const expanded = getSpotlightVisualRect(smallObject, { width: 300, height: 200 });
    expect(expanded.width * 300).toBeCloseTo(44);
    expect(expanded.height * 200).toBeCloseTo(44);
    expect(expanded.x + expanded.width / 2).toBeCloseTo(0.74);
    expect(expanded.y + expanded.height / 2).toBeCloseTo(0.77);
  });

  it('reduces tiny-frame padding before neighbouring frames overlap', () => {
    const originals = [
      { x: 0.7, y: 0.62, width: 0.08, height: 0.1 },
      { x: 0.79, y: 0.62, width: 0.08, height: 0.1 },
    ];
    const visual = getSpotlightVisualRects(originals, { width: 300, height: 200 });

    expect(visual[0].width).toBeGreaterThan(originals[0].width);
    expect(visual[1].width).toBeGreaterThan(originals[1].width);
    expect(visual[0].x + visual[0].width).toBeLessThanOrEqual(visual[1].x);
  });

  it('fits the scene to both available width and remaining height', () => {
    expect(fitSceneFrameWidth({ width: 366, height: 300 }, 3 / 2)).toBe(366);
    expect(fitSceneFrameWidth({ width: 366, height: 200 }, 3 / 2)).toBe(300);
    expect(fitSceneFrameWidth({ width: 1000, height: 800 }, 3 / 2)).toBe(900);
    expect(fitSceneFrameWidth({ width: 0, height: 300 }, 3 / 2)).toBe(0);
  });
});
