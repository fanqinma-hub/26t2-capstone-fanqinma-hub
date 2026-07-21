import { getSizeWordsPrompt, sizeWordsUnit } from '@/content/size-words';
import type {
  PromptId,
  ResponseTier,
  SizeWordKeyword,
  TargetAdjective,
} from '@/types/activity.types';
import type {
  DeliveryEvent,
  PromptRecord,
  SessionMode,
  SessionState,
  SpeechAttempt,
} from '@/types/session.types';

type ParticipationLevel = 'low' | 'medium' | 'high';

type FixtureAttempt = {
  promptId: PromptId;
  transcript: string;
  tier: ResponseTier;
  keywords: readonly SizeWordKeyword[];
  primaryWords: readonly TargetAdjective[];
  spontaneous?: boolean;
  scaffoldTaps?: number;
  replayTaps?: number;
};

const fixtureAttempts: Record<ParticipationLevel, readonly FixtureAttempt[]> = {
  low: [
    {
      promptId: 'activity-1:watermelon',
      transcript: 'watermelon',
      tier: 'noun_only',
      keywords: [],
      primaryWords: [],
      scaffoldTaps: 1,
    },
    {
      promptId: 'activity-5:tiniest',
      transcript: 'shell',
      tier: 'noun_only',
      keywords: [],
      primaryWords: [],
      scaffoldTaps: 2,
    },
  ],
  medium: [
    {
      promptId: 'activity-1:watermelon',
      transcript: 'a big watermelon',
      tier: 'adjective_used',
      keywords: ['big'],
      primaryWords: ['big'],
    },
    {
      promptId: 'activity-2:gum-tree',
      transcript: 'tree',
      tier: 'noun_only',
      keywords: [],
      primaryWords: [],
      scaffoldTaps: 1,
    },
    {
      promptId: 'activity-3:toy-car',
      transcript: 'a tiny car',
      tier: 'adjective_used',
      keywords: ['tiny'],
      primaryWords: ['tiny'],
      scaffoldTaps: 1,
    },
    {
      promptId: 'activity-4:medium-pumpkin',
      transcript: 'medium',
      tier: 'adjective_used',
      keywords: ['medium'],
      primaryWords: ['medium'],
    },
    {
      promptId: 'activity-5:wave',
      transcript: 'a huge wave',
      tier: 'adjective_used',
      keywords: ['huge'],
      primaryWords: ['huge'],
      replayTaps: 1,
    },
  ],
  high: [
    {
      promptId: 'activity-1:size-contrast',
      transcript: 'the watermelon is huge and the strawberry is tiny',
      tier: 'rich_description',
      keywords: ['huge', 'tiny'],
      primaryWords: ['huge', 'tiny'],
    },
    {
      promptId: 'activity-2:friends',
      transcript: 'the huge dog likes the tiny bird',
      tier: 'rich_description',
      keywords: ['huge', 'tiny'],
      primaryWords: ['huge', 'tiny'],
    },
    {
      promptId: 'activity-3:unusual-bear',
      transcript: 'that teddy bear is gigantic',
      tier: 'adjective_used',
      keywords: ['gigantic'],
      primaryWords: ['gigantic'],
    },
    {
      promptId: 'activity-4:pumpkin-sizes',
      transcript: 'one is big, one is medium, and one is small',
      tier: 'rich_description',
      keywords: ['big', 'medium', 'small'],
      primaryWords: ['big', 'medium', 'small'],
    },
    {
      promptId: 'activity-5:wave',
      transcript: 'the wave is huge beside the gigantic rock',
      tier: 'rich_description',
      keywords: ['huge', 'gigantic'],
      primaryWords: ['huge', 'gigantic'],
    },
    {
      promptId: 'activity-5:sandcastle',
      transcript: 'the medium sandcastle is by the big umbrella',
      tier: 'rich_description',
      keywords: ['medium', 'big'],
      primaryWords: ['medium', 'big'],
    },
    {
      promptId: 'activity-5:tiniest',
      transcript: 'the tiny shell is near the small crab',
      tier: 'rich_description',
      keywords: ['tiny', 'small'],
      primaryWords: ['tiny', 'small'],
    },
  ],
};

function iso(second: number) {
  return new Date(Date.UTC(2026, 6, 17, 9, 0, second)).toISOString();
}

function normalize(transcript: string) {
  return transcript.toLowerCase().replace(/[^a-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildAttempt(
  definition: FixtureAttempt,
  index: number,
  mode: SessionMode,
): SpeechAttempt {
  const prompt = getSizeWordsPrompt(definition.promptId);
  if (!prompt) throw new Error(`Unknown fixture prompt ${definition.promptId}`);
  return {
    id: `fixture-attempt-${index + 1}`,
    activityId: definition.promptId.split(':')[0] as SpeechAttempt['activityId'],
    promptId: definition.promptId,
    promptText: prompt.promptText,
    transcript: definition.transcript,
    normalizedTranscript: normalize(definition.transcript),
    confidence: mode === 'live' ? 0.91 : null,
    status: mode === 'live' ? 'captured' : 'mocked',
    source: mode === 'live' ? 'azure' : 'mock',
    errorCode: null,
    tier: definition.tier,
    detectedKeywords: definition.keywords,
    detectedPrimaryWords: definition.primaryWords,
    isSpontaneous: definition.spontaneous ?? true,
    scaffoldStage: definition.scaffoldTaps ? 2 : 0,
    createdAt: iso(index * 3 + 1),
  };
}

function buildPromptRecord(
  definition: FixtureAttempt,
  attempt: SpeechAttempt,
  index: number,
): PromptRecord {
  return {
    activityId: attempt.activityId,
    promptId: definition.promptId,
    promptText: attempt.promptText,
    openedAt: iso(index * 3),
    closedAt: iso(index * 3 + 2),
    closeReason: 'answered',
    terminalAttemptId: attempt.id,
    scaffoldTapCount: definition.scaffoldTaps ?? 0,
    replayTapCount: definition.replayTaps ?? 0,
  };
}

function buildRecastDeliveries(attempts: readonly SpeechAttempt[]): readonly DeliveryEvent[] {
  return attempts.flatMap((attempt, index) => {
    if (attempt.detectedPrimaryWords.length === 0) return [];
    return [
      {
        id: `fixture-delivery-${index + 1}`,
        operationId: `fixture-operation-${index + 1}`,
        activityId: attempt.activityId,
        promptId: attempt.promptId,
        kind: 'recast',
        text: `Kool modelled: ${attempt.detectedPrimaryWords.join(' and ')}.`,
        words: attempt.detectedKeywords,
        primaryWords: attempt.detectedPrimaryWords,
        status: 'delivered',
        completedAt: iso(index * 3 + 2),
      },
    ];
  });
}

export function createParticipationSessionFixture(
  level: ParticipationLevel,
): SessionState {
  const definitions = fixtureAttempts[level];
  const attempts = definitions.map((definition, index) =>
    buildAttempt(definition, index, 'fixture'),
  );
  const promptRecords = definitions.map((definition, index) =>
    buildPromptRecord(definition, attempts[index], index),
  );

  return {
    schemaVersion: 1,
    mode: 'fixture',
    sessionId: `fixture-${level}-participation`,
    unitId: 'size-words-unit',
    contentVersion: sizeWordsUnit.contentVersion,
    unitAttemptNumber: level === 'low' ? 1 : level === 'medium' ? 2 : 3,
    status: 'completed',
    startedAt: iso(0),
    completedAt: iso(90),
    activeActivityId: null,
    activityRecords: sizeWordsUnit.activities.map((activity, index) => ({
      activityId: activity.id,
      startedAt: iso(index * 10),
      completedAt: iso(index * 10 + 8),
      durationMs: 8_000,
    })),
    promptRecords,
    attempts,
    deliveries: buildRecastDeliveries(attempts),
    rewards: [
      {
        checkpointId: 'coin-after-activity-1',
        activityId: 'activity-1',
        grantedAt: iso(20),
      },
      {
        checkpointId: 'coin-after-activity-3',
        activityId: 'activity-3',
        grantedAt: iso(40),
      },
      {
        checkpointId: 'coin-after-activity-5',
        activityId: 'activity-5',
        grantedAt: iso(60),
      },
    ],
    reportMetadata: {
      childName: 'Sam',
      childAge: 7,
      therapistName: 'Taylor',
      therapistNote: '',
      nextStep: '',
    },
  };
}

export const createLowParticipationSession = () =>
  createParticipationSessionFixture('low');
export const createMediumParticipationSession = () =>
  createParticipationSessionFixture('medium');
export const createHighParticipationSession = () =>
  createParticipationSessionFixture('high');

export function createAzureFailureSession(): SessionState {
  const prompt = getSizeWordsPrompt('activity-1:watermelon');
  if (!prompt) throw new Error('Missing Activity 1 fixture prompt');

  return {
    schemaVersion: 1,
    mode: 'live',
    sessionId: 'fixture-azure-failure',
    unitId: 'size-words-unit',
    contentVersion: sizeWordsUnit.contentVersion,
    unitAttemptNumber: 4,
    status: 'in_progress',
    startedAt: iso(0),
    completedAt: null,
    activeActivityId: 'activity-1',
    activityRecords: [
      {
        activityId: 'activity-1',
        startedAt: iso(0),
        completedAt: null,
        durationMs: 0,
      },
    ],
    promptRecords: [
      {
        activityId: 'activity-1',
        promptId: prompt.id,
        promptText: prompt.promptText,
        openedAt: iso(0),
        closedAt: iso(2),
        closeReason: 'error',
        terminalAttemptId: null,
        scaffoldTapCount: 0,
        replayTapCount: 1,
      },
    ],
    attempts: [
      {
        id: 'azure-service-error-1',
        activityId: 'activity-1',
        promptId: prompt.id,
        promptText: prompt.promptText,
        transcript: '',
        normalizedTranscript: '',
        confidence: null,
        status: 'error',
        source: 'azure',
        errorCode: 'service',
        tier: null,
        detectedKeywords: [],
        detectedPrimaryWords: [],
        isSpontaneous: true,
        scaffoldStage: 0,
        createdAt: iso(1),
      },
    ],
    deliveries: [],
    rewards: [],
    reportMetadata: {
      childName: 'Sam',
      childAge: 7,
      therapistName: 'Taylor',
      therapistNote: '',
      nextStep: '',
    },
  };
}
