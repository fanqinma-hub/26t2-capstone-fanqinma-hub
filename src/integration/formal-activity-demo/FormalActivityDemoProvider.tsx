import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';

import {
  createInitialFormalActivityDemoState,
  formalActivityDemoReducer,
  type FormalActivityDemoAction,
  type FormalActivityDemoState,
} from './formal-activity-demo.state';

type FormalActivityDemoContextValue = Readonly<{
  state: FormalActivityDemoState;
  dispatch: Dispatch<FormalActivityDemoAction>;
  resetDemo(): void;
}>;

const FormalActivityDemoContext =
  createContext<FormalActivityDemoContextValue | null>(null);

export function FormalActivityDemoProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(
    formalActivityDemoReducer,
    undefined,
    createInitialFormalActivityDemoState,
  );
  const resetDemo = useCallback(() => dispatch({ type: 'RESET_DEMO' }), []);
  const value = useMemo(
    () => ({ state, dispatch, resetDemo }),
    [resetDemo, state],
  );

  return (
    <FormalActivityDemoContext.Provider value={value}>
      {children}
    </FormalActivityDemoContext.Provider>
  );
}

export function useFormalActivityDemoSession() {
  const context = useContext(FormalActivityDemoContext);
  if (!context) {
    throw new Error(
      'useFormalActivityDemoSession must be used inside FormalActivityDemoProvider.',
    );
  }
  return context;
}
