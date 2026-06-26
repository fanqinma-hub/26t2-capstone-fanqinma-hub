import type { DialoguePhase } from './dialogue.types';

/**
 * SpeechAttempt
 * Represents a single speech recording and scoring attempt by the child.
 * Mandated by client and reports requirements.
 *
 * Owner: Role 5 (STT & Scoring) -> Shared with Role 3 (Session State) & Role 6 (Reports)
 */
export interface SpeechAttempt {
  /** Unique identifier for this speech attempt. */
  id: string;
  /** Timestamp (epoch ms) when the recording occurred. */
  timestamp: number;
  /** The specific prompt ID associated with this attempt (e.g. "act1_prompt3"). */
  promptId: string;
  /** The raw text transcribed from the child's voice input. */
  transcript: string;
  /** List of target keywords successfully detected in this response. */
  detectedSizeWords: string[];
  /**
   * The scaffolding tier level matching clinical/client requirements:
   * - Tier 1: Independent try (listening, gentle visual cue)
   * - Tier 2: Verbal prompt try (reprompt)
   * - Tier 3: Visual clue/scaffold try (tap-to-help, final listen)
   */
  tier: 1 | 2 | 3;
  /**
   * The final classification status of the attempt:
   * - 'success': Child successfully used target word(s)
   * - 'retry': Attempt made but target words not found (reprompt/scaffold triggered)
   * - 'error': Failed recording (e.g., silence, permission issue, network error)
   */
  status: 'success' | 'retry' | 'error';
  /** Detail of the error if status is 'error'. */
  errorText?: string;
}

/**
 * ActivityDefinition
 * Schema representing an activity configuration.
 *
 * Owner: Role 3 (Session State Lead) -> Shared with Role 5 & Role 4
 */
export interface ActivityDefinition {
  /** Unique ID of the activity (e.g., '1') */
  activityId: string;
  /** Display title for child and parent view */
  title: string;
  /** Targeted vocabulary terms for speech scoring (e.g. ['big', 'small', 'tiny']) */
  targetKeywords: string[];
  /** Total number of prompts/steps configured for this activity */
  totalPrompts: number;
}

/**
 * SessionState
 * Structure of the active therapy session state kept in memory.
 *
 * Owner: Role 3 (Session State Lead) -> Shared with Role 6 & Role 5
 */
export interface SessionState {
  currentActivityId: string | null;
  /** Chronological database of child's attempts within the current session */
  attempts: SpeechAttempt[];
  /** Accumulated list of successfully verbalized target keywords in this session */
  completedKeywords: string[];
}

/**
 * SessionContextType
 * React context interface proposed for SessionState access and updates.
 *
 * Owner: Role 3 (Session State Lead) -> Used by Role 5 to record scoring outcomes
 */
export interface SessionContextType {
  state: SessionState;
  /** Starts a therapy activity and initialises progress */
  startActivity: (activityId: string) => void;
  /** Inserts a new speech attempt record into local history */
  addSpeechAttempt: (attempt: Omit<SpeechAttempt, 'id' | 'timestamp'>) => void;
  /** Resets the active session progress */
  resetSession: () => void;
}

/**
 * AudioRecordingState
 * State contract for capturing live microphone amplitudes to support wave animation.
 *
 * Owner: Role 5 (STT & Scoring) -> Shared with Role 2 (Child UI) for animating input visualisers
 */
export interface AudioRecordingState {
  /** True when microphone is recording audio */
  isRecording: boolean;
  /** Normalized input volume level (0.0 = silence, 1.0 = peak input) */
  audioLevel: number;
  /** Length of the current active recording in milliseconds */
  durationMs: number;
}

/**
 * Proposed Extension for ConversationTimerActions (from Role 4's useConversationTimer)
 * Allows Role 5 to dispatch error events to the core dialogue state machine.
 */
export interface ExtendedConversationTimerActions {
  /** Starts a prompt cycle */
  startPrompt: (promptId: string) => void;
  /** Signals prompt verbal delivery is complete */
  promptDelivered: () => void;
  /** Submits STT transcript when child response completes */
  handleResponse: (transcript: string) => void;
  /** Handles tap-to-help trigger */
  handleTapHelp: () => void;
  /** Skips active phase */
  skip: () => void;
  /** Resets active timer */
  reset: () => void;
  /**
   * PROPOSED ADDITION: Submits STT error (no mic, service error) to prompt fallback flow.
   */
  handleError: (error: string) => void;
}
