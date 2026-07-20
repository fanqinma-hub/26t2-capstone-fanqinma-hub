import { sceneAssetManifest } from '@/components/activity/scene-asset-manifest';
import { activity01Definition } from '@/fixtures/activity-01.fixture';
import type {
  FocusTargetId,
  SceneAssetKey,
} from '@/types/visual.types';

export type FormalActivityNumber = 1 | 2 | 3 | 4 | 5;

export type FormalDemoQuestion = Readonly<{
  id: string;
  promptText: string;
  gentleCueText: string;
  repromptText: string;
  helpText: string;
  recastText: string;
  targetAdjectives: readonly string[];
  expectedNouns: readonly string[];
  acceptedExamples: readonly string[];
  focusTargetIds: readonly FocusTargetId[];
  acceptsAnyResponse?: boolean;
}>;

export type FormalDemoActivityDefinition = Readonly<{
  activity: FormalActivityNumber;
  title: string;
  sceneAssetKey: SceneAssetKey;
  questions: readonly FormalDemoQuestion[];
  completeText: string;
}>;

const gentleCueText = 'Take your time. Look closely at the picture.';

function target(activity: FormalActivityNumber, id: string): FocusTargetId {
  return `activity-${activity}:${id}`;
}

const activity1: FormalDemoActivityDefinition = {
  activity: 1,
  title: 'The Kitchen Bench',
  sceneAssetKey: 'kitchen-bench',
  questions: activity01Definition.prompts.map((prompt) => {
    const hotspot = activity01Definition.hotspots.find(
      (candidate) => candidate.id === prompt.hotspotId,
    );
    return {
      id: prompt.id,
      promptText: prompt.koolPrompt,
      gentleCueText,
      repromptText: prompt.helpPrompt,
      helpText: hotspot?.helpPrompt ?? prompt.helpPrompt,
      recastText: prompt.recastText,
      targetAdjectives: prompt.targetAdjectives,
      expectedNouns: prompt.expectedNouns,
      acceptedExamples: [
        ...prompt.acceptedResponses.minimum,
        ...prompt.acceptedResponses.target,
        ...prompt.acceptedResponses.bonus,
      ],
      focusTargetIds: [target(1, prompt.hotspotId)],
      acceptsAnyResponse: 'acceptsAnyResponse' in prompt
        ? prompt.acceptsAnyResponse
        : undefined,
    };
  }),
  completeText: 'You noticed big things and tiny things everywhere!',
};

const activity2: FormalDemoActivityDefinition = {
  activity: 2,
  title: 'At the Park',
  sceneAssetKey: 'park',
  questions: [
    {
      id: 'activity-2-open-park',
      promptText: 'Oh, we’re at the park today! I love the park. What can you see here?',
      gentleCueText,
      repromptText: 'Tell me one thing you notice in the park.',
      helpText: 'Look around the park and tell me about anything you can see.',
      recastText: 'You spotted something at the park!',
      targetAdjectives: [], expectedNouns: [], acceptedExamples: [], focusTargetIds: [target(2, 'gum-tree')], acceptsAnyResponse: true,
    },
    {
      id: 'activity-2-tree',
      promptText: 'Look at that tree — WOW! What would you say about that tree?',
      gentleCueText,
      repromptText: 'Is that gum tree big, small, or something else?',
      helpText: 'Look at the tree that fills most of the left side.',
      recastText: 'It’s HUGE! A huge gum tree!',
      targetAdjectives: ['big', 'huge', 'tall'], expectedNouns: ['tree', 'gum tree'], acceptedExamples: ['a big tree', 'a huge tree', 'it’s so tall'], focusTargetIds: [target(2, 'gum-tree')],
    },
    {
      id: 'activity-2-flower',
      promptText: 'Look down near the bottom — do you see that tiny thing?',
      gentleCueText,
      repromptText: 'What is the tiny thing near the bottom of the tree?',
      helpText: 'Look for the tiny yellow flower at the base of the tree.',
      recastText: 'A small little flower! So tiny next to that huge tree!',
      targetAdjectives: ['small', 'tiny'], expectedNouns: ['flower'], acceptedExamples: ['a flower', 'a tiny flower', 'it’s small'], focusTargetIds: [target(2, 'flower')],
    },
    {
      id: 'activity-2-dog',
      promptText: 'And over here — what’s that big fluffy animal?',
      gentleCueText,
      repromptText: 'What is the big golden animal in the park?',
      helpText: 'Look at the large fluffy animal standing on the right.',
      recastText: 'A huge dog!',
      targetAdjectives: ['big', 'huge'], expectedNouns: ['dog'], acceptedExamples: ['a dog', 'a big dog', 'a huge dog'], focusTargetIds: [target(2, 'dog')],
    },
    {
      id: 'activity-2-bird',
      promptText: 'And look who’s next to it — what’s that little thing on the ground?',
      gentleCueText,
      repromptText: 'What is the tiny animal on the ground near the dog?',
      helpText: 'Look for the little bird on the ground beside the dog.',
      recastText: 'A tiny little bird!',
      targetAdjectives: ['small', 'tiny'], expectedNouns: ['bird'], acceptedExamples: ['a bird', 'a small bird', 'a tiny bird'], focusTargetIds: [target(2, 'bird')],
    },
    {
      id: 'activity-2-friends',
      promptText: 'Do you think the dog and the bird are friends?',
      gentleCueText,
      repromptText: 'Tell me what you think about the dog and the bird.',
      helpText: 'Look at the huge dog and the tiny bird together.',
      recastText: 'Ha! Maybe! The huge dog and the tiny bird — what a funny pair!',
      targetAdjectives: ['huge', 'tiny'], expectedNouns: [], acceptedExamples: [], focusTargetIds: [target(2, 'dog'), target(2, 'bird')], acceptsAnyResponse: true,
    },
  ],
  completeText: 'The huge dog and the tiny bird make a funny pair!',
};

const activity3: FormalDemoActivityDefinition = {
  activity: 3,
  title: 'The Toy Box',
  sceneAssetKey: 'toy-box',
  questions: [
    {
      id: 'activity-3-unusual',
      promptText: 'Whoa! Look at this bedroom! Something in here is VERY unusual. What do you notice?',
      gentleCueText,
      repromptText: 'What looks unusual in this bedroom?',
      helpText: 'Look at the teddy bear that almost touches the ceiling.',
      recastText: 'That teddy bear is so big it almost touches the ceiling!',
      targetAdjectives: ['big', 'huge', 'gigantic'], expectedNouns: [], acceptedExamples: [], focusTargetIds: [target(3, 'teddy-bear')], acceptsAnyResponse: true,
    },
    {
      id: 'activity-3-gigantic',
      promptText: 'What would you call something that enormous?',
      gentleCueText,
      repromptText: 'Can you think of a size word for something enormous?',
      helpText: 'Look at the enormous teddy bear. It is much bigger than everything else.',
      recastText: 'GIGANTIC is the perfect word!',
      targetAdjectives: ['gigantic', 'huge', 'big', 'massive'], expectedNouns: [], acceptedExamples: ['gigantic', 'huge', 'big', 'massive'], focusTargetIds: [target(3, 'teddy-bear')],
    },
    {
      id: 'activity-3-toy-car',
      promptText: 'And look on the floor — what’s that tiny thing down there?',
      gentleCueText,
      repromptText: 'What is the tiny red thing on the floor?',
      helpText: 'Look for the tiny red toy on the rug.',
      recastText: 'A tiny toy car! So tiny!',
      targetAdjectives: ['tiny', 'small'], expectedNouns: ['car', 'toy car'], acceptedExamples: ['a car', 'a tiny car', 'a small toy car'], focusTargetIds: [target(3, 'toy-car')],
    },
    {
      id: 'activity-3-imagine',
      promptText: 'Can you imagine a gigantic bear driving a tiny car?',
      gentleCueText,
      repromptText: 'Tell me what might happen if the bear drove that car.',
      helpText: 'Look at the gigantic bear and the tiny car together.',
      recastText: 'Ha! The gigantic bear and the tiny car! What a funny picture!',
      targetAdjectives: ['gigantic', 'tiny'], expectedNouns: [], acceptedExamples: [], focusTargetIds: [target(3, 'teddy-bear'), target(3, 'toy-car')], acceptsAnyResponse: true,
    },
  ],
  completeText: 'The gigantic bear and tiny car make a funny picture!',
};

const activity4: FormalDemoActivityDefinition = {
  activity: 4,
  title: 'The Farmer’s Market',
  sceneAssetKey: 'farmers-market',
  questions: [
    {
      id: 'activity-4-open-market',
      promptText: 'Ooh, it’s market day! Look at all these yummy things. What can you see on this stall?',
      gentleCueText,
      repromptText: 'Tell me one thing you notice on the market stall.',
      helpText: 'Look across the stall and tell me about anything you can see.',
      recastText: 'You spotted something at the market!',
      targetAdjectives: [], expectedNouns: [], acceptedExamples: [], focusTargetIds: [target(4, 'big-pumpkin'), target(4, 'medium-pumpkin'), target(4, 'small-pumpkin')], acceptsAnyResponse: true,
    },
    {
      id: 'activity-4-pumpkins',
      promptText: 'Look at these three pumpkins! Can you tell me about them? What’s different about them?',
      gentleCueText,
      repromptText: 'How are the three pumpkins different in size?',
      helpText: 'Look from the biggest pumpkin to the smallest pumpkin.',
      recastText: 'That’s right! This one is BIG, this one is SMALL, and one is in the middle!',
      targetAdjectives: ['big', 'medium', 'small'], expectedNouns: ['pumpkin', 'pumpkins'], acceptedExamples: ['big and small', 'three pumpkins', 'different sizes'], focusTargetIds: [target(4, 'big-pumpkin'), target(4, 'medium-pumpkin'), target(4, 'small-pumpkin')], acceptsAnyResponse: true,
    },
    {
      id: 'activity-4-medium',
      promptText: 'The pumpkin in the middle is not big and not small. What do we call that?',
      gentleCueText,
      repromptText: 'What size word means not too big and not too small?',
      helpText: 'Look at the middle-sized pumpkin between the big and small pumpkins.',
      recastText: 'MEDIUM! Not too big, not too small — just medium!',
      targetAdjectives: ['medium'], expectedNouns: [], acceptedExamples: ['medium', 'middle', 'not big and not small'], focusTargetIds: [target(4, 'medium-pumpkin')],
    },
    {
      id: 'activity-4-fruit-size',
      promptText: 'Now over here — which is bigger, the bananas or the grapes?',
      gentleCueText,
      repromptText: 'Compare the bananas and the grapes. Which takes up more space?',
      helpText: 'Look at the bunch of bananas and the small bunch of grapes.',
      recastText: 'The big bananas and the small grapes! You know all your sizes!',
      targetAdjectives: ['big', 'small'], expectedNouns: ['bananas', 'grapes'], acceptedExamples: ['the bananas', 'the bananas are bigger'], focusTargetIds: [target(4, 'bananas'), target(4, 'grapes')],
    },
  ],
  completeText: 'The big bananas and small grapes show so many sizes!',
};

const activity5: FormalDemoActivityDefinition = {
  activity: 5,
  title: 'The Beach Day',
  sceneAssetKey: 'beach-day',
  questions: [
    {
      id: 'activity-5-open-beach',
      promptText: 'We made it to the beach! This is my favourite place. What can you see? Tell me everything!',
      gentleCueText,
      repromptText: 'Tell me one thing you notice at the beach.',
      helpText: 'Look around the beach and tell me about anything you can see.',
      recastText: 'You spotted something at the beach!',
      targetAdjectives: [], expectedNouns: [], acceptedExamples: [], focusTargetIds: [target(5, 'wave')], acceptsAnyResponse: true,
    },
    {
      id: 'activity-5-wave',
      promptText: 'What size is that wave in the background?',
      gentleCueText,
      repromptText: 'Is the wave tiny, medium, or huge?',
      helpText: 'Look at the enormous blue wave in the background.',
      recastText: 'A HUGE wave!',
      targetAdjectives: ['huge', 'big', 'gigantic'], expectedNouns: ['wave'], acceptedExamples: ['huge', 'big', 'gigantic'], focusTargetIds: [target(5, 'wave')],
    },
    {
      id: 'activity-5-swim',
      promptText: 'Would you swim in a huge wave?',
      gentleCueText,
      repromptText: 'Tell me what you would do near that huge wave.',
      helpText: 'Look at the huge wave and tell me what you think.',
      recastText: 'Thanks for telling me what you would do near that huge wave!',
      targetAdjectives: ['huge'], expectedNouns: [], acceptedExamples: [], focusTargetIds: [target(5, 'wave')], acceptsAnyResponse: true,
    },
    {
      id: 'activity-5-sandcastle',
      promptText: 'And look at that sandcastle — what would you say about it?',
      gentleCueText,
      repromptText: 'What size word would you use for the sandcastle?',
      helpText: 'Look at the sandcastle near the bottom of the beach.',
      recastText: 'You found a size word for the sandcastle!',
      targetAdjectives: ['big', 'medium', 'small'], expectedNouns: ['sandcastle'], acceptedExamples: ['big', 'medium', 'small'], focusTargetIds: [target(5, 'sandcastle')],
    },
    {
      id: 'activity-5-tiniest',
      promptText: 'And can you spot the tiniest thing on the whole beach?',
      gentleCueText,
      repromptText: 'Look carefully for a very tiny shell or a small crab.',
      helpText: 'Look near the bottom for the tiny shell, or across the sand for the small crab.',
      recastText: 'Yes! A tiny little shell or a small crab! You found it!',
      targetAdjectives: ['tiny', 'small'], expectedNouns: ['shell', 'crab'], acceptedExamples: ['the shell', 'a tiny shell', 'the crab'], focusTargetIds: [target(5, 'shell'), target(5, 'crab')],
    },
  ],
  completeText: 'You used so many size words today — big, tiny, huge, gigantic, medium, and small! You are a SIZE WORD SUPERSTAR!',
};

export const formalDemoActivityDefinitions = {
  1: activity1,
  2: activity2,
  3: activity3,
  4: activity4,
  5: activity5,
} as const satisfies Readonly<Record<FormalActivityNumber, FormalDemoActivityDefinition>>;

export function getFormalDemoRegistryIssues(): readonly string[] {
  return Object.values(formalDemoActivityDefinitions).flatMap((activity) => {
    const manifestIds = new Set<FocusTargetId>(
      sceneAssetManifest[activity.sceneAssetKey].focusTargets.map((focus) => focus.id),
    );
    return activity.questions.flatMap((question) =>
      question.focusTargetIds
        .filter((focusTargetId) => !manifestIds.has(focusTargetId))
        .map((focusTargetId) => `${question.id}: missing ${focusTargetId}`),
    );
  });
}

const registryIssues = getFormalDemoRegistryIssues();
if (registryIssues.length > 0) {
  throw new Error(`Invalid formal Activity fixture registry: ${registryIssues.join(', ')}`);
}
