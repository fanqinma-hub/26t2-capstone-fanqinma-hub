import { role2DevActivityFixtures } from '@/fixtures/role2-activity-scenes.fixture';
import { activity01Definition } from '@/fixtures/activity-01.fixture';

import { role2DevSceneList } from '../role2-scene-manifest';
import {
  buildSpotlightDimRegions,
  getSpotlightFrameRects,
  getSpotlightPhaseCount,
  resolveSpotlightPresentation,
} from '../spotlight-geometry';

describe('Role 2 private scene assets', () => {
  it('keeps Activity 2–5 aspect and source decisions explicit', () => {
    expect(role2DevSceneList.map((scene) => [scene.activity, scene.aspectRatio])).toEqual([
      [2, '3:2'],
      [3, '5:4'],
      [4, '5:4'],
      [5, '3:2'],
    ]);
    const activity4 = role2DevSceneList.find((scene) => scene.activity === 4);
    expect(activity4?.sourceFile).toBe('assets/client/scenes/activity-04.png');
    expect(activity4?.checksumSha256).toBe(
      '7dae67bae72712600a35ff3a8b844bb901c6d2c85d3b4b900c7662405a0a4ec9',
    );
  });

  it('keeps every focus target inside normalized scene content coordinates', () => {
    for (const scene of role2DevSceneList) {
      for (const target of scene.focusTargets) {
        expect(target.id.startsWith(`activity-${scene.activity}:`)).toBe(true);
        expect(target.rect.x).toBeGreaterThanOrEqual(0);
        expect(target.rect.y).toBeGreaterThanOrEqual(0);
        expect(target.rect.width).toBeGreaterThan(0);
        expect(target.rect.height).toBeGreaterThan(0);
        expect(target.rect.x + target.rect.width).toBeLessThanOrEqual(1);
        expect(target.rect.y + target.rect.height).toBeLessThanOrEqual(1);
      }
    }
  });

  it('uses the visually reviewed hotspot corrections', () => {
    const target = (sceneActivity: number, id: string) =>
      role2DevSceneList
        .find((scene) => scene.activity === sceneActivity)
        ?.focusTargets.find((candidate) => candidate.id === id)?.rect;

    expect(target(3, 'activity-3:toy-car')).toEqual({ x: 0.505, y: 0.81, width: 0.105, height: 0.09 });
    expect(target(4, 'activity-4:big-pumpkin')).toEqual({ x: 0.04, y: 0.24, width: 0.343, height: 0.46 });
    expect(target(4, 'activity-4:bananas')).toEqual({ x: 0.69, y: 0.42, width: 0.305, height: 0.28 });
    expect(target(4, 'activity-4:grapes')).toEqual({ x: 0.86, y: 0.61, width: 0.13, height: 0.12 });
    expect(target(5, 'activity-5:sandcastle')).toEqual({ x: 0.49, y: 0.44, width: 0.38, height: 0.48 });
    expect(target(5, 'activity-5:crab')).toEqual({ x: 0.14, y: 0.7, width: 0.08, height: 0.11 });
    expect(target(5, 'activity-5:shell')).toEqual({ x: 0.34, y: 0.88, width: 0.09, height: 0.07 });
  });

  it('builds a multi-target dim layer that leaves every target unobscured', () => {
    const targets = [
      { x: 0.1, y: 0.2, width: 0.2, height: 0.3 },
      { x: 0.6, y: 0.5, width: 0.25, height: 0.2 },
    ] as const;
    const regions = buildSpotlightDimRegions(targets);
    expect(regions.length).toBeGreaterThan(0);
    for (const region of regions) {
      const centre = { x: region.x + region.width / 2, y: region.y + region.height / 2 };
      expect(
        targets.some(
          (target) =>
            centre.x >= target.x &&
            centre.x <= target.x + target.width &&
            centre.y >= target.y &&
            centre.y <= target.y + target.height,
        ),
      ).toBe(false);
    }
  });

  it('dims the non-target scene around the Activity 1 spotlight', () => {
    const watermelon = activity01Definition.hotspots.find(
      (target) => target.id === 'watermelon',
    )!;
    const regions = buildSpotlightDimRegions([watermelon]);
    const containsPoint = (x: number, y: number) =>
      regions.some(
        (region) =>
          x >= region.x &&
          x <= region.x + region.width &&
          y >= region.y &&
          y <= region.y + region.height,
      );

    expect(regions.length).toBeGreaterThan(0);
    expect(containsPoint(0.9, 0.5)).toBe(true);
    expect(containsPoint(
      watermelon.x + watermelon.width / 2,
      watermelon.y + watermelon.height / 2,
    )).toBe(false);
  });

  it('keeps adjacent targets separate, groups compact overlaps, and sequences large overlaps', () => {
    const scene = (activity: number) =>
      role2DevSceneList.find((candidate) => candidate.activity === activity)!;
    const rects = (activity: number, ids: readonly string[]) =>
      scene(activity).focusTargets
        .filter((target) => ids.includes(target.id))
        .map((target) => target.rect);

    expect(resolveSpotlightPresentation(rects(4, [
      'activity-4:big-pumpkin',
      'activity-4:medium-pumpkin',
      'activity-4:small-pumpkin',
    ])).mode).toBe('individual');
    expect(resolveSpotlightPresentation(rects(4, [
      'activity-4:bananas',
      'activity-4:grapes',
    ])).mode).toBe('grouped');
    const beachSequence = resolveSpotlightPresentation(rects(5, [
      'activity-5:wave',
      'activity-5:sandcastle',
      'activity-5:umbrella',
    ]));
    expect(beachSequence.mode).toBe('sequential');
    expect(getSpotlightPhaseCount(beachSequence)).toBe(4);
    expect(getSpotlightFrameRects(beachSequence, 0)).toEqual([
      expect.objectContaining({ x: 0.31, y: 0.18 }),
    ]);
    expect(getSpotlightFrameRects(beachSequence, 1)).toEqual([
      expect.objectContaining({ x: 0.49, y: 0.44 }),
    ]);
    expect(getSpotlightFrameRects(beachSequence, 2)).toEqual([
      expect.objectContaining({ x: 0.72, y: 0.13 }),
    ]);
    const beachSummary = getSpotlightFrameRects(beachSequence, 3)[0];
    expect(beachSummary).toMatchObject({ x: 0.31, y: 0.13, width: 0.69 });
    expect(beachSummary.height).toBeCloseTo(0.79);
    expect(getSpotlightFrameRects(beachSequence, 4)).toEqual(
      getSpotlightFrameRects(beachSequence, 3),
    );
    expect(resolveSpotlightPresentation(rects(5, [
      'activity-5:shell',
      'activity-5:crab',
    ])).mode).toBe('individual');
  });
});

describe('Role 2 Excel dialogue fixtures', () => {
  it('covers every child-facing development state for Activities 2–5', () => {
    const expectedStates = [
      'prompt',
      'listening',
      'gentleCue',
      'reprompt',
      'clue',
      'processing',
      'feedback',
      'retry',
      'complete',
    ];
    for (const fixture of role2DevActivityFixtures) {
      expect(fixture.steps.map((step) => step.state)).toEqual(expectedStates);
      expect(fixture.scriptSource).toBe('Team ALMOND TASKS.xlsx / Learning unit details');
      expect(fixture.scriptLinesVerbatim.length).toBeGreaterThanOrEqual(9);
    }
  });

  it('retains representative Excel lines verbatim', () => {
    const fixture = (activity: number) =>
      role2DevActivityFixtures.find((candidate) => candidate.activity === activity)!;
    expect(fixture(2).scriptLinesVerbatim[0]).toBe(
      'Kool: Oh, we’re at the park today! I love the park. What can you see here?',
    );
    expect(fixture(3).scriptLinesVerbatim[0]).toBe(
      'Kool: Whoa! Look at this bedroom! Something in here is VERY unusual. What do you notice?',
    );
    expect(fixture(4).scriptLinesVerbatim[2]).toBe(
      'Kool: Look at these three pumpkins! Can you tell me about them? What’s different about them?',
    );
    expect(fixture(5).scriptLinesVerbatim.at(-1)).toBe(
      'Kool: You used SO many size words today — big, tiny, huge, gigantic, medium, small! You are a SIZE WORD SUPERSTAR! 🪙🪙🪙',
    );
  });

  it('keeps Activity 5 formal focus prompt-specific and leaves overlap sequencing to QA', () => {
    const activity5 = role2DevActivityFixtures.find((fixture) => fixture.activity === 5)!;
    const focusIds = activity5.steps.flatMap((step) => step.activeFocusTargetIds);
    const retry = activity5.steps.find((step) => step.state === 'retry');

    expect(focusIds).toContain('activity-5:wave');
    expect(focusIds).toContain('activity-5:sandcastle');
    expect(focusIds).toContain('activity-5:shell');
    expect(focusIds).toContain('activity-5:crab');
    expect(focusIds).not.toContain('activity-5:umbrella');
    expect(retry?.activeFocusTargetIds).toEqual([
      'activity-5:shell',
      'activity-5:crab',
    ]);

    for (const step of activity5.steps) {
      const activeIds: readonly string[] = step.activeFocusTargetIds;
      const rects = role2DevSceneList
        .find((scene) => scene.activity === 5)!
        .focusTargets
        .filter((target) => activeIds.includes(target.id))
        .map((target) => target.rect);
      expect(resolveSpotlightPresentation(rects).mode).not.toBe('sequential');
    }
  });
});
