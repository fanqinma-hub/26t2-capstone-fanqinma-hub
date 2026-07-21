import { sizeWordsUnit } from '@/content/size-words';
import type { SessionEvent, SessionState, SpeechAttempt } from '@/types/session.types';

import {
  createSessionState,
  reduceSessionEvent,
  SessionEventError,
} from '../session-reducer';

const metadata = {
  childName: 'Sam',
  childAge: 7,
  therapistName: 'Taylor',
  therapistNote: '',
  nextStep: '',
};

function createFixtureSession(mode: SessionState['mode'] = 'fixture') {
  return createSessionState(
    {
      sessionId: `session-${mode}`,
      mode,
      contentVersion: sizeWordsUnit.contentVersion,
      startedAt: '2026-07-17T09:00:00.000Z',
      reportMetadata: metadata,
    },
    1,
  );
}

function dispatch(
  session: SessionState,
  event: Exclude<SessionEvent, { type: 'UNIT_STARTED' | 'SESSION_RESET' }>,
) {
  return reduceSessionEvent(session, event) as SessionState;
}

function openWatermelon(session = createFixtureSession()) {
  const started = dispatch(session, {
    type: 'ACTIVITY_STARTED',
    payload: {
      activityId: 'activity-1',
      startedAt: '2026-07-17T09:00:01.000Z',
    },
  });
  return dispatch(started, {
    type: 'PROMPT_OPENED',
    payload: {
      activityId: 'activity-1',
      promptId: 'activity-1:watermelon',
      promptText: 'What’s that big green thing on the left?',
      openedAt: '2026-07-17T09:00:02.000Z',
    },
  });
}

function fixtureAttempt(overrides: Partial<SpeechAttempt> = {}): SpeechAttempt {
  return {
    id: 'attempt-1',
    activityId: 'activity-1',
    promptId: 'activity-1:watermelon',
    promptText: 'What’s that big green thing on the left?',
    transcript: 'a big watermelon',
    normalizedTranscript: 'a big watermelon',
    confidence: null,
    status: 'mocked',
    source: 'mock',
    errorCode: null,
    tier: 'adjective_used',
    detectedKeywords: ['big'],
    detectedPrimaryWords: ['big'],
    isSpontaneous: false,
    scaffoldStage: 0,
    createdAt: '2026-07-17T09:00:04.000Z',
    ...overrides,
  };
}

describe('Sprint 2 session reducer', () => {
  it('records compound prompt identity and computes non-negative activity duration', () => {
    const opened = openWatermelon();
    const completed = dispatch(opened, {
      type: 'ACTIVITY_COMPLETED',
      payload: {
        activityId: 'activity-1',
        completedAt: '2026-07-17T09:00:11.000Z',
      },
    });

    expect(opened.promptRecords[0].promptId).toBe('activity-1:watermelon');
    expect(completed.activityRecords[0].durationMs).toBe(10_000);
  });

  it('rejects attempts whose source or successful status does not match session mode', () => {
    const fixture = openWatermelon();
    expect(() =>
      dispatch(fixture, {
        type: 'ATTEMPT_RECORDED',
        payload: {
          attempt: fixtureAttempt({ source: 'azure', status: 'captured' }),
        },
      }),
    ).toThrow(SessionEventError);

    const live = openWatermelon(createFixtureSession('live'));
    expect(() =>
      dispatch(live, {
        type: 'ATTEMPT_RECORDED',
        payload: { attempt: fixtureAttempt() },
      }),
    ).toThrow('live sessions accept only azure');
  });

  it('computes isSpontaneous from prior full-word model/recast deliveries', () => {
    const opened = openWatermelon();
    const modelled = dispatch(opened, {
      type: 'DELIVERY_RECORDED',
      payload: {
        delivery: {
          id: 'delivery-1',
          operationId: 'operation-1',
          activityId: 'activity-1',
          promptId: 'activity-1:watermelon',
          kind: 'model',
          text: 'A big watermelon.',
          words: ['big'],
          primaryWords: ['big'],
          status: 'delivered',
          completedAt: '2026-07-17T09:00:03.000Z',
        },
      },
    });
    const attempted = dispatch(modelled, {
      type: 'ATTEMPT_RECORDED',
      payload: { attempt: fixtureAttempt({ isSpontaneous: true }) },
    });

    expect(attempted.attempts[0].isSpontaneous).toBe(false);
  });

  it('ignores duplicate delivery operation ids and duplicate attempt ids', () => {
    const opened = openWatermelon();
    const event = {
      type: 'DELIVERY_RECORDED',
      payload: {
        delivery: {
          id: 'delivery-1',
          operationId: 'operation-1',
          activityId: 'activity-1',
          promptId: 'activity-1:watermelon',
          kind: 'prompt',
          text: 'What is it?',
          words: ['big'],
          primaryWords: ['big'],
          status: 'delivered',
          completedAt: '2026-07-17T09:00:03.000Z',
        },
      },
    } as const;
    const once = dispatch(opened, event);
    const duplicateOperation = dispatch(once, {
      ...event,
      payload: { delivery: { ...event.payload.delivery, id: 'delivery-2' } },
    });
    const attempted = dispatch(duplicateOperation, {
      type: 'ATTEMPT_RECORDED',
      payload: { attempt: fixtureAttempt() },
    });
    const duplicateAttempt = dispatch(attempted, {
      type: 'ATTEMPT_RECORDED',
      payload: { attempt: fixtureAttempt({ transcript: 'changed' }) },
    });

    expect(duplicateOperation.deliveries).toHaveLength(1);
    expect(duplicateAttempt.attempts).toHaveLength(1);
    expect(duplicateAttempt.attempts[0].transcript).toBe('a big watermelon');
  });

  it('requires null Tier for unsuccessful attempts and resets deterministically', () => {
    const opened = openWatermelon();
    expect(() =>
      dispatch(opened, {
        type: 'ATTEMPT_RECORDED',
        payload: {
          attempt: fixtureAttempt({
            transcript: '',
            normalizedTranscript: '',
            status: 'no_match',
            tier: 'noun_only',
          }),
        },
      }),
    ).toThrow('no_match attempts must have tier: null');
    expect(reduceSessionEvent(opened, { type: 'SESSION_RESET' })).toBeNull();
  });

  it('grants only the fixed checkpoint once after activity completion', () => {
    const started = dispatch(createFixtureSession(), {
      type: 'ACTIVITY_STARTED',
      payload: {
        activityId: 'activity-1',
        startedAt: '2026-07-17T09:00:01.000Z',
      },
    });
    const completed = dispatch(started, {
      type: 'ACTIVITY_COMPLETED',
      payload: {
        activityId: 'activity-1',
        completedAt: '2026-07-17T09:00:11.000Z',
      },
    });
    const rewardEvent = {
      type: 'REWARD_GRANTED',
      payload: {
        grant: {
          checkpointId: 'coin-after-activity-1',
          activityId: 'activity-1',
          grantedAt: '2026-07-17T09:00:12.000Z',
        },
      },
    } as const;
    const granted = dispatch(completed, rewardEvent);

    expect(dispatch(granted, rewardEvent).rewards).toHaveLength(1);
  });
});
