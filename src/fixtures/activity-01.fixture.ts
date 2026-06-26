import type { ActivityHotspot } from '@/components/activity';
import { clientScenes } from '@/constants/client-assets';
import type { ActivityDefinition } from '@/types/activity.types';

export const sizeWordsUnitMetadata = {
  id: 'size-words-unit',
  contentVersion: '2026-06-25',
  title: 'Big, Small and Everything in Between!',
  totalActivities: 5,
} as const;

/**
 * Role 3 source data for Activity 1.
 *
 * The prompts, accepted responses and hotspots are content contracts. Role 4
 * owns conversation progression and Role 5 owns STT and tier classification.
 */
export const activity01Definition = {
  id: '1',
  slug: 'the-kitchen-bench',
  order: 1,
  title: 'Activity 1: The Kitchen Bench',
  scene: {
    assetKey: 'activity1',
    source: clientScenes.activity1.source,
    accessibilityLabel:
      'A kitchen bench with a very large watermelon, a tiny strawberry, a large cooking pot and a tiny teacup.',
  },
  runtimeSeconds: 90,
  targetAdjectives: ['big', 'tiny', 'small', 'huge'],
  teachingTechnique: 'Maximal contrast pair: big versus tiny',
  introMessage:
    'Wow, look at this kitchen! Something is a little bit silly here. Tell me what you see.',
  exchanges: [
    {
      id: 'activity-1-exchange-fruit',
      title: 'Watermelon and strawberry',
      approximateDurationSeconds: 45,
      promptIds: [
        'activity-1-watermelon',
        'activity-1-strawberry',
        'activity-1-size-contrast',
      ],
    },
    {
      id: 'activity-1-exchange-kitchenware',
      title: 'Pot and teacup',
      approximateDurationSeconds: 30,
      promptIds: ['activity-1-pot', 'activity-1-teacup'],
    },
    {
      id: 'activity-1-exchange-wrap-up',
      title: 'Size words wrap-up',
      approximateDurationSeconds: 15,
      promptIds: ['activity-1-wrap-up'],
    },
  ],
  prompts: [
    {
      id: 'activity-1-watermelon',
      sequence: 1,
      koolPrompt: "What's that big green thing on the left?",
      expectedNouns: ['watermelon'],
      targetAdjectives: ['big', 'huge', 'gigantic'],
      acceptedResponses: {
        minimum: ['watermelon'],
        target: ['a big watermelon'],
        bonus: ['a huge watermelon', "it's gigantic"],
      },
      recastText: 'A BIG watermelon! So big!',
      helpPrompt: 'Look at the big green fruit on the left. What is it?',
      hotspotId: 'watermelon',
    },
    {
      id: 'activity-1-strawberry',
      sequence: 2,
      koolPrompt:
        'And right next to it, look at that tiny red one. What is it?',
      expectedNouns: ['strawberry'],
      targetAdjectives: ['tiny', 'small'],
      acceptedResponses: {
        minimum: ['strawberry'],
        target: ['a tiny strawberry'],
        bonus: ["it's really small", 'super tiny'],
      },
      recastText:
        'A tiny little strawberry! Look how TINY it is next to that big watermelon!',
      helpPrompt: 'Can you see the tiny red fruit beside the watermelon?',
      hotspotId: 'strawberry',
    },
    {
      id: 'activity-1-size-contrast',
      sequence: 3,
      koolPrompt: 'Which one is bigger, the watermelon or the strawberry?',
      expectedNouns: ['watermelon', 'strawberry'],
      targetAdjectives: ['big', 'huge', 'tiny', 'small'],
      acceptedResponses: {
        minimum: ['watermelon', 'that one'],
        target: ['the big watermelon'],
        bonus: [
          'the watermelon is bigger',
          'the watermelon is huge and the strawberry is tiny',
        ],
      },
      recastText:
        'Yes! The watermelon is BIG and the strawberry is tiny.',
      helpPrompt: 'Point to the one that takes up the most space.',
      hotspotId: 'watermelon',
    },
    {
      id: 'activity-1-pot',
      sequence: 4,
      koolPrompt:
        "And over here, there's something you cook with. What is it?",
      expectedNouns: ['pot', 'cooking pot'],
      targetAdjectives: ['big', 'huge'],
      acceptedResponses: {
        minimum: ['pot'],
        target: ['a big pot'],
        bonus: ['a really huge cooking pot'],
      },
      recastText: 'A big cooking pot! Great spotting!',
      helpPrompt: 'Look for the big thing with a lid and two handles.',
      hotspotId: 'cooking-pot',
    },
    {
      id: 'activity-1-teacup',
      sequence: 5,
      koolPrompt: "And right next to it, what's that tiny little thing?",
      expectedNouns: ['cup', 'teacup'],
      targetAdjectives: ['tiny', 'small'],
      acceptedResponses: {
        minimum: ['cup', 'teacup'],
        target: ['a tiny teacup'],
        bonus: ['a tiny little teacup', "it's so small"],
      },
      recastText: 'A tiny teacup! It is so small beside the big pot!',
      helpPrompt: 'Look beside the cooking pot for a very small cup.',
      hotspotId: 'teacup',
    },
    {
      id: 'activity-1-wrap-up',
      sequence: 6,
      koolPrompt:
        'You noticed so many sizes! What was the biggest thing you saw?',
      expectedNouns: ['watermelon'],
      targetAdjectives: ['big', 'huge'],
      acceptedResponses: {
        minimum: ['watermelon'],
        target: ['the big watermelon'],
        bonus: ['the huge green watermelon'],
      },
      recastText:
        'Yes! This kitchen has BIG things and tiny things everywhere!',
      helpPrompt: 'Think about the object that filled most of the left side.',
      hotspotId: 'watermelon',
    },
  ],
  hotspots: [
    {
      id: 'watermelon',
      label: 'Watermelon clue',
      objectName: 'watermelon',
      x: 0.05,
      y: 0.15,
      width: 0.46,
      height: 0.64,
      helpPrompt: 'Look at the very large green fruit on the left.',
    },
    {
      id: 'strawberry',
      label: 'Strawberry clue',
      objectName: 'strawberry',
      x: 0.46,
      y: 0.71,
      width: 0.05,
      height: 0.09,
      helpPrompt: 'Look for the tiny red fruit beside the watermelon.',
    },
    {
      id: 'cooking-pot',
      label: 'Cooking pot clue',
      objectName: 'cooking pot',
      x: 0.53,
      y: 0.4,
      width: 0.32,
      height: 0.39,
      helpPrompt: 'Look for the large pot with a lid and handles.',
    },
    {
      id: 'teacup',
      label: 'Teacup clue',
      objectName: 'teacup',
      x: 0.83,
      y: 0.68,
      width: 0.1,
      height: 0.12,
      helpPrompt: 'Look for the tiny cup beside the cooking pot.',
    },
  ],
  rewardCheckpoint: {
    id: 'coin-checkpoint-1',
    kind: 'coin',
    afterPromptId: 'activity-1-wrap-up',
    koolMessage: "You're such a great noticer. Here's your coin!",
  },
  clinicalNote:
    'Kool does not mark a noun-only response as wrong. Kool recasts it with a size adjective.',
} as const satisfies ActivityDefinition;

export type ActivityScreenContentAdapter = {
  activityId: string;
  title: string;
  sceneSource: typeof clientScenes.activity1.source;
  currentActivity: number;
  totalActivities: number;
  hotspots: readonly ActivityHotspot[];
};

/** Maps ActivityDefinition data into the existing Role 2 screen props. */
export function toActivityScreenContent(
  activity: ActivityDefinition,
): ActivityScreenContentAdapter {
  return {
    activityId: activity.id,
    title: activity.title,
    sceneSource: activity.scene.source as typeof clientScenes.activity1.source,
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

/** Maps structured prompt content into the replaceable Sprint 1 demo flow. */
export function toActivity01DemoCopy(
  prompt: ActivityDefinition['prompts'][number],
) {
  const hotspot = activity01Definition.hotspots.find(
    (candidate) => candidate.id === prompt.hotspotId,
  );

  return {
    intro: activity01Definition.introMessage,
    prompt: prompt.koolPrompt,
    listening: "I'm listening. Tell me what you can see.",
    gentleCue: 'Take your time. Look closely at the picture.',
    reprompt: prompt.helpPrompt,
    tapHelpAvailable: 'Need a clue? Tap the little question mark.',
    cluePresented: hotspot?.helpPrompt ?? prompt.helpPrompt,
    finalListening: prompt.helpPrompt,
    success: prompt.recastText,
  } as const;
}

export const activity01DemoCopy = toActivity01DemoCopy(
  activity01Definition.prompts[0],
);
