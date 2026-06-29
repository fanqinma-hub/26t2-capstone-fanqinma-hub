import type { ResponseTier, SizeWordKeyword, TargetAdjective } from './activity.types';

export type TranscriptSource = 'azure' | 'manual' | 'mock' | 'native' | 'web';

export type SpeechAttemptStatus =
  | 'captured'
  | 'mocked'
  | 'no_match'
  | 'cancelled'
  | 'error';

export type MatchedSizeWord = {
  heard: string;
  canonical: SizeWordKeyword;
  confidence: number | null;
};

/**
 * Shared boundary between the future voice pipeline and Role 3 session state.
 * Raw audio and raw Azure response payloads are intentionally excluded.
 */
export type SpeechAttempt = {
  id: string;
  activityId: string;
  promptId: string;
  promptText: string;
  transcript: string;
  normalizedTranscript: string;
  detectedSizeWords: readonly SizeWordKeyword[];
  matchedVariants: readonly MatchedSizeWord[];
  tier: ResponseTier;
  targetAdjectiveUsed: TargetAdjective | null;
  scaffoldUsed: boolean;
  confidence: number | null;
  source: TranscriptSource;
  status: SpeechAttemptStatus;
  timestamp: string;
};

export type SessionPromptRecord = {
  activityId: string;
  promptId: string;
  promptText: string;
  openedAt: string;
  scaffoldUsed: boolean;
  attemptIds: readonly string[];
};

export type SessionStatus = 'idle' | 'in_progress' | 'completed';

export type SessionState = {
  sessionId: string | null;
  unitId: string;
  contentVersion: string;
  status: SessionStatus;
  activeActivityId: string | null;
  activePromptId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  promptRecords: readonly SessionPromptRecord[];
  attempts: readonly SpeechAttempt[];
};

export type SessionAction =
  | {
      type: 'START_SESSION';
      sessionId: string;
      unitId: string;
      contentVersion: string;
      startedAt: string;
    }
  | { type: 'SET_ACTIVE_ACTIVITY'; activityId: string }
  | {
      type: 'OPEN_PROMPT';
      activityId: string;
      promptId: string;
      promptText: string;
      openedAt: string;
    }
  | { type: 'MARK_SCAFFOLD_USED'; promptId: string }
  | { type: 'RECORD_ATTEMPT'; attempt: SpeechAttempt }
  | { type: 'COMPLETE_SESSION'; completedAt: string }
  | { type: 'RESET_SESSION' };
