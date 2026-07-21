import { sizeWordsUnit } from '@/content/size-words';
import {
  createAzureFailureSession,
  createHighParticipationSession,
  createMediumParticipationSession,
} from '@/fixtures/sprint2-session.fixtures';
import { selectSessionMetrics } from '@/session/session-selectors';

import {
  buildCurrentReportViewModel,
  getCurrentReportDataNotice,
} from '../report-read-model';

describe('report read model', () => {
  it.each([
    ['medium fixture', createMediumParticipationSession],
    ['high fixture', createHighParticipationSession],
    ['live failure', createAzureFailureSession],
  ])('uses the canonical session metrics for %s', (_label, createSession) => {
    const session = createSession();
    const metrics = selectSessionMetrics(session, sizeWordsUnit);
    const report = buildCurrentReportViewModel(session);

    expect(report.header.durationMs).toBe(metrics.durationMs);
    expect(report.therapist).toMatchObject({
      totalUtterances: metrics.totalUtterances,
      sizeWordUtterances: metrics.sizeWordUtterances,
      adjectiveUseRate: metrics.adjectiveUseRate,
      tierCounts: metrics.tierCounts,
      scaffoldTaps: metrics.scaffoldTaps,
      replayTaps: metrics.replayTaps,
      uniqueKeywords: metrics.uniqueKeywords,
      readinessRate: metrics.readinessRate,
      activity5: metrics.activity5,
      activityRows: metrics.activityRows,
      wordStats: metrics.wordEvidence,
    });
    expect(report.parent.wordCards).toEqual(metrics.wordEvidence);
  });

  it('preserves delivery evidence for a modelled word that was not spontaneous', () => {
    const base = createMediumParticipationSession();
    const session = {
      ...base,
      attempts: base.attempts.map((attempt) =>
        attempt.detectedPrimaryWords.includes('big')
          ? { ...attempt, isSpontaneous: false }
          : attempt,
      ),
    };

    const report = buildCurrentReportViewModel(session);
    const big = report.therapist.wordStats.find(({ word }) => word === 'big');

    expect(big).toMatchObject({ status: 'HEARD', timesHeard: 1, timesUsed: 0 });
  });

  it('clearly labels sample and fixture data notices', () => {
    const session = createMediumParticipationSession();

    expect(getCurrentReportDataNotice(session, { isSampleData: true }))
      .toContain('sample data');
    expect(getCurrentReportDataNotice(session)).toContain('fixture session data');
  });
});
