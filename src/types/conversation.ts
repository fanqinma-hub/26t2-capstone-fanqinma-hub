// Storage status name
export type ConversationPhase =
  | 'intro'
  | 'prompt'
  | 'listening'
  | 'gentleCue'
  | 'reprompt'
  | 'tapHelpAvailable'
  | 'cluePresented'
  | 'finalListening'
  | 'processing'
  | 'tierFeedback'
  | 'success'
  | 'retry'
  | 'autoAdvance'
  | 'complete'
  | 'error';

export type DialogueActionType =
  | 'SHOW_PROMPT'
  | 'START_LISTENING'
  | 'SHOW_GENTLE_CUE'
  | 'SHOW_REPROMPT'
  | 'SHOW_TAP_TO_HELP'
  | 'SHOW_CLUE'
  | 'START_FINAL_LISTENING'
  | 'START_PROCESSING'
  | 'SHOW_TIER_FEEDBACK'
  | 'AUTO_ADVANCE'
  | 'COMPLETE_ACTIVITY'
  | 'STOP_TIMERS';

export type DialogueAction = {
  type: DialogueActionType;
  phase: ConversationPhase;
  message?: string;
  timestamp: number;
};

export type TierClassification = 'noun_only' | 'adjective_used' | 'rich_description';

export type TierFeedbackInput = {
  tier: TierClassification;
  detectedWords?: string[];
  targetAdjective?: string;
};