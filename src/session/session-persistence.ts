import type {
  ActivityRecord,
  DeliveryEvent,
  PromptRecord,
  ReportMetadata,
  RewardGrant,
  SessionState,
  SessionStoreState,
  SpeechAttempt,
} from '@/types/session.types';

import {
  ATTEMPT_COUNTER_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  type SessionStorage,
} from './session-storage';

const activityIds = new Set([
  'activity-1',
  'activity-2',
  'activity-3',
  'activity-4',
  'activity-5',
]);
const tiers = new Set(['noun_only', 'adjective_used', 'rich_description']);
const statuses = new Set(['captured', 'no_match', 'cancelled', 'error', 'mocked']);
const sourceByMode = { live: 'azure', fixture: 'mock' } as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isTimestamp(value: unknown): value is string {
  return isString(value) && Number.isFinite(Date.parse(value));
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isActivityRecord(value: unknown): value is ActivityRecord {
  return (
    isRecord(value) &&
    activityIds.has(String(value.activityId)) &&
    isTimestamp(value.startedAt) &&
    (value.completedAt === null || isTimestamp(value.completedAt)) &&
    typeof value.durationMs === 'number' &&
    Number.isFinite(value.durationMs) &&
    value.durationMs >= 0
  );
}

function isPromptRecord(value: unknown): value is PromptRecord {
  return (
    isRecord(value) &&
    activityIds.has(String(value.activityId)) &&
    isString(value.promptId) &&
    value.promptId.startsWith(`${value.activityId}:`) &&
    isString(value.promptText) &&
    isTimestamp(value.openedAt) &&
    (value.closedAt === null || isTimestamp(value.closedAt)) &&
    (value.closeReason === null ||
      ['answered', 'skipped', 'timed_out', 'error'].includes(
        String(value.closeReason),
      )) &&
    isNullableString(value.terminalAttemptId) &&
    isNonNegativeInteger(value.scaffoldTapCount) &&
    isNonNegativeInteger(value.replayTapCount)
  );
}

function isSpeechAttempt(value: unknown, mode: SessionState['mode']): value is SpeechAttempt {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !activityIds.has(String(value.activityId)) ||
    !isString(value.promptId) ||
    !value.promptId.startsWith(`${value.activityId}:`) ||
    !isString(value.promptText) ||
    !isString(value.transcript) ||
    !isString(value.normalizedTranscript) ||
    !statuses.has(String(value.status)) ||
    value.source !== sourceByMode[mode] ||
    !Array.isArray(value.detectedKeywords) ||
    !value.detectedKeywords.every(isString) ||
    !Array.isArray(value.detectedPrimaryWords) ||
    !value.detectedPrimaryWords.every(isString) ||
    typeof value.isSpontaneous !== 'boolean' ||
    ![0, 1, 2, 3].includes(Number(value.scaffoldStage)) ||
    !isTimestamp(value.createdAt)
  ) {
    return false;
  }

  if (value.confidence !== null && typeof value.confidence !== 'number') return false;
  if (value.errorCode !== null && !isString(value.errorCode)) return false;
  const successful = value.status === 'captured' || value.status === 'mocked';
  if (successful) {
    if (!value.transcript.trim() || !tiers.has(String(value.tier))) return false;
    if (mode === 'live' && value.status !== 'captured') return false;
    if (mode === 'fixture' && value.status !== 'mocked') return false;
  } else if (value.tier !== null) {
    return false;
  }
  return true;
}

function isDeliveryEvent(value: unknown): value is DeliveryEvent {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.operationId) &&
    activityIds.has(String(value.activityId)) &&
    isString(value.promptId) &&
    value.promptId.startsWith(`${value.activityId}:`) &&
    ['prompt', 'reprompt', 'clue', 'model', 'recast', 'replay'].includes(
      String(value.kind),
    ) &&
    isString(value.text) &&
    Array.isArray(value.words) &&
    value.words.every(isString) &&
    Array.isArray(value.primaryWords) &&
    value.primaryWords.every(isString) &&
    ['delivered', 'failed', 'cancelled'].includes(String(value.status)) &&
    isTimestamp(value.completedAt)
  );
}

function isRewardGrant(value: unknown): value is RewardGrant {
  if (!isRecord(value) || !isTimestamp(value.grantedAt)) return false;
  return (
    (value.activityId === 'activity-1' &&
      value.checkpointId === 'coin-after-activity-1') ||
    (value.activityId === 'activity-3' &&
      value.checkpointId === 'coin-after-activity-3') ||
    (value.activityId === 'activity-5' &&
      value.checkpointId === 'coin-after-activity-5')
  );
}

function isReportMetadata(value: unknown): value is ReportMetadata {
  return (
    isRecord(value) &&
    isString(value.childName) &&
    typeof value.childAge === 'number' &&
    Number.isFinite(value.childAge) &&
    isString(value.therapistName) &&
    isString(value.therapistNote) &&
    isString(value.nextStep)
  );
}

function hasUniqueStrings(values: readonly string[]) {
  return new Set(values).size === values.length;
}

function hasValidRelations(session: SessionState) {
  const activityById = new Map(
    session.activityRecords.map((activity) => [activity.activityId, activity]),
  );
  const promptById = new Map(
    session.promptRecords.map((prompt) => [prompt.promptId, prompt]),
  );
  const attemptById = new Map(
    session.attempts.map((attempt) => [attempt.id, attempt]),
  );

  if ((session.status === 'completed') !== (session.completedAt !== null)) return false;
  if (
    session.activeActivityId !== null &&
    (!activityById.has(session.activeActivityId) ||
      activityById.get(session.activeActivityId)?.completedAt !== null)
  ) {
    return false;
  }
  if (
    session.attempts.some((attempt) => {
      const prompt = promptById.get(attempt.promptId);
      return !prompt || prompt.activityId !== attempt.activityId;
    }) ||
    session.deliveries.some((delivery) => {
      const prompt = promptById.get(delivery.promptId);
      return !prompt || prompt.activityId !== delivery.activityId;
    })
  ) {
    return false;
  }

  for (const prompt of session.promptRecords) {
    const openStateIsConsistent =
      prompt.closedAt === null &&
      prompt.closeReason === null &&
      prompt.terminalAttemptId === null;
    if (prompt.closedAt === null) {
      if (!openStateIsConsistent) return false;
      continue;
    }
    if (prompt.closeReason === null) return false;
    if (prompt.closeReason !== 'answered') {
      if (prompt.terminalAttemptId !== null) return false;
      continue;
    }
    if (!prompt.terminalAttemptId) return false;
    const terminal = attemptById.get(prompt.terminalAttemptId);
    if (
      !terminal ||
      terminal.promptId !== prompt.promptId ||
      (terminal.status !== 'captured' && terminal.status !== 'mocked')
    ) {
      return false;
    }
  }

  return session.rewards.every((reward) =>
    session.activityRecords.some(
      (activity) =>
        activity.activityId === reward.activityId && activity.completedAt !== null,
    ),
  );
}

export function isSessionState(value: unknown): value is SessionState {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    (value.mode !== 'live' && value.mode !== 'fixture') ||
    !isString(value.sessionId) ||
    value.unitId !== 'size-words-unit' ||
    !isString(value.contentVersion) ||
    !Number.isInteger(value.unitAttemptNumber) ||
    Number(value.unitAttemptNumber) < 1 ||
    (value.status !== 'in_progress' && value.status !== 'completed') ||
    !isTimestamp(value.startedAt) ||
    (value.completedAt !== null && !isTimestamp(value.completedAt)) ||
    (value.activeActivityId !== null &&
      !activityIds.has(String(value.activeActivityId))) ||
    !Array.isArray(value.activityRecords) ||
    !value.activityRecords.every(isActivityRecord) ||
    !Array.isArray(value.promptRecords) ||
    !value.promptRecords.every(isPromptRecord) ||
    !Array.isArray(value.attempts) ||
    !Array.isArray(value.deliveries) ||
    !value.deliveries.every(isDeliveryEvent) ||
    !Array.isArray(value.rewards) ||
    !value.rewards.every(isRewardGrant) ||
    !isReportMetadata(value.reportMetadata)
  ) {
    return false;
  }

  const mode = value.mode as SessionState['mode'];

  return (
    hasUniqueStrings(value.activityRecords.map(({ activityId }) => activityId)) &&
    hasUniqueStrings(value.promptRecords.map(({ promptId }) => promptId)) &&
    value.attempts.every((attempt) => isSpeechAttempt(attempt, mode)) &&
    hasUniqueStrings(value.attempts.map(({ id }) => id)) &&
    hasUniqueStrings(value.deliveries.map(({ id }) => id)) &&
    hasUniqueStrings(value.deliveries.map(({ operationId }) => operationId)) &&
    hasUniqueStrings(value.rewards.map(({ checkpointId }) => checkpointId)) &&
    hasValidRelations(value as unknown as SessionState)
  );
}

export function deserializeSession(raw: string): SessionState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSessionState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function storageError(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown session storage error';
}

export async function hydrateSession(
  storage: SessionStorage,
): Promise<SessionStoreState> {
  try {
    const raw = await storage.getItem(SESSION_STORAGE_KEY);
    if (raw === null) {
      return { hydrationStatus: 'ready', hydrationError: null, session: null };
    }

    const session = deserializeSession(raw);
    if (!session) {
      await storage.removeItem(SESSION_STORAGE_KEY);
      return { hydrationStatus: 'ready', hydrationError: null, session: null };
    }

    return { hydrationStatus: 'ready', hydrationError: null, session };
  } catch (error) {
    return {
      hydrationStatus: 'error',
      hydrationError: storageError(error),
      session: null,
    };
  }
}

export async function readNextUnitAttemptNumber(storage: SessionStorage) {
  const raw = await storage.getItem(ATTEMPT_COUNTER_STORAGE_KEY);
  const previous = raw === null ? 0 : Number(raw);
  const safePrevious = Number.isInteger(previous) && previous >= 0 ? previous : 0;
  const next = safePrevious + 1;
  await storage.setItem(ATTEMPT_COUNTER_STORAGE_KEY, String(next));
  return next;
}

export async function persistSession(storage: SessionStorage, session: SessionState) {
  await storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function clearPersistedSession(storage: SessionStorage) {
  await storage.removeItem(SESSION_STORAGE_KEY);
}
