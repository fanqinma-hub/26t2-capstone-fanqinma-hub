export const reportDemoFixture = {
  childName: 'Sam',
  reportLabel: 'Session report',
  sessionLabel: 'Size Words — Activity 1 of 5',
  sampleDataLabel: 'Activity 1 sample data',
  parentSummary: 'Sam explored a kitchen picture and practised describing things with size words.',
  encouragement: 'Kool noticed a great try with the word “big”.',
  sizeWordExamples: [
    { word: 'big', example: '“The watermelon is big.”' },
    { word: 'small', example: '“The cup is small.”' },
  ],
  tierSummary: [
    { tier: 'Tier 1', label: 'Independent try', count: 1 },
    { tier: 'Tier 2', label: 'With a gentle cue', count: 1 },
    { tier: 'Tier 3', label: 'With picture help', count: 1 },
  ],
  helpCount: 1,
  therapistNote: 'Sam engaged warmly with Kool and responded well after the picture clue.',
  disclaimer: 'Prototype/non-clinical sample data only. This screen is not a clinical diagnosis, an NDIS submission, or a generated final unit report.',
} as const;
