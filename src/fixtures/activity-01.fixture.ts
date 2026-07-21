import type { ActivityHotspot } from '@/components/activity';
import { sceneAssetManifest } from '@/components/activity/scene-asset-manifest';
import { getSizeWordsActivity, sizeWordsUnit } from '@/content/size-words';
import { clientScenes } from '@/constants/client-assets';
import type {
  ActivityDefinition,
  ActivityPromptDefinition,
} from '@/types/activity.types';

export const sizeWordsUnitMetadata = {
  id: sizeWordsUnit.id,
  contentVersion: sizeWordsUnit.contentVersion,
  title: sizeWordsUnit.title,
  totalActivities: sizeWordsUnit.activities.length,
} as const;

const canonicalActivity01 = getSizeWordsActivity('activity-1');
if (!canonicalActivity01) throw new Error('Activity 1 is missing from sizeWordsUnit');

type LegacyPromptAliases = {
  koolPrompt: string;
  helpPrompt: string;
  acceptedResponses: {
    minimum: readonly string[];
    target: readonly string[];
    bonus: readonly string[];
  };
  hotspotId: string;
  acceptsAnyResponse?: boolean;
};

type Activity01FixturePrompt = ActivityPromptDefinition & LegacyPromptAliases;

type Activity01FixtureDefinition = Omit<ActivityDefinition, 'prompts'> & {
  prompts: readonly Activity01FixturePrompt[];
  slug: 'the-kitchen-bench';
  scene: {
    assetKey: 'activity1';
    source: typeof clientScenes.activity1.source;
    accessibilityLabel: string;
  };
  introMessage: string;
  hotspots: readonly {
    id: string;
    label: string;
    objectName: string;
    x: number;
    y: number;
    width: number;
    height: number;
    helpPrompt: string;
  }[];
};

/**
 * Temporary Sprint 1/Role 1 demo adapter. Canonical content lives only in
 * sizeWordsUnit; this object adds legacy presentation aliases without defining
 * another ActivityDefinition schema.
 */
export const activity01Definition: Activity01FixtureDefinition = {
  ...canonicalActivity01,
  slug: 'the-kitchen-bench',
  scene: {
    assetKey: 'activity1',
    source: clientScenes.activity1.source,
    accessibilityLabel:
      sceneAssetManifest['kitchen-bench'].accessibilityLabel,
  },
  introMessage: canonicalActivity01.introText,
  prompts: canonicalActivity01.prompts.map((prompt) => ({
    ...prompt,
    koolPrompt: prompt.promptText,
    helpPrompt: prompt.helpText,
    acceptedResponses: {
      minimum: prompt.acceptedExamples.tier1,
      target: prompt.acceptedExamples.tier2,
      bonus: prompt.acceptedExamples.tier3,
    },
    hotspotId: prompt.focusTargetIds[0].split(':')[1],
    acceptsAnyResponse: prompt.acceptedExamples.tier1.includes(
      'any spoken response',
    ),
  })),
  hotspots: sceneAssetManifest['kitchen-bench'].focusTargets.map((focus) => ({
    id: focus.id.split(':')[1],
    label: focus.label,
    objectName: focus.objectName,
    ...focus.rect,
    helpPrompt: `Look at the ${focus.objectName}.`,
  })),
};

export type ActivityScreenContentAdapter = {
  activityId: string;
  title: string;
  sceneSource: typeof clientScenes.activity1.source;
  currentActivity: number;
  totalActivities: number;
  hotspots: readonly ActivityHotspot[];
};

export function toActivityScreenContent(
  activity: Activity01FixtureDefinition,
): ActivityScreenContentAdapter {
  return {
    activityId: activity.id,
    title: activity.title,
    sceneSource: activity.scene.source,
    currentActivity: activity.order,
    totalActivities: sizeWordsUnitMetadata.totalActivities,
    hotspots: activity.hotspots.map(({ id, label, x, y, width, height }) => ({
      id,
      label,
      x,
      y,
      width,
      height,
    })),
  };
}

export const activity01DevelopmentFixture =
  toActivityScreenContent(activity01Definition);

export const activity01SessionSeed = {
  unitId: sizeWordsUnitMetadata.id,
  contentVersion: sizeWordsUnitMetadata.contentVersion,
  activityId: activity01Definition.id,
  promptIds: activity01Definition.prompts.map((prompt) => prompt.id),
} as const;

export function toActivity01DemoCopy(prompt: Activity01FixturePrompt) {
  const hotspot = activity01Definition.hotspots.find(
    (candidate) => candidate.id === prompt.hotspotId,
  );

  return {
    intro: activity01Definition.introText,
    prompt: prompt.promptText,
    listening: "I'm listening. Tell me what you can see.",
    gentleCue: 'Take your time. Look closely at the picture.',
    reprompt: prompt.repromptText,
    tapHelpAvailable: 'Need a clue? Tap the little question mark.',
    cluePresented: hotspot?.helpPrompt ?? prompt.helpText,
    finalListening: prompt.helpText,
    success: prompt.recastText,
  } as const;
}

export const activity01DemoCopy = toActivity01DemoCopy(
  activity01Definition.prompts[0],
);
