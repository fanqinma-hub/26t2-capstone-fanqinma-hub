import type {
  ActivityDefinition,
  ActivityId,
  ActivityPromptDefinition,
  LearningUnitDefinition,
  PromptId,
} from '@/types/activity.types';

const activities = [
  {
    id: 'activity-1',
    order: 1,
    title: 'The Kitchen Bench',
    sceneAssetKey: 'kitchen-bench',
    runtimeSeconds: 90,
    targetAdjectives: ['big', 'tiny'],
    teachingTechnique: 'Maximal contrast pair: big versus tiny',
    introText:
      'Wow, look at this kitchen! Something is a little bit… silly here! Can you see what I mean? Tell me what you see!',
    rewardCheckpointId: 'coin-after-activity-1',
    prompts: [
      {
        id: 'activity-1:watermelon',
        sequence: 1,
        kind: 'open',
        promptText: 'What’s that big green thing on the left?',
        repromptText: 'What is the big green fruit on the left?',
        helpText: 'Look at the very large green fruit on the left.',
        recastText: 'A BIG watermelon! So big!',
        targetAdjectives: ['big', 'huge', 'gigantic'],
        expectedNouns: ['watermelon'],
        nounAliases: ['water melon', 'water lemon', 'melon', 'water'],
        focusTargetIds: ['activity-1:watermelon'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['watermelon'],
          tier2: ['a big watermelon'],
          tier3: ['a huge watermelon', 'it’s gigantic'],
        },
      },
      {
        id: 'activity-1:strawberry',
        sequence: 2,
        kind: 'open',
        promptText: 'And right next to it—look at that tiny red one. What is it?',
        repromptText: 'What is the tiny red fruit beside the watermelon?',
        helpText: 'Look for the tiny red fruit beside the watermelon.',
        recastText:
          'A tiny little strawberry! Look how TINY it is next to that big watermelon!',
        targetAdjectives: ['tiny', 'small'],
        expectedNouns: ['strawberry'],
        nounAliases: ['straw berry', 'strawberries', 'berry', 'berries', 'straw'],
        focusTargetIds: ['activity-1:strawberry'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['strawberry'],
          tier2: ['a tiny strawberry'],
          tier3: ['it’s really small', 'super tiny'],
        },
      },
      {
        id: 'activity-1:size-contrast',
        sequence: 3,
        kind: 'open',
        promptText: 'Which one is bigger—the watermelon or the strawberry?',
        repromptText: 'Tell me which fruit is bigger.',
        helpText: 'Look at the fruit that takes up most of the left side.',
        recastText:
          'Yes! The watermelon is BIG and the strawberry is tiny. What a funny kitchen!',
        targetAdjectives: ['big', 'huge', 'tiny', 'small'],
        expectedNouns: ['watermelon', 'strawberry'],
        nounAliases: ['melon', 'berry', 'that one', 'the big one'],
        focusTargetIds: ['activity-1:watermelon', 'activity-1:strawberry'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['watermelon', 'that one'],
          tier2: ['the big watermelon'],
          tier3: [
            'the watermelon is bigger',
            'the watermelon is huge and the strawberry is tiny',
          ],
        },
      },
      {
        id: 'activity-1:cooking-pot',
        sequence: 4,
        kind: 'open',
        promptText:
          'And over here—there’s something you cook with. What do you think that is?',
        repromptText: 'What is the big thing with a lid and two handles?',
        helpText: 'Look for the large pot with a lid and handles.',
        recastText: 'A big cooking pot! Great spotting!',
        targetAdjectives: ['big', 'huge'],
        expectedNouns: ['pot', 'cooking pot'],
        nounAliases: ['saucepan'],
        focusTargetIds: ['activity-1:cooking-pot'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['pot'],
          tier2: ['a big pot'],
          tier3: ['a really huge cooking pot'],
        },
      },
      {
        id: 'activity-1:teacup',
        sequence: 5,
        kind: 'open',
        promptText: 'And right next to it—what’s that tiny little thing?',
        repromptText: 'What is the tiny cup beside the cooking pot?',
        helpText: 'Look for the tiny cup beside the cooking pot.',
        recastText:
          'A tiny teacup! Imagine trying to make soup in a teacup—it’d be SO tiny! Ha!',
        targetAdjectives: ['tiny', 'small'],
        expectedNouns: ['cup', 'teacup'],
        nounAliases: ['tea cup', 'tea'],
        focusTargetIds: ['activity-1:teacup'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['cup', 'teacup'],
          tier2: ['a tiny teacup'],
          tier3: ['a tiny little teacup', 'it’s so small'],
        },
      },
      {
        id: 'activity-1:wrap-up',
        sequence: 6,
        kind: 'open',
        promptText:
          'You noticed so many sizes! What was the biggest thing you saw on that bench?',
        repromptText: 'What was the biggest thing in the kitchen?',
        helpText: 'Think about the object that filled most of the left side.',
        recastText: 'Yes! This kitchen has BIG things and tiny things everywhere!',
        targetAdjectives: ['big', 'huge'],
        expectedNouns: ['watermelon'],
        nounAliases: ['melon', 'the big one', 'the huge one'],
        focusTargetIds: ['activity-1:watermelon'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['watermelon', 'any spoken response'],
          tier2: ['the big watermelon'],
          tier3: ['the huge green watermelon', 'the huge one'],
        },
      },
    ],
  },
  {
    id: 'activity-2',
    order: 2,
    title: 'At the Park',
    sceneAssetKey: 'park',
    runtimeSeconds: 90,
    targetAdjectives: ['huge', 'small'],
    teachingTechnique:
      'Natural outdoor contrast pair introducing huge as a stronger synonym for big',
    introText: 'Oh, we’re at the park today! I love the park. What can you see here?',
    prompts: [
      {
        id: 'activity-2:open-park',
        sequence: 1,
        kind: 'open',
        promptText: 'What can you see here?',
        repromptText: 'Tell me one thing you notice in the park.',
        helpText: 'Look around the park and tell me about anything you can see.',
        recastText: 'You spotted something at the park!',
        targetAdjectives: ['huge', 'small'],
        expectedNouns: ['tree', 'flower', 'dog', 'bird'],
        nounAliases: ['gum tree', 'eucalyptus', 'willy wagtail'],
        focusTargetIds: [
          'activity-2:gum-tree',
          'activity-2:flower',
          'activity-2:dog',
          'activity-2:bird',
        ],
        readinessEligible: false,
        acceptedExamples: {
          tier1: ['any spoken response'],
          tier2: ['a big dog'],
          tier3: ['a huge tree and a tiny bird'],
        },
      },
      {
        id: 'activity-2:gum-tree',
        sequence: 2,
        kind: 'open',
        promptText: 'Look at that tree—WOW! What would you say about that tree?',
        repromptText: 'Is that gum tree big, small, or something else?',
        helpText: 'Look at the tree that fills most of the left side.',
        recastText: 'It’s HUGE! A huge gum tree!',
        targetAdjectives: ['huge', 'big', 'gigantic'],
        expectedNouns: ['tree', 'gum tree'],
        nounAliases: ['eucalyptus', 'gumtree'],
        focusTargetIds: ['activity-2:gum-tree'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['tree', 'big'],
          tier2: ['a huge tree'],
          tier3: ['it’s the hugest tree', 'gigantic gum tree'],
        },
      },
      {
        id: 'activity-2:flower',
        sequence: 3,
        kind: 'open',
        promptText: 'Look down near the bottom—do you see that tiny thing?',
        repromptText: 'What is the tiny thing near the bottom of the tree?',
        helpText: 'Look for the tiny yellow flower at the base of the tree.',
        recastText: 'A small little flower! So tiny next to that huge tree!',
        targetAdjectives: ['small', 'tiny'],
        expectedNouns: ['flower'],
        nounAliases: ['yellow flower'],
        focusTargetIds: ['activity-2:flower'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['flower'],
          tier2: ['a tiny flower'],
          tier3: ['a tiny little yellow flower'],
        },
      },
      {
        id: 'activity-2:dog',
        sequence: 4,
        kind: 'open',
        promptText: 'And over here—what’s that big fluffy animal?',
        repromptText: 'What is the big golden animal in the park?',
        helpText: 'Look at the large fluffy animal standing on the right.',
        recastText: 'A huge dog!',
        targetAdjectives: ['big', 'huge'],
        expectedNouns: ['dog'],
        nounAliases: ['puppy', 'labrador'],
        focusTargetIds: ['activity-2:dog'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['dog'],
          tier2: ['a big dog', 'a huge dog'],
          tier3: ['a huge fluffy dog'],
        },
      },
      {
        id: 'activity-2:bird',
        sequence: 5,
        kind: 'open',
        promptText: 'And look who’s next to it—what’s that little thing on the ground?',
        repromptText: 'What is the tiny animal on the ground near the dog?',
        helpText: 'Look for the little bird on the ground beside the dog.',
        recastText: 'A tiny little bird!',
        targetAdjectives: ['small', 'tiny'],
        expectedNouns: ['bird'],
        nounAliases: ['sparrow', 'willy wagtail'],
        focusTargetIds: ['activity-2:bird'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['bird'],
          tier2: ['a small bird', 'a tiny bird'],
          tier3: ['a tiny little bird'],
        },
      },
      {
        id: 'activity-2:friends',
        sequence: 6,
        kind: 'open',
        promptText: 'Do you think the dog and the bird are friends?',
        repromptText: 'Tell me what you think about the dog and the bird.',
        helpText: 'Look at the huge dog and the tiny bird together.',
        recastText: 'Ha! Maybe! The huge dog and the tiny bird—what a funny pair!',
        targetAdjectives: ['huge', 'tiny'],
        expectedNouns: ['dog', 'bird'],
        nounAliases: ['friends', 'yes', 'no'],
        focusTargetIds: ['activity-2:dog', 'activity-2:bird'],
        readinessEligible: false,
        acceptedExamples: {
          tier1: ['any spoken response'],
          tier2: ['the big dog'],
          tier3: ['the huge dog and the tiny bird'],
        },
      },
    ],
  },
  {
    id: 'activity-3',
    order: 3,
    title: 'The Toy Box',
    sceneAssetKey: 'toy-box',
    runtimeSeconds: 90,
    targetAdjectives: ['gigantic', 'tiny'],
    teachingTechnique:
      'Introduce the advanced word gigantic through a playful maximal contrast',
    introText:
      'Whoa! Look at this bedroom! Something in here is VERY unusual. What do you notice?',
    rewardCheckpointId: 'coin-after-activity-3',
    prompts: [
      {
        id: 'activity-3:unusual-bear',
        sequence: 1,
        kind: 'open',
        promptText: 'Something in here is VERY unusual. What do you notice?',
        repromptText: 'What looks unusual in this bedroom?',
        helpText: 'Look at the teddy bear that almost touches the ceiling.',
        recastText: 'It’s GIGANTIC! A gigantic teddy bear!',
        targetAdjectives: ['gigantic', 'huge', 'big'],
        expectedNouns: ['bear', 'teddy bear'],
        nounAliases: ['teddy'],
        focusTargetIds: ['activity-3:teddy-bear'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['a bear'],
          tier2: ['a big bear'],
          tier3: ['a gigantic bear', 'it’s enormous'],
        },
      },
      {
        id: 'activity-3:gigantic-word',
        sequence: 2,
        kind: 'open',
        promptText: 'What would you call something that enormous?',
        repromptText: 'Can you think of a size word for something enormous?',
        helpText: 'Look at the bear. It is much bigger than everything else.',
        recastText: 'GIGANTIC is the perfect word!',
        targetAdjectives: ['gigantic', 'huge', 'big'],
        expectedNouns: ['bear', 'teddy bear'],
        nounAliases: ['teddy'],
        focusTargetIds: ['activity-3:teddy-bear'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['bear'],
          tier2: ['big', 'huge'],
          tier3: ['gigantic', 'enormous'],
        },
      },
      {
        id: 'activity-3:toy-car',
        sequence: 3,
        kind: 'open',
        promptText: 'And look on the floor—what’s that tiny thing down there?',
        repromptText: 'What is the tiny red thing on the floor?',
        helpText: 'Look for the tiny red toy on the rug.',
        recastText: 'A tiny toy car! So tiny!',
        targetAdjectives: ['tiny', 'small'],
        expectedNouns: ['car', 'toy car'],
        nounAliases: ['red car', 'toy'],
        focusTargetIds: ['activity-3:toy-car'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['car'],
          tier2: ['a tiny car', 'a small toy car'],
          tier3: ['a tiny little toy car'],
        },
      },
      {
        id: 'activity-3:imagine',
        sequence: 4,
        kind: 'open',
        promptText: 'Can you imagine a gigantic bear driving a tiny car?',
        repromptText: 'Tell me what might happen if the bear drove that car.',
        helpText: 'Look at the gigantic bear and the tiny car together.',
        recastText: 'Ha! The gigantic bear and the tiny car! What a funny picture!',
        targetAdjectives: ['gigantic', 'tiny'],
        expectedNouns: ['bear', 'car'],
        nounAliases: ['teddy', 'toy car'],
        focusTargetIds: ['activity-3:teddy-bear', 'activity-3:toy-car'],
        readinessEligible: false,
        acceptedExamples: {
          tier1: ['any spoken response'],
          tier2: ['the big bear'],
          tier3: ['the gigantic bear is too big for the tiny car'],
        },
      },
    ],
  },
  {
    id: 'activity-4',
    order: 4,
    title: 'The Farmer’s Market',
    sceneAssetKey: 'farmers-market',
    runtimeSeconds: 90,
    targetAdjectives: ['medium', 'big', 'small'],
    teachingTechnique:
      'Three-way comparison introducing medium between big and small',
    introText:
      'Ooh, it’s market day! Look at all these yummy things. What can you see on this stall?',
    prompts: [
      {
        id: 'activity-4:open-market',
        sequence: 1,
        kind: 'open',
        promptText: 'What can you see on this stall?',
        repromptText: 'Tell me one thing you notice on the market stall.',
        helpText: 'Look across the stall and tell me about anything you can see.',
        recastText: 'You spotted something at the market!',
        targetAdjectives: ['big', 'medium', 'small'],
        expectedNouns: ['pumpkin', 'bananas', 'grapes'],
        nounAliases: ['pumpkins', 'banana', 'grape', 'fruit'],
        focusTargetIds: [
          'activity-4:big-pumpkin',
          'activity-4:medium-pumpkin',
          'activity-4:small-pumpkin',
          'activity-4:bananas',
          'activity-4:grapes',
        ],
        readinessEligible: false,
        acceptedExamples: {
          tier1: ['any spoken response'],
          tier2: ['a big pumpkin'],
          tier3: ['big bananas and small grapes'],
        },
      },
      {
        id: 'activity-4:pumpkin-sizes',
        sequence: 2,
        kind: 'open',
        promptText:
          'Look at these three pumpkins! Can you tell me about them? What’s different about them?',
        repromptText: 'How are the three pumpkins different in size?',
        helpText: 'Look from the biggest pumpkin to the smallest pumpkin.',
        recastText:
          'That’s right! This one is BIG, this one is SMALL, and one is in the middle!',
        targetAdjectives: ['big', 'medium', 'small'],
        expectedNouns: ['pumpkin', 'pumpkins'],
        nounAliases: ['different sizes', 'middle'],
        focusTargetIds: [
          'activity-4:big-pumpkin',
          'activity-4:medium-pumpkin',
          'activity-4:small-pumpkin',
        ],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['different sizes', 'one is big'],
          tier2: ['one is big, one is small, one is medium'],
          tier3: ['this is the biggest and this is the smallest'],
        },
      },
      {
        id: 'activity-4:medium-pumpkin',
        sequence: 3,
        kind: 'open',
        promptText:
          'The pumpkin in the middle is not big and not small. What do we call that?',
        repromptText: 'What size word means not too big and not too small?',
        helpText: 'Look at the pumpkin between the big and small pumpkins.',
        recastText: 'MEDIUM! Not too big, not too small—just medium!',
        targetAdjectives: ['medium'],
        expectedNouns: ['pumpkin'],
        nounAliases: ['middle', 'not big', 'not small'],
        focusTargetIds: ['activity-4:medium-pumpkin'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['middle', 'not big'],
          tier2: ['medium'],
          tier3: ['medium-sized'],
        },
      },
      {
        id: 'activity-4:fruit-size',
        sequence: 4,
        kind: 'open',
        promptText: 'Now over here—which is bigger, the bananas or the grapes?',
        repromptText: 'Compare the bananas and the grapes. Which takes up more space?',
        helpText: 'Look at the bunch of bananas and the small bunch of grapes.',
        recastText: 'The big bananas and the small grapes! You know all your sizes!',
        targetAdjectives: ['big', 'small'],
        expectedNouns: ['bananas', 'grapes'],
        nounAliases: ['banana', 'grape', 'fruit'],
        focusTargetIds: ['activity-4:bananas', 'activity-4:grapes'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['bananas'],
          tier2: ['the bananas are bigger'],
          tier3: ['the bananas are big and the grapes are small'],
        },
      },
    ],
  },
  {
    id: 'activity-5',
    order: 5,
    title: 'The Beach Day',
    sceneAssetKey: 'beach-day',
    runtimeSeconds: 90,
    targetAdjectives: ['big', 'small', 'tiny', 'huge', 'gigantic', 'medium'],
    teachingTechnique:
      'Open elicitation for spontaneous recall and generalisation across all six words',
    introText:
      'We made it to the beach! This is my favourite place. What can you see? Tell me everything!',
    rewardCheckpointId: 'coin-after-activity-5',
    prompts: [
      {
        id: 'activity-5:open-beach',
        sequence: 1,
        kind: 'open',
        promptText: 'What can you see? Tell me everything!',
        repromptText: 'Tell me one thing you notice at the beach.',
        helpText: 'Look around the beach and tell me about anything you can see.',
        recastText: 'You spotted something at the beach!',
        targetAdjectives: ['big', 'small', 'tiny', 'huge', 'gigantic', 'medium'],
        expectedNouns: ['wave', 'sandcastle', 'shell', 'umbrella', 'crab', 'rock'],
        nounAliases: ['castle', 'boulder', 'beach umbrella'],
        focusTargetIds: [
          'activity-5:wave',
          'activity-5:sandcastle',
          'activity-5:shell',
          'activity-5:umbrella',
          'activity-5:crab',
          'activity-5:rock',
        ],
        readinessEligible: false,
        acceptedExamples: {
          tier1: ['any spoken response'],
          tier2: ['a big umbrella'],
          tier3: ['a huge wave and a tiny shell'],
        },
      },
      {
        id: 'activity-5:wave',
        sequence: 2,
        kind: 'open',
        promptText: 'What size is that wave in the background?',
        repromptText: 'Is the wave tiny, medium, or huge?',
        helpText: 'Look at the enormous blue wave in the background.',
        recastText: 'A HUGE wave!',
        targetAdjectives: ['huge', 'big', 'gigantic'],
        expectedNouns: ['wave'],
        nounAliases: ['water', 'ocean wave'],
        focusTargetIds: ['activity-5:wave'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['big'],
          tier2: ['huge wave', 'gigantic'],
          tier3: ['it’s a gigantic huge wave'],
        },
      },
      {
        id: 'activity-5:swim',
        sequence: 3,
        kind: 'open',
        promptText: 'Would you swim in a huge wave?',
        repromptText: 'Tell me what you would do near that huge wave.',
        helpText: 'Look at the huge wave and tell me what you think.',
        recastText: 'Thanks for telling me what you would do near that huge wave!',
        targetAdjectives: ['huge'],
        expectedNouns: ['wave'],
        nounAliases: ['yes', 'no', 'swim'],
        focusTargetIds: ['activity-5:wave'],
        readinessEligible: false,
        acceptedExamples: {
          tier1: ['any spoken response'],
          tier2: ['the huge wave'],
          tier3: ['the wave is too huge to swim in'],
        },
      },
      {
        id: 'activity-5:sandcastle',
        sequence: 4,
        kind: 'open',
        promptText: 'And look at that sandcastle—what would you say about it?',
        repromptText: 'What size word would you use for the sandcastle?',
        helpText: 'Look at the sandcastle near the bottom of the beach.',
        recastText: 'A medium-sized sandcastle!',
        targetAdjectives: ['big', 'medium', 'small'],
        expectedNouns: ['sandcastle'],
        nounAliases: ['sand castle', 'castle'],
        focusTargetIds: ['activity-5:sandcastle'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['castle'],
          tier2: ['big sandcastle', 'medium sandcastle'],
          tier3: ['a medium-sized sandcastle'],
        },
      },
      {
        id: 'activity-5:tiniest',
        sequence: 5,
        kind: 'open',
        promptText: 'And can you spot the tiniest thing on the whole beach?',
        repromptText: 'Look carefully for a very tiny shell or a small crab.',
        helpText: 'Look near the bottom for the tiny shell or across the sand for the small crab.',
        recastText: 'Yes! A tiny little shell or a small crab! You found it!',
        targetAdjectives: ['tiny', 'small'],
        expectedNouns: ['shell', 'crab'],
        nounAliases: ['seashell', 'little crab'],
        focusTargetIds: ['activity-5:shell', 'activity-5:crab'],
        readinessEligible: true,
        acceptedExamples: {
          tier1: ['shell', 'crab'],
          tier2: ['a tiny shell', 'small crab'],
          tier3: ['the teeny tiny shell'],
        },
      },
    ],
  },
] as const satisfies readonly ActivityDefinition[];

export const sizeWordsUnit: LearningUnitDefinition = {
  id: 'size-words-unit',
  contentVersion: '2026-07-17.1',
  title: 'Big, Small and Everything in Between!',
  type: 'expressive_language',
  targetAge: { minimum: 6, maximum: 8 },
  expectedRuntimeMinutes: { minimum: 5, maximum: 10 },
  primaryWords: ['big', 'small', 'tiny', 'huge', 'gigantic', 'medium'],
  activities,
};

export function getSizeWordsActivity(activityId: ActivityId) {
  return sizeWordsUnit.activities.find(
    (activity) => activity.id === activityId,
  ) as ActivityDefinition | undefined;
}

export function getSizeWordsPrompt(
  promptId: PromptId,
): ActivityPromptDefinition | undefined {
  for (const activity of sizeWordsUnit.activities) {
    const prompt = (activity.prompts as readonly ActivityPromptDefinition[]).find(
      (candidate) => candidate.id === promptId,
    );
    if (prompt) return prompt;
  }
  return undefined;
}

/** Returns content-contract errors without importing any screen implementation. */
export function getSizeWordsUnitIssues(
  unit: LearningUnitDefinition = sizeWordsUnit,
): readonly string[] {
  const issues: string[] = [];
  const activityIds = new Set<string>();
  const promptIds = new Set<string>();

  for (const activity of unit.activities) {
    if (activityIds.has(activity.id)) issues.push(`Duplicate activity id: ${activity.id}`);
    activityIds.add(activity.id);

    activity.prompts.forEach((prompt, index) => {
      if (!prompt.id.startsWith(`${activity.id}:`)) {
        issues.push(`${prompt.id} does not include owning activity ${activity.id}`);
      }
      if (promptIds.has(prompt.id)) issues.push(`Duplicate prompt id: ${prompt.id}`);
      promptIds.add(prompt.id);
      if (prompt.sequence !== index + 1) {
        issues.push(`${prompt.id} has non-contiguous sequence ${prompt.sequence}`);
      }
      if (prompt.focusTargetIds.some((id) => !id.startsWith(`${activity.id}:`))) {
        issues.push(`${prompt.id} references a focus target from another activity`);
      }
    });
  }

  if (unit.activities.length !== 5) issues.push('Size Words unit must contain five activities');
  if (unit.activities.map(({ order }) => order).join(',') !== '1,2,3,4,5') {
    issues.push('Activity order must be 1,2,3,4,5');
  }

  return issues;
}

const registryIssues = getSizeWordsUnitIssues();
if (registryIssues.length > 0) {
  throw new Error(`Invalid Size Words content registry: ${registryIssues.join('; ')}`);
}
