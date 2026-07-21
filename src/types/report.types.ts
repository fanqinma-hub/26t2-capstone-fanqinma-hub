import type { ResponseTier, SizeWordKeyword } from './activity.types';
import type {
  ActivityMetricsRow,
  WordEvidence,
} from './metrics.types';
import type { SessionState } from './session.types';

export type ReportAudience = 'parent' | 'therapist';

export interface ReportViewModel {
  mode: SessionState['mode'];
  header: {
    childName: string;
    childAge: number;
    therapistName: string;
    unitTitle: string;
    completionDate: string;
    durationMs: number;
    unitAttemptNumber: number;
  };
  parent: {
    scenarioId: 'low' | 'developing' | 'ready' | 'strong';
    starRating: 1 | 2 | 3 | 4 | 5;
    summaryText: string;
    wordCards: readonly WordEvidence[];
    therapistNote: string;
    homeTip: { label: '5-minute activity' | 'anytime'; text: string };
  };
  therapist: {
    totalUtterances: number;
    sizeWordUtterances: number;
    adjectiveUseRate: number | null;
    tierCounts: Record<ResponseTier, number>;
    scaffoldTaps: number;
    replayTaps: number;
    uniqueKeywords: readonly SizeWordKeyword[];
    wordStats: readonly WordEvidence[];
    readinessRate: number | null;
    activity5: { adjectiveUseRate: number | null; usedAllSix: boolean };
    activityRows: readonly ActivityMetricsRow[];
    nextStep: string;
    ndisContext: string;
  };
}

export type BuildReportViewModel = (session: SessionState) => ReportViewModel;
