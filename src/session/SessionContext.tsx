import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';

import type { SessionAction, SessionState } from '@/types/session.types';

import { createInitialSessionState, sessionReducer } from './session-reducer';

type SessionContextValue = {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
  resetSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = PropsWithChildren<{
  initialState?: SessionState;
}>;

export function SessionProvider({
  children,
  initialState,
}: SessionProviderProps) {
  const [state, dispatch] = useReducer(
    sessionReducer,
    initialState ?? createInitialSessionState(),
  );
  const resetSession = useCallback(
    () => dispatch({ type: 'RESET_SESSION' }),
    [],
  );
  const value = useMemo(
    () => ({ state, dispatch, resetSession }),
    [resetSession, state],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider.');
  }
  return context;
}
