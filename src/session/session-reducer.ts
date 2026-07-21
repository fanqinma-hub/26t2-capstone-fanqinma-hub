import type {
  ActivityRecord,
  DeliveryEvent,
  PromptRecord,
  ReportMetadata,
  RewardGrant,
  SessionEvent,
  SessionState,
  SpeechAttempt,
} from '@/types/session.types';

const checkpointByActivity = {
  'activity-1': 'coin-after-activity-1',
  'activity-3': 'coin-after-activity-3',
  'activity-5': 'coin-after-activity-5',
} as const;

export class SessionEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionEventError';
  }
}

function timestampMs(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new SessionEventError(`${label} must be an ISO timestamp`);
  }
  return parsed;
}

function requireSession(session: SessionState | null, eventType: string): SessionState {
  if (!session) {
    throw new SessionEventError(`${eventType} requires an active unit session`);
  }
  return session;
}

function updatePrompt(
  records: readonly PromptRecord[],
  promptId: PromptRecord['promptId'],
  update: (record: PromptRecord) => PromptRecord,
) {
  return records.map((record) => (record.promptId === promptId ? update(record) : record));
}

function updateActivity(
  records: readonly ActivityRecord[],
  activityId: ActivityRecord['activityId'],
  update: (record: ActivityRecord) => ActivityRecord,
) {
  return records.map((record) =>
    record.activityId === activityId ? update(record) : record,
  );
}

function assertActivityIsOpen(session: SessionState, activityId: ActivityRecord['activityId']) {
  const activity = session.activityRecords.find((record) => record.activityId === activityId);
  if (!activity || activity.completedAt) {
    throw new SessionEventError(`${activityId} is not an open activity`);
  }
}

function assertPromptIsOpen(
  session: SessionState,
  activityId: PromptRecord['activityId'],
  promptId: PromptRecord['promptId'],
) {
  const prompt = session.promptRecords.find((record) => record.promptId === promptId);
  if (!prompt || prompt.activityId !== activityId || prompt.closedAt) {
    throw new SessionEventError(`${promptId} is not an open prompt in ${activityId}`);
  }
  return prompt;
}

function validateAttemptPolicy(session: SessionState, attempt: SpeechAttempt) {
  assertPromptIsOpen(session, attempt.activityId, attempt.promptId);
  timestampMs(attempt.createdAt, 'SpeechAttempt.createdAt');

  const expectedSource = session.mode === 'live' ? 'azure' : 'mock';
  if (attempt.source !== expectedSource) {
    throw new SessionEventError(
      `${session.mode} sessions accept only ${expectedSource} speech attempts`,
    );
  }

  if (session.mode === 'live' && attempt.status === 'mocked') {
    throw new SessionEventError('A live session cannot contain a mocked attempt');
  }
  if (session.mode === 'fixture' && attempt.status === 'captured') {
    throw new SessionEventError('A fixture session cannot contain a captured attempt');
  }

  const isSuccessful = attempt.status === 'captured' || attempt.status === 'mocked';
  if (isSuccessful && (!attempt.transcript.trim() || attempt.tier === null)) {
    throw new SessionEventError(
      `${attempt.status} attempts require a transcript and response Tier`,
    );
  }
  if (!isSuccessful && attempt.tier !== null) {
    throw new SessionEventError(`${attempt.status} attempts must have tier: null`);
  }
}

function computeIsSpontaneous(
  deliveries: readonly DeliveryEvent[],
  attempt: SpeechAttempt,
) {
  const attemptTime = timestampMs(attempt.createdAt, 'SpeechAttempt.createdAt');
  return !deliveries.some((delivery) => {
    if (
      delivery.promptId !== attempt.promptId ||
      delivery.status !== 'delivered' ||
      (delivery.kind !== 'model' && delivery.kind !== 'recast') ||
      delivery.primaryWords.length === 0
    ) {
      return false;
    }
    return timestampMs(delivery.completedAt, 'DeliveryEvent.completedAt') <= attemptTime;
  });
}

function assertDeliveryPolicy(session: SessionState, delivery: DeliveryEvent) {
  assertPromptIsOpen(session, delivery.activityId, delivery.promptId);
  timestampMs(delivery.completedAt, 'DeliveryEvent.completedAt');
}

function assertRewardPolicy(session: SessionState, grant: RewardGrant) {
  const expected = checkpointByActivity[grant.activityId as keyof typeof checkpointByActivity];
  if (expected !== grant.checkpointId) {
    throw new SessionEventError(
      `${grant.checkpointId} is not the checkpoint for ${grant.activityId}`,
    );
  }
  if (
    !session.activityRecords.some(
      (activity) => activity.activityId === grant.activityId && activity.completedAt,
    )
  ) {
    throw new SessionEventError(`${grant.activityId} must complete before its reward is granted`);
  }
  timestampMs(grant.grantedAt, 'RewardGrant.grantedAt');
}

export function createSessionState(
  payload: Extract<SessionEvent, { type: 'UNIT_STARTED' }>['payload'],
  unitAttemptNumber: number,
): SessionState {
  if (!Number.isInteger(unitAttemptNumber) || unitAttemptNumber < 1) {
    throw new SessionEventError('unitAttemptNumber must be a positive integer');
  }
  timestampMs(payload.startedAt, 'UNIT_STARTED.startedAt');
  if (!payload.sessionId.trim()) throw new SessionEventError('sessionId is required');
  if (!payload.contentVersion.trim()) throw new SessionEventError('contentVersion is required');

  return {
    schemaVersion: 1,
    mode: payload.mode,
    sessionId: payload.sessionId,
    unitId: 'size-words-unit',
    contentVersion: payload.contentVersion,
    unitAttemptNumber,
    status: 'in_progress',
    startedAt: payload.startedAt,
    completedAt: null,
    activeActivityId: null,
    activityRecords: [],
    promptRecords: [],
    attempts: [],
    deliveries: [],
    rewards: [],
    reportMetadata: payload.reportMetadata,
  };
}

/**
 * Pure Role 3 state transition. Persistence is intentionally handled by the
 * context so every awaited dispatch represents a state that is already stored.
 */
export function reduceSessionEvent(
  current: SessionState | null,
  event: Exclude<SessionEvent, { type: 'UNIT_STARTED' }>,
): SessionState | null {
  if (event.type === 'SESSION_RESET') return null;
  const session = requireSession(current, event.type);

  switch (event.type) {
    case 'ACTIVITY_STARTED': {
      if (session.status === 'completed') {
        throw new SessionEventError('A completed unit cannot start another activity');
      }
      timestampMs(event.payload.startedAt, 'ACTIVITY_STARTED.startedAt');
      const existing = session.activityRecords.find(
        (record) => record.activityId === event.payload.activityId,
      );
      if (existing) return session;
      return {
        ...session,
        activeActivityId: event.payload.activityId,
        activityRecords: [
          ...session.activityRecords,
          {
            activityId: event.payload.activityId,
            startedAt: event.payload.startedAt,
            completedAt: null,
            durationMs: 0,
          },
        ],
      };
    }

    case 'ACTIVITY_COMPLETED': {
      const activity = session.activityRecords.find(
        (record) => record.activityId === event.payload.activityId,
      );
      if (!activity) {
        throw new SessionEventError(`${event.payload.activityId} was not started`);
      }
      if (activity.completedAt) return session;
      const completedAt = timestampMs(
        event.payload.completedAt,
        'ACTIVITY_COMPLETED.completedAt',
      );
      const startedAt = timestampMs(activity.startedAt, 'ActivityRecord.startedAt');
      return {
        ...session,
        activeActivityId:
          session.activeActivityId === event.payload.activityId
            ? null
            : session.activeActivityId,
        activityRecords: updateActivity(
          session.activityRecords,
          event.payload.activityId,
          (record) => ({
            ...record,
            completedAt: event.payload.completedAt,
            durationMs: Math.max(0, completedAt - startedAt),
          }),
        ),
      };
    }

    case 'PROMPT_OPENED': {
      assertActivityIsOpen(session, event.payload.activityId);
      timestampMs(event.payload.openedAt, 'PROMPT_OPENED.openedAt');
      if (session.promptRecords.some((record) => record.promptId === event.payload.promptId)) {
        return session;
      }
      if (!event.payload.promptId.startsWith(`${event.payload.activityId}:`)) {
        throw new SessionEventError('Prompt identity must include its activity id');
      }
      return {
        ...session,
        promptRecords: [
          ...session.promptRecords,
          {
            activityId: event.payload.activityId,
            promptId: event.payload.promptId,
            promptText: event.payload.promptText,
            openedAt: event.payload.openedAt,
            closedAt: null,
            closeReason: null,
            terminalAttemptId: null,
            scaffoldTapCount: 0,
            replayTapCount: 0,
          },
        ],
      };
    }

    case 'PROMPT_CLOSED': {
      const prompt = assertPromptIsOpen(
        session,
        event.payload.activityId,
        event.payload.promptId,
      );
      timestampMs(event.payload.closedAt, 'PROMPT_CLOSED.closedAt');
      if (event.payload.closeReason === 'answered') {
        const terminal = session.attempts.find(
          (attempt) => attempt.id === event.payload.terminalAttemptId,
        );
        if (
          !terminal ||
          terminal.promptId !== prompt.promptId ||
          (terminal.status !== 'captured' && terminal.status !== 'mocked')
        ) {
          throw new SessionEventError(
            'An answered prompt requires a successful terminal attempt for that prompt',
          );
        }
      } else if (event.payload.terminalAttemptId !== null) {
        throw new SessionEventError(
          `${event.payload.closeReason} prompts cannot name a terminal attempt`,
        );
      }
      return {
        ...session,
        promptRecords: updatePrompt(
          session.promptRecords,
          prompt.promptId,
          (record) => ({
            ...record,
            closedAt: event.payload.closedAt,
            closeReason: event.payload.closeReason,
            terminalAttemptId: event.payload.terminalAttemptId,
          }),
        ),
      };
    }

    case 'SCAFFOLD_TAPPED':
    case 'REPLAY_TAPPED': {
      const prompt = assertPromptIsOpen(
        session,
        event.payload.activityId,
        event.payload.promptId,
      );
      timestampMs(event.payload.createdAt, `${event.type}.createdAt`);
      return {
        ...session,
        promptRecords: updatePrompt(
          session.promptRecords,
          prompt.promptId,
          (record) => ({
            ...record,
            scaffoldTapCount:
              event.type === 'SCAFFOLD_TAPPED'
                ? record.scaffoldTapCount + 1
                : record.scaffoldTapCount,
            replayTapCount:
              event.type === 'REPLAY_TAPPED'
                ? record.replayTapCount + 1
                : record.replayTapCount,
          }),
        ),
      };
    }

    case 'ATTEMPT_RECORDED': {
      const incoming = event.payload.attempt;
      if (session.attempts.some((attempt) => attempt.id === incoming.id)) return session;
      validateAttemptPolicy(session, incoming);
      const attempt = {
        ...incoming,
        isSpontaneous: computeIsSpontaneous(session.deliveries, incoming),
      };
      return { ...session, attempts: [...session.attempts, attempt] };
    }

    case 'DELIVERY_RECORDED': {
      const incoming = event.payload.delivery;
      if (
        session.deliveries.some(
          (delivery) =>
            delivery.id === incoming.id || delivery.operationId === incoming.operationId,
        )
      ) {
        return session;
      }
      assertDeliveryPolicy(session, incoming);
      return { ...session, deliveries: [...session.deliveries, incoming] };
    }

    case 'REWARD_GRANTED': {
      const incoming = event.payload.grant;
      if (
        session.rewards.some((reward) => reward.checkpointId === incoming.checkpointId)
      ) {
        return session;
      }
      assertRewardPolicy(session, incoming);
      return { ...session, rewards: [...session.rewards, incoming] };
    }

    case 'REPORT_METADATA_UPDATED': {
      const reportMetadata: ReportMetadata = {
        ...session.reportMetadata,
        ...event.payload,
      };
      return { ...session, reportMetadata };
    }

    case 'UNIT_COMPLETED': {
      if (session.status === 'completed') return session;
      timestampMs(event.payload.completedAt, 'UNIT_COMPLETED.completedAt');
      const activity5Complete = session.activityRecords.some(
        (activity) => activity.activityId === 'activity-5' && activity.completedAt,
      );
      const finalRewardGranted = session.rewards.some(
        (reward) => reward.checkpointId === 'coin-after-activity-5',
      );
      if (!activity5Complete || !finalRewardGranted) {
        throw new SessionEventError(
          'Activity 5 and its fixed reward must be persisted before UNIT_COMPLETED',
        );
      }
      return {
        ...session,
        status: 'completed',
        completedAt: event.payload.completedAt,
        activeActivityId: null,
      };
    }
  }
}
