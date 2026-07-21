import type {
  ActivityId,
  LearningUnitDefinition,
  ResponseTier,
  SizeWordKeyword,
  TargetAdjective,
} from './activity.types';
import type { SessionState } from './session.types';
import type { SceneAssetKey } from './visual.types';

export type WordLearningStatus = 'USED' | 'HEARD' | 'NOT_YET';

export interface WordEvidence {
  word: TargetAdjective;
  status: WordLearningStatus;
  examples: readonly string[];
  timesUsed: number;
  timesHeard: number;
}

export interface ActivityMetricsRow {
  activityId: ActivityId;
  scene: SceneAssetKey;
  promptsGiven: number;
  tier1: number;
  tier2: number;
  tier3: number;
  scaffoldsUsed: number;
}

export interface SessionMetrics {
  durationMs: number;
  totalUtterances: number;
  sizeWordUtterances: number;
  adjectiveUseRate: number | null;
  tierCounts: Record<ResponseTier, number>;
  scaffoldTaps: number;
  replayTaps: number;
  uniqueKeywords: readonly SizeWordKeyword[];
  wordEvidence: readonly WordEvidence[];
  readinessRate: number | null;
  activity5: { adjectiveUseRate: number | null; usedAllSix: boolean };
  activityRows: readonly ActivityMetricsRow[];
}

export type SelectSessionMetrics = (
  session: SessionState,
  unit: LearningUnitDefinition,
) => SessionMetrics;
