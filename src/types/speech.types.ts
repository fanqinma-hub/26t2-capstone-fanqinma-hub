import type { TargetAdjective, SizeWordKeyword, ResponseTier, ActivityPromptDefinition } from './activity.types';

export type SpeechOperationId = string;

export type SpeechErrorCode =
  | 'permission_denied'
  | 'no_match'
  | 'cancelled'
  | 'timeout'
  | 'network'
  | 'service'
  | 'unsupported'
  | 'configuration';

export type DeliveryKind =
  | 'prompt'
  | 'reprompt'
  | 'clue'
  | 'model'
  | 'recast'
  | 'replay';

export type DeliveryStatus = 'delivered' | 'failed' | 'cancelled';

export interface RecognitionResult {
  operationId: SpeechOperationId;
  transcript: string;
  normalizedTranscript: string;
  confidence: number | null;
  status: 'captured' | 'no_match';
  source: 'azure' | 'mock';
}

export interface DeliveryResult {
  operationId: SpeechOperationId;
  kind: DeliveryKind;
  text: string;
  words: readonly SizeWordKeyword[];
  primaryWords: readonly TargetAdjective[];
  status: DeliveryStatus;
  errorCode: SpeechErrorCode | null;
  completedAt: string;
}

export interface SpeechFailure {
  operationId: SpeechOperationId;
  code: SpeechErrorCode;
  message: string;
}

export type SpeechOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; failure: SpeechFailure };

export interface SpeechAdapter {
  readonly capability: 'live-azure' | 'mock';
  startListening(input: {
    operationId: SpeechOperationId;
    locale: 'en-AU';
    onAudioLevel?(level: number): void;
    onPartialTranscript?(transcript: string): void;
  }): Promise<SpeechOutcome<void>>;
  stopListening(operationId: SpeechOperationId):
    Promise<SpeechOutcome<RecognitionResult>>;
  speak(input: {
    operationId: SpeechOperationId;
    text: string;
    kind: DeliveryKind;
    words: readonly SizeWordKeyword[];
    primaryWords: readonly TargetAdjective[];
  }): Promise<SpeechOutcome<DeliveryResult>>;
  cancel(operationId?: SpeechOperationId): Promise<void>;
  stopAll(): Promise<void>;
}

export interface AzureSpeechRuntimeConfig {
  subscriptionKey: string;
  region: string;
  source: 'env-local';
}

export type SpeechRuntimeMode = 'mock' | 'azure';

export type SpeechAdapterInitResult =
  | { ok: true; adapter: SpeechAdapter }
  | { ok: false; code: 'configuration'; message: string };

export type CreateLiveAzureSpeechAdapter = (
  config: AzureSpeechRuntimeConfig,
) => SpeechAdapterInitResult;

export interface TierResult {
  tier: ResponseTier;
  detectedKeywords: readonly SizeWordKeyword[];
  detectedPrimaryWords: readonly TargetAdjective[];
  matchedVariants: readonly {
    heard: string;
    canonical: SizeWordKeyword;
    primaryEquivalent: TargetAdjective;
    similarity: number;
  }[];
}

export type ClassifySizeWords = (input: {
  prompt: ActivityPromptDefinition;
  transcript: string;
}) => TierResult;
