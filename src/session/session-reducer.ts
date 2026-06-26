import type {
  SessionAction,
  SessionPromptRecord,
  SessionState,
} from '@/types/session.types';

export function createInitialSessionState(): SessionState {
  return {
    sessionId: null,
    unitId: 'size-words-unit',
    contentVersion: '2026-06-25',
    status: 'idle',
    activeActivityId: null,
    activePromptId: null,
    startedAt: null,
    completedAt: null,
    promptRecords: [],
    attempts: [],
  };
}

function updatePrompt(
  records: readonly SessionPromptRecord[],
  promptId: string,
  update: (record: SessionPromptRecord) => SessionPromptRecord,
) {
  return records.map((record) =>
    record.promptId === promptId ? update(record) : record,
  );
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...createInitialSessionState(),
        sessionId: action.sessionId,
        unitId: action.unitId,
        contentVersion: action.contentVersion,
        status: 'in_progress',
        startedAt: action.startedAt,
      };

    case 'SET_ACTIVE_ACTIVITY':
      return {
        ...state,
        activeActivityId: action.activityId,
      };

    case 'OPEN_PROMPT': {
      const existing = state.promptRecords.some(
        (record) => record.promptId === action.promptId,
      );
      return {
        ...state,
        activeActivityId: action.activityId,
        activePromptId: action.promptId,
        status: state.sessionId ? 'in_progress' : state.status,
        completedAt: state.sessionId ? null : state.completedAt,
        promptRecords: existing
          ? state.promptRecords
          : [
              ...state.promptRecords,
              {
                activityId: action.activityId,
                promptId: action.promptId,
                promptText: action.promptText,
                openedAt: action.openedAt,
                scaffoldUsed: false,
                attemptIds: [],
              },
            ],
      };
    }

    case 'MARK_SCAFFOLD_USED':
      return {
        ...state,
        promptRecords: updatePrompt(
          state.promptRecords,
          action.promptId,
          (record) => ({
            ...record,
            scaffoldUsed: true,
          }),
        ),
      };

    case 'RECORD_ATTEMPT':
      if (state.attempts.some((attempt) => attempt.id === action.attempt.id)) {
        return state;
      }
      return {
        ...state,
        attempts: [...state.attempts, action.attempt],
        promptRecords: updatePrompt(
          state.promptRecords,
          action.attempt.promptId,
          (record) => ({
            ...record,
            scaffoldUsed: record.scaffoldUsed || action.attempt.scaffoldUsed,
            attemptIds: [...record.attemptIds, action.attempt.id],
          }),
        ),
      };

    case 'COMPLETE_SESSION':
      return {
        ...state,
        status: 'completed',
        activeActivityId: null,
        activePromptId: null,
        completedAt: action.completedAt,
      };

    case 'RESET_SESSION':
      return createInitialSessionState();

    default:
      return state;
  }
}
