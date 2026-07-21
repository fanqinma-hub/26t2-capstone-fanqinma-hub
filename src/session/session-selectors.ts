import type {
  ResponseTier,
  SizeWordKeyword,
  TargetAdjective,
} from '@/types/activity.types';
import type {
  ActivityMetricsRow,
  SelectSessionMetrics,
  WordEvidence,
} from '@/types/metrics.types';
import type {
  DeliveryEvent,
  SessionState,
  SpeechAttempt,
} from '@/types/session.types';

const tierOrder: readonly ResponseTier[] = [
  'noun_only',
  'adjective_used',
  'rich_description',
];

const keywordOrder: readonly SizeWordKeyword[] = [
  'big',
  'small',
  'tiny',
  'huge',
  'gigantic',
  'medium',
  'little',
  'large',
  'giant',
  'enormous',
  'teeny',
];

function isValidUtterance(session: SessionState, attempt: SpeechAttempt) {
  const requiredStatus = session.mode === 'live' ? 'captured' : 'mocked';
  const requiredSource = session.mode === 'live' ? 'azure' : 'mock';
  return (
    attempt.status === requiredStatus &&
    attempt.source === requiredSource &&
    attempt.transcript.trim().length > 0 &&
    attempt.tier !== null
  );
}

function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? null : numerator / denominator;
}

function unique(values: readonly string[]) {
  return [...new Set(values)];
}

function successfulModelForWord(delivery: DeliveryEvent, word: TargetAdjective) {
  return (
    delivery.status === 'delivered' &&
    (delivery.kind === 'model' || delivery.kind === 'recast') &&
    delivery.primaryWords.includes(word)
  );
}

function buildWordEvidence(
  session: SessionState,
  validAttempts: readonly SpeechAttempt[],
  word: TargetAdjective,
): WordEvidence {
  const spontaneousUses = validAttempts.filter(
    (attempt) =>
      attempt.isSpontaneous && attempt.detectedPrimaryWords.includes(word),
  );
  const successfulModels = session.deliveries.filter((delivery) =>
    successfulModelForWord(delivery, word),
  );
  const recasts = successfulModels.filter((delivery) => delivery.kind === 'recast');
  const status =
    spontaneousUses.length > 0
      ? 'USED'
      : successfulModels.length > 0
        ? 'HEARD'
        : 'NOT_YET';
  const examples =
    spontaneousUses.length > 0
      ? unique(spontaneousUses.map(({ transcript }) => transcript))
      : unique(successfulModels.map(({ text }) => text));

  return {
    word,
    status,
    examples,
    timesUsed: spontaneousUses.length,
    timesHeard: recasts.length,
  };
}

function terminalAttemptsByPrompt(session: SessionState) {
  const attemptById = new Map(session.attempts.map((attempt) => [attempt.id, attempt]));
  return new Map(
    session.promptRecords.map((prompt) => [
      prompt.promptId,
      prompt.terminalAttemptId
        ? attemptById.get(prompt.terminalAttemptId) ?? null
        : null,
    ]),
  );
}

export const selectSessionMetrics: SelectSessionMetrics = (
  session,
  unit,
) => {
  const validAttempts = session.attempts.filter((attempt) =>
    isValidUtterance(session, attempt),
  );
  const validAttemptIds = new Set(validAttempts.map(({ id }) => id));
  const terminalByPrompt = terminalAttemptsByPrompt(session);
  const tierCounts: Record<ResponseTier, number> = {
    noun_only: 0,
    adjective_used: 0,
    rich_description: 0,
  };
  validAttempts.forEach((attempt) => {
    if (attempt.tier) tierCounts[attempt.tier] += 1;
  });

  const eligiblePromptIds = new Set(
    unit.activities.flatMap((activity) =>
      activity.prompts
        .filter(({ readinessEligible }) => readinessEligible)
        .map(({ id }) => id),
    ),
  );
  const readinessTerminalAttempts = session.promptRecords
    .filter((prompt) => eligiblePromptIds.has(prompt.promptId))
    .map((prompt) => terminalByPrompt.get(prompt.promptId) ?? null)
    .filter(
      (attempt): attempt is SpeechAttempt =>
        Boolean(attempt && validAttemptIds.has(attempt.id)),
    );
  const readyPromptCount = readinessTerminalAttempts.filter(
    ({ tier }) => tier === 'adjective_used' || tier === 'rich_description',
  ).length;

  const activityRows: readonly ActivityMetricsRow[] = unit.activities.map(
    (activity) => {
      const prompts = session.promptRecords.filter(
        (prompt) => prompt.activityId === activity.id,
      );
      const terminalAttempts = prompts
        .map((prompt) => terminalByPrompt.get(prompt.promptId) ?? null)
        .filter(
          (attempt): attempt is SpeechAttempt =>
            Boolean(attempt && validAttemptIds.has(attempt.id)),
        );
      return {
        activityId: activity.id,
        scene: activity.sceneAssetKey,
        promptsGiven: prompts.length,
        tier1: terminalAttempts.filter(({ tier }) => tier === 'noun_only').length,
        tier2: terminalAttempts.filter(({ tier }) => tier === 'adjective_used').length,
        tier3: terminalAttempts.filter(({ tier }) => tier === 'rich_description').length,
        scaffoldsUsed: prompts.reduce(
          (sum, prompt) => sum + prompt.scaffoldTapCount,
          0,
        ),
      };
    },
  );

  const activity5Attempts = validAttempts.filter(
    ({ activityId }) => activityId === 'activity-5',
  );
  const activity5AdjectiveAttempts = activity5Attempts.filter(
    ({ tier }) => tier === 'adjective_used' || tier === 'rich_description',
  );
  const activity5PrimaryWords = new Set(
    activity5Attempts.flatMap(({ detectedPrimaryWords }) => detectedPrimaryWords),
  );
  const adjectiveUtterances =
    tierCounts.adjective_used + tierCounts.rich_description;
  const detectedKeywords = new Set(
    validAttempts.flatMap(({ detectedKeywords: words }) => words),
  );

  return {
    durationMs: session.activityRecords
      .filter(({ completedAt }) => completedAt !== null)
      .reduce((sum, activity) => sum + activity.durationMs, 0),
    totalUtterances: validAttempts.length,
    sizeWordUtterances: validAttempts.filter(
      ({ detectedKeywords: words }) => words.length > 0,
    ).length,
    adjectiveUseRate: ratio(adjectiveUtterances, validAttempts.length),
    tierCounts,
    scaffoldTaps: session.promptRecords.reduce(
      (sum, prompt) => sum + prompt.scaffoldTapCount,
      0,
    ),
    replayTaps: session.promptRecords.reduce(
      (sum, prompt) => sum + prompt.replayTapCount,
      0,
    ),
    uniqueKeywords: keywordOrder.filter((word) => detectedKeywords.has(word)),
    wordEvidence: unit.primaryWords.map((word) =>
      buildWordEvidence(session, validAttempts, word),
    ),
    readinessRate: ratio(readyPromptCount, readinessTerminalAttempts.length),
    activity5: {
      adjectiveUseRate: ratio(
        activity5AdjectiveAttempts.length,
        activity5Attempts.length,
      ),
      usedAllSix: unit.primaryWords.every((word) => activity5PrimaryWords.has(word)),
    },
    activityRows,
  };
};

export function selectValidSpeechAttempts(session: SessionState) {
  return session.attempts.filter((attempt) => isValidUtterance(session, attempt));
}

export const responseTierOrder = tierOrder;
