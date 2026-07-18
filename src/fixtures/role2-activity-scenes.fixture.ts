import type { Role2DevSceneKey } from '@/components/activity/dev/role2-scene-manifest';

export type Role2DevVisualState =
  | 'prompt'
  | 'listening'
  | 'gentleCue'
  | 'reprompt'
  | 'clue'
  | 'processing'
  | 'feedback'
  | 'retry'
  | 'complete';

export type Role2DevDialogueStep = Readonly<{
  state: Role2DevVisualState;
  koolMessage: string;
  statusLine: string;
  activeFocusTargetIds: readonly string[];
  questionCurrent?: number;
}>;

export type Role2DevActivityFixture = Readonly<{
  activity: 2 | 3 | 4 | 5;
  title: string;
  sceneKey: Role2DevSceneKey;
  questionTotal: number;
  scriptSource: 'Team ALMOND TASKS.xlsx / Learning unit details';
  scriptLinesVerbatim: readonly string[];
  steps: readonly Role2DevDialogueStep[];
}>;

export const role2DevActivityFixtures = [
  {
    activity: 2,
    title: 'At the Park',
    sceneKey: 'park',
    questionTotal: 6,
    scriptSource: 'Team ALMOND TASKS.xlsx / Learning unit details',
    scriptLinesVerbatim: [
      'Kool: Oh, we’re at the park today! I love the park. What can you see here?',
      'Child: (open response — any speech accepted)',
      'Kool: Look at that tree — WOW! What would you say about that tree?',
      'Child: (expected: “a big tree” / “a huge tree” / “it’s so tall”)',
      'Kool: (recast) It’s HUGE! A huge gum tree! And look down near the bottom — do you see that tiny thing?',
      'Child: (expected: “a flower” / “a tiny flower” / “it’s small”)',
      'Kool: (recast) A small little flower! So tiny next to that huge tree! And over here — what’s that big fluffy animal?',
      'Child: (expected: “a dog” / “a big dog” / “a huge dog”)',
      'Kool: (recast) A huge dog! And look who’s next to it — what’s that little thing on the ground?',
      'Child: (expected: “a bird” / “a small bird” / “a tiny bird”)',
      'Kool: (recast) A tiny little bird! Do you think the dog and the bird are friends?',
      'Child: (open response — any answer accepted)',
      'Kool: Ha! Maybe! The huge dog and the tiny bird — what a funny pair!',
    ],
    steps: [
      { state: 'prompt', koolMessage: 'Oh, we’re at the park today! I love the park. What can you see here?', statusLine: 'Ready for your answer', activeFocusTargetIds: [], questionCurrent: 1 },
      { state: 'listening', koolMessage: 'I’m listening.', statusLine: 'Listening…', activeFocusTargetIds: [], questionCurrent: 1 },
      { state: 'gentleCue', koolMessage: 'Look at that tree — WOW!', statusLine: 'A gentle clue', activeFocusTargetIds: ['activity-2:gum-tree'], questionCurrent: 2 },
      { state: 'reprompt', koolMessage: 'What would you say about that tree?', statusLine: 'Have another go', activeFocusTargetIds: ['activity-2:gum-tree'], questionCurrent: 2 },
      { state: 'clue', koolMessage: 'Look down near the bottom — do you see that tiny thing?', statusLine: 'Picture clue', activeFocusTargetIds: ['activity-2:flower'], questionCurrent: 3 },
      { state: 'processing', koolMessage: 'Let me think about what you said…', statusLine: 'Thinking', activeFocusTargetIds: [], questionCurrent: 3 },
      { state: 'feedback', koolMessage: 'A huge dog! What’s that little thing on the ground?', statusLine: 'Warm feedback', activeFocusTargetIds: ['activity-2:dog'], questionCurrent: 4 },
      { state: 'retry', koolMessage: 'Take your time — do you see the tiny little bird?', statusLine: 'You can try again', activeFocusTargetIds: ['activity-2:bird'], questionCurrent: 5 },
      { state: 'complete', koolMessage: 'Ha! Maybe! The huge dog and the tiny bird — what a funny pair!', statusLine: 'Activity complete', activeFocusTargetIds: [], questionCurrent: 6 },
    ],
  },
  {
    activity: 3,
    title: 'The Toy Box',
    sceneKey: 'toy-box',
    questionTotal: 4,
    scriptSource: 'Team ALMOND TASKS.xlsx / Learning unit details',
    scriptLinesVerbatim: [
      'Kool: Whoa! Look at this bedroom! Something in here is VERY unusual. What do you notice?',
      'Child: (open response — expected: comment on the huge bear)',
      'Kool: (recast) It’s GIGANTIC! A gigantic teddy bear! It’s so big it almost touches the ceiling! What would you call something that enormous?',
      'Child: (expected: “gigantic” / “huge” / “big” / “massive”)',
      'Kool: GIGANTIC is the perfect word! And look on the floor — what’s that tiny thing down there?',
      'Child: (expected: “a car” / “a tiny car” / “a small toy car”)',
      'Kool: (recast) A tiny toy car! So tiny! Can you imagine a gigantic bear driving a tiny car?',
      'Child: (open imaginative response — any speech accepted)',
      'Kool: Ha! The gigantic bear and the tiny car! Here’s your coin! 🪙',
    ],
    steps: [
      { state: 'prompt', koolMessage: 'Whoa! Look at this bedroom! Something in here is VERY unusual. What do you notice?', statusLine: 'Ready for your answer', activeFocusTargetIds: ['activity-3:teddy-bear'] },
      { state: 'listening', koolMessage: 'I’m listening.', statusLine: 'Listening…', activeFocusTargetIds: ['activity-3:teddy-bear'] },
      { state: 'gentleCue', koolMessage: 'It’s so big it almost touches the ceiling!', statusLine: 'A gentle clue', activeFocusTargetIds: ['activity-3:teddy-bear'] },
      { state: 'reprompt', koolMessage: 'What would you call something that enormous?', statusLine: 'Have another go', activeFocusTargetIds: ['activity-3:teddy-bear'] },
      { state: 'clue', koolMessage: 'And look on the floor — what’s that tiny thing down there?', statusLine: 'Picture clue', activeFocusTargetIds: ['activity-3:toy-car'] },
      { state: 'processing', koolMessage: 'Let me think about what you said…', statusLine: 'Thinking', activeFocusTargetIds: [] },
      { state: 'feedback', koolMessage: 'A tiny toy car! So tiny!', statusLine: 'Warm feedback', activeFocusTargetIds: ['activity-3:toy-car'] },
      { state: 'retry', koolMessage: 'Take your time — tell me what you notice.', statusLine: 'You can try again', activeFocusTargetIds: ['activity-3:teddy-bear', 'activity-3:toy-car'] },
      { state: 'complete', koolMessage: 'Ha! The gigantic bear and the tiny car! Here’s your coin! 🪙', statusLine: 'Activity complete', activeFocusTargetIds: [] },
    ],
  },
  {
    activity: 4,
    title: 'The Farmer’s Market',
    sceneKey: 'farmers-market',
    questionTotal: 4,
    scriptSource: 'Team ALMOND TASKS.xlsx / Learning unit details',
    scriptLinesVerbatim: [
      'Kool: Ooh, it’s market day! Look at all these yummy things. What can you see on this stall?',
      'Child: (open response)',
      'Kool: Look at these three pumpkins! Can you tell me about them? What’s different about them?',
      'Child: (expected: comments on size — big/small/medium or any description)',
      'Kool: (recast) That’s right! This one is BIG, this one is SMALL, and this one in the middle is… what do we call that?',
      'Child: (expected: “medium” / “middle” / “not big and not small”)',
      'Kool: (recast) MEDIUM! Not too big, not too small — just medium! Now over here — which is bigger, the bananas or the grapes?',
      'Child: (expected: “the bananas” / “the bananas are bigger”)',
      'Kool: The big bananas and the small grapes! You know all your sizes!',
    ],
    steps: [
      { state: 'prompt', koolMessage: 'Ooh, it’s market day! Look at all these yummy things. What can you see on this stall?', statusLine: 'Ready for your answer', activeFocusTargetIds: [] },
      { state: 'listening', koolMessage: 'I’m listening.', statusLine: 'Listening…', activeFocusTargetIds: [] },
      { state: 'gentleCue', koolMessage: 'Look at these three pumpkins!', statusLine: 'A gentle clue', activeFocusTargetIds: ['activity-4:big-pumpkin', 'activity-4:medium-pumpkin', 'activity-4:small-pumpkin'] },
      { state: 'reprompt', koolMessage: 'Can you tell me about them? What’s different about them?', statusLine: 'Have another go', activeFocusTargetIds: ['activity-4:big-pumpkin', 'activity-4:medium-pumpkin', 'activity-4:small-pumpkin'] },
      { state: 'clue', koolMessage: 'Now over here — which is bigger, the bananas or the grapes?', statusLine: 'Picture clue', activeFocusTargetIds: ['activity-4:bananas', 'activity-4:grapes'] },
      { state: 'processing', koolMessage: 'Let me think about what you said…', statusLine: 'Thinking', activeFocusTargetIds: [] },
      { state: 'feedback', koolMessage: 'MEDIUM! Not too big, not too small — just medium!', statusLine: 'Warm feedback', activeFocusTargetIds: ['activity-4:medium-pumpkin'] },
      { state: 'retry', koolMessage: 'Take your time — tell me what is different.', statusLine: 'You can try again', activeFocusTargetIds: ['activity-4:big-pumpkin', 'activity-4:medium-pumpkin', 'activity-4:small-pumpkin'] },
      { state: 'complete', koolMessage: 'The big bananas and the small grapes! You know all your sizes!', statusLine: 'Activity complete', activeFocusTargetIds: [] },
    ],
  },
  {
    activity: 5,
    title: 'The Beach Day',
    sceneKey: 'beach-day',
    questionTotal: 5,
    scriptSource: 'Team ALMOND TASKS.xlsx / Learning unit details',
    scriptLinesVerbatim: [
      'Kool: We made it to the beach! This is my favourite place. What can you see? Tell me everything!',
      'Child: (open response — all speech accepted)',
      'Kool: What size is that wave in the background?',
      'Child: (expected: “huge” / “big” / “gigantic”)',
      'Kool: (recast) A HUGE wave! Would you swim in a huge wave?',
      'Child: (open response)',
      'Kool: And look at that sandcastle — what would you say about it?',
      'Child: (expected: “big” / “medium” / “small” — all accepted)',
      'Kool: And can you spot the tiniest thing on the whole beach?',
      'Child: (expected: “the shell” / “a tiny shell” / “the crab”)',
      'Kool: (recast) Yes! A tiny little shell / small crab! You found it! 🪙🪙',
      'Kool: You used SO many size words today — big, tiny, huge, gigantic, medium, small! You are a SIZE WORD SUPERSTAR! 🪙🪙🪙',
    ],
    steps: [
      { state: 'prompt', koolMessage: 'We made it to the beach! This is my favourite place. What can you see? Tell me everything!', statusLine: 'Ready for your answer', activeFocusTargetIds: [] },
      { state: 'listening', koolMessage: 'I’m listening.', statusLine: 'Listening…', activeFocusTargetIds: [] },
      { state: 'gentleCue', koolMessage: 'What size is that wave in the background?', statusLine: 'A gentle clue', activeFocusTargetIds: ['activity-5:wave'] },
      { state: 'reprompt', koolMessage: 'And look at that sandcastle — what would you say about it?', statusLine: 'Have another go', activeFocusTargetIds: ['activity-5:sandcastle'] },
      { state: 'clue', koolMessage: 'Can you spot the tiniest thing on the whole beach?', statusLine: 'Picture clue', activeFocusTargetIds: ['activity-5:shell', 'activity-5:crab'] },
      { state: 'processing', koolMessage: 'Let me think about what you said…', statusLine: 'Thinking', activeFocusTargetIds: [] },
      { state: 'feedback', koolMessage: 'Yes! A tiny little shell / small crab! You found it! 🪙🪙', statusLine: 'Warm feedback', activeFocusTargetIds: ['activity-5:shell', 'activity-5:crab'] },
      { state: 'retry', koolMessage: 'Take your time — tell me what you can see.', statusLine: 'You can try again', activeFocusTargetIds: ['activity-5:shell', 'activity-5:crab'] },
      { state: 'complete', koolMessage: 'You used SO many size words today — big, tiny, huge, gigantic, medium, small! You are a SIZE WORD SUPERSTAR! 🪙🪙🪙', statusLine: 'Unit complete', activeFocusTargetIds: [] },
    ],
  },
] as const satisfies readonly Role2DevActivityFixture[];
