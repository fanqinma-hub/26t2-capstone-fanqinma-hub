/**
 * @deprecated Import from the canonical domain type files instead.
 * This Sprint 1 boundary remains as re-exports only so it cannot define a
 * second ActivityDefinition, SpeechAttempt, or SessionState.
 */
export type {
  ActivityDefinition,
  ActivityId,
  ActivityPromptDefinition,
  LearningUnitDefinition,
  PromptId,
} from './activity.types';
export type {
  SessionContextValue,
  SessionEvent,
  SessionState,
  SpeechAttempt,
} from './session.types';
export type {
  RecognitionResult,
  SpeechAdapter,
  SpeechFailure,
} from './speech.types';
