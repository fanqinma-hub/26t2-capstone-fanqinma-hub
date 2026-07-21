import type {
  ActivityId,
  PromptId,
  ResponseTier,
  SizeWordKeyword,
  TargetAdjective,
} from './activity.types';
import type {
  DeliveryKind,
  DeliveryStatus,
  SpeechErrorCode,
  SpeechOperationId,
} from './speech.types';

export type IsoTimestamp = string;
export type SessionMode = 'live' | 'fixture';
export type AttemptStatus =
  | 'captured'
  | 'no_match'
  | 'cancelled'
  | 'error'
  | 'mocked';

export interface SpeechAttempt {
  id: string;
  activityId: ActivityId;
  promptId: PromptId;
  promptText: string;
  transcript: string;
  normalizedTranscript: string;
  confidence: number | null;
  status: AttemptStatus;
  source: 'azure' | 'mock';
  errorCode: SpeechErrorCode | null;
  tier: ResponseTier | null;
  detectedKeywords: readonly SizeWordKeyword[];
  detectedPrimaryWords: readonly TargetAdjective[];
  isSpontaneous: boolean;
  scaffoldStage: 0 | 1 | 2 | 3;
  createdAt: IsoTimestamp;
}

export interface DeliveryEvent {
  id: string;
  operationId: SpeechOperationId;
  activityId: ActivityId;
  promptId: PromptId;
  kind: DeliveryKind;
  text: string;
  words: readonly SizeWordKeyword[];
  primaryWords: readonly TargetAdjective[];
  status: DeliveryStatus;
  completedAt: IsoTimestamp;
}

export interface PromptRecord {
  activityId: ActivityId;
  promptId: PromptId;
  promptText: string;
  openedAt: IsoTimestamp;
  closedAt: IsoTimestamp | null;
  closeReason: 'answered' | 'skipped' | 'timed_out' | 'error' | null;
  terminalAttemptId: string | null;
  scaffoldTapCount: number;
  replayTapCount: number;
}

export interface ActivityRecord {
  activityId: ActivityId;
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp | null;
  durationMs: number;
}

export type RewardGrant =
  | {
      checkpointId: 'coin-after-activity-1';
      activityId: 'activity-1';
      grantedAt: IsoTimestamp;
    }
  | {
      checkpointId: 'coin-after-activity-3';
      activityId: 'activity-3';
      grantedAt: IsoTimestamp;
    }
  | {
      checkpointId: 'coin-after-activity-5';
      activityId: 'activity-5';
      grantedAt: IsoTimestamp;
    };

export interface ReportMetadata {
  childName: string;
  childAge: number;
  therapistName: string;
  therapistNote: string;
  nextStep: string;
}

export interface SessionState {
  schemaVersion: 1;
  mode: SessionMode;
  sessionId: string;
  unitId: 'size-words-unit';
  contentVersion: string;
  unitAttemptNumber: number;
  status: 'in_progress' | 'completed';
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp | null;
  activeActivityId: ActivityId | null;
  activityRecords: readonly ActivityRecord[];
  promptRecords: readonly PromptRecord[];
  attempts: readonly SpeechAttempt[];
  deliveries: readonly DeliveryEvent[];
  rewards: readonly RewardGrant[];
  reportMetadata: ReportMetadata;
}

export interface SessionStoreState {
  hydrationStatus: 'loading' | 'ready' | 'error';
  hydrationError: string | null;
  session: SessionState | null;
}

export type SessionEvent =
  | {
      type: 'UNIT_STARTED';
      payload: {
        sessionId: string;
        mode: SessionMode;
        contentVersion: string;
        startedAt: IsoTimestamp;
        reportMetadata: ReportMetadata;
      };
    }
  | {
      type: 'ACTIVITY_STARTED';
      payload: { activityId: ActivityId; startedAt: IsoTimestamp };
    }
  | {
      type: 'ACTIVITY_COMPLETED';
      payload: { activityId: ActivityId; completedAt: IsoTimestamp };
    }
  | {
      type: 'PROMPT_OPENED';
      payload: {
        activityId: ActivityId;
        promptId: PromptId;
        promptText: string;
        openedAt: IsoTimestamp;
      };
    }
  | {
      type: 'PROMPT_CLOSED';
      payload: {
        activityId: ActivityId;
        promptId: PromptId;
        closedAt: IsoTimestamp;
        closeReason: NonNullable<PromptRecord['closeReason']>;
        terminalAttemptId: string | null;
      };
    }
  | {
      type: 'SCAFFOLD_TAPPED';
      payload: {
        activityId: ActivityId;
        promptId: PromptId;
        createdAt: IsoTimestamp;
      };
    }
  | {
      type: 'REPLAY_TAPPED';
      payload: {
        activityId: ActivityId;
        promptId: PromptId;
        createdAt: IsoTimestamp;
      };
    }
  | { type: 'ATTEMPT_RECORDED'; payload: { attempt: SpeechAttempt } }
  | { type: 'DELIVERY_RECORDED'; payload: { delivery: DeliveryEvent } }
  | { type: 'REWARD_GRANTED'; payload: { grant: RewardGrant } }
  | { type: 'REPORT_METADATA_UPDATED'; payload: Partial<ReportMetadata> }
  | { type: 'UNIT_COMPLETED'; payload: { completedAt: IsoTimestamp } }
  | { type: 'SESSION_RESET' };

export type SessionDispatch = (event: SessionEvent) => Promise<void>;

export interface SessionContextValue {
  store: SessionStoreState;
  dispatch: SessionDispatch;
}

/** @deprecated Sprint 1 compatibility only. New code must use SpeechAttempt.source. */
export type TranscriptSource = 'azure' | 'mock' | 'manual' | 'native' | 'web';
