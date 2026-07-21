import { sizeWordsUnit } from '@/content/size-words';
import {
  createAzureFailureSession,
  createHighParticipationSession,
  createLowParticipationSession,
  createMediumParticipationSession,
} from '@/fixtures/sprint2-session.fixtures';

import { isSessionState } from '../session-persistence';
import { selectSessionMetrics } from '../session-selectors';

describe('Role 3 session fixtures and report metric selectors', () => {
  it('provides valid low, medium, high and Azure-failure fixtures', () => {
    expect(
      [
        createLowParticipationSession(),
        createMediumParticipationSession(),
        createHighParticipationSession(),
        createAzureFailureSession(),
      ].every(isSessionState),
    ).toBe(true);
  });

  it('excludes Azure errors and returns null for zero denominators', () => {
    const metrics = selectSessionMetrics(createAzureFailureSession(), sizeWordsUnit);

    expect(metrics.totalUtterances).toBe(0);
    expect(metrics.adjectiveUseRate).toBeNull();
    expect(metrics.readinessRate).toBeNull();
    expect(metrics.activity5.adjectiveUseRate).toBeNull();
  });

  it('calculates medium participation rates from valid terminal utterances', () => {
    const metrics = selectSessionMetrics(
      createMediumParticipationSession(),
      sizeWordsUnit,
    );

    expect(metrics.totalUtterances).toBe(5);
    expect(metrics.sizeWordUtterances).toBe(4);
    expect(metrics.adjectiveUseRate).toBe(0.8);
    expect(metrics.readinessRate).toBe(0.8);
    expect(metrics.scaffoldTaps).toBe(2);
    expect(metrics.replayTaps).toBe(1);
  });

  it('keeps word evidence ordered and separates Activity 5 generalisation', () => {
    const metrics = selectSessionMetrics(
      createHighParticipationSession(),
      sizeWordsUnit,
    );

    expect(metrics.wordEvidence.map(({ word }) => word)).toEqual([
      'big',
      'small',
      'tiny',
      'huge',
      'gigantic',
      'medium',
    ]);
    expect(metrics.wordEvidence.every(({ status }) => status === 'USED')).toBe(true);
    expect(metrics.activity5.usedAllSix).toBe(true);
    expect(metrics.activity5.adjectiveUseRate).toBe(1);
    expect(metrics.readinessRate).toBe(1);
  });

  it('counts prompts and terminal Tiers per activity without treating skips/errors as utterances', () => {
    const metrics = selectSessionMetrics(
      createLowParticipationSession(),
      sizeWordsUnit,
    );
    const activity1 = metrics.activityRows.find(
      ({ activityId }) => activityId === 'activity-1',
    );

    expect(metrics.tierCounts).toEqual({
      noun_only: 2,
      adjective_used: 0,
      rich_description: 0,
    });
    expect(activity1).toMatchObject({
      promptsGiven: 1,
      tier1: 1,
      tier2: 0,
      tier3: 0,
      scaffoldsUsed: 1,
    });
  });

  it('marks a modelled-only word as HEARD and counts successful recasts', () => {
    const low = createLowParticipationSession();
    const session = {
      ...low,
      deliveries: [
        ...low.deliveries,
        {
          id: 'heard-big-delivery',
          operationId: 'heard-big-operation',
          activityId: 'activity-1' as const,
          promptId: 'activity-1:watermelon' as const,
          kind: 'recast' as const,
          text: 'A BIG watermelon!',
          words: ['big'] as const,
          primaryWords: ['big'] as const,
          status: 'delivered' as const,
          completedAt: '2026-07-17T09:01:00.000Z',
        },
      ],
    };
    const big = selectSessionMetrics(session, sizeWordsUnit).wordEvidence[0];

    expect(big).toMatchObject({
      word: 'big',
      status: 'HEARD',
      timesUsed: 0,
      timesHeard: 1,
    });
    expect(big.examples).toEqual(['A BIG watermelon!']);
  });
});
