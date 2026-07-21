import { sceneAssetManifest } from '@/components/activity/scene-asset-manifest';

import {
  getSizeWordsPrompt,
  getSizeWordsUnitIssues,
  sizeWordsUnit,
} from '../size-words-unit';

describe('sizeWordsUnit content registry', () => {
  it('encodes one ordered five-activity unit with globally unique prompt ids', () => {
    const prompts = sizeWordsUnit.activities.flatMap((activity) => activity.prompts);

    expect(sizeWordsUnit.activities.map(({ order }) => order)).toEqual([1, 2, 3, 4, 5]);
    expect(prompts).toHaveLength(25);
    expect(new Set(prompts.map(({ id }) => id)).size).toBe(25);
    expect(getSizeWordsUnitIssues()).toEqual([]);
  });

  it('keeps accepted response tiers, noun aliases and focus references in content data', () => {
    for (const activity of sizeWordsUnit.activities) {
      const sceneTargetIds = new Set<string>(
        sceneAssetManifest[activity.sceneAssetKey].focusTargets.map(({ id }) => id),
      );
      for (const prompt of activity.prompts) {
        expect(prompt.id.startsWith(`${activity.id}:`)).toBe(true);
        expect(prompt.acceptedExamples.tier1.length).toBeGreaterThan(0);
        expect(prompt.acceptedExamples.tier2.length).toBeGreaterThan(0);
        expect(prompt.acceptedExamples.tier3.length).toBeGreaterThan(0);
        expect(prompt.focusTargetIds.every((id) => sceneTargetIds.has(id))).toBe(true);
      }
    }

    expect(getSizeWordsPrompt('activity-1:strawberry')?.nounAliases).toContain('straw');
    expect(getSizeWordsPrompt('activity-4:medium-pumpkin')?.acceptedExamples.tier1)
      .toContain('middle');
  });

  it('uses fixed reward checkpoints and all six primary words in Activity 5', () => {
    expect(
      sizeWordsUnit.activities.map(({ id, rewardCheckpointId }) => [
        id,
        rewardCheckpointId ?? null,
      ]),
    ).toEqual([
      ['activity-1', 'coin-after-activity-1'],
      ['activity-2', null],
      ['activity-3', 'coin-after-activity-3'],
      ['activity-4', null],
      ['activity-5', 'coin-after-activity-5'],
    ]);
    expect(sizeWordsUnit.activities[4].targetAdjectives).toEqual(
      sizeWordsUnit.primaryWords,
    );
  });
});
