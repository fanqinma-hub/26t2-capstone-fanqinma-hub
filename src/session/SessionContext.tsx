import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  SessionContextValue,
  SessionEvent,
  SessionState,
  SessionStoreState,
} from '@/types/session.types';

import {
  clearPersistedSession,
  hydrateSession,
  persistSession,
  readNextUnitAttemptNumber,
} from './session-persistence';
import {
  createSessionState,
  reduceSessionEvent,
  SessionEventError,
} from './session-reducer';
import {
  createDefaultSessionStorage,
  type SessionStorage,
} from './session-storage';

const loadingStore: SessionStoreState = {
  hydrationStatus: 'loading',
  hydrationError: null,
  session: null,
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = PropsWithChildren<{
  storage?: SessionStorage;
}>;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown session persistence error';
}

export function SessionProvider({ children, storage }: SessionProviderProps) {
  const resolvedStorage = useMemo(
    () => storage ?? createDefaultSessionStorage(),
    [storage],
  );
  const [store, setStore] = useState<SessionStoreState>(loadingStore);
  const storeRef = useRef(store);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);

  const publishStore = useCallback((next: SessionStoreState) => {
    storeRef.current = next;
    if (mountedRef.current) setStore(next);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    publishStore(loadingStore);
    void hydrateSession(resolvedStorage).then((hydrated) => {
      if (!cancelled) publishStore(hydrated);
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [publishStore, resolvedStorage]);

  const applyEvent = useCallback(
    async (event: SessionEvent) => {
      const currentStore = storeRef.current;

      if (event.type === 'SESSION_RESET') {
        try {
          await clearPersistedSession(resolvedStorage);
          publishStore({
            hydrationStatus: 'ready',
            hydrationError: null,
            session: null,
          });
          return;
        } catch (error) {
          const next = {
            hydrationStatus: 'error' as const,
            hydrationError: errorMessage(error),
            session: currentStore.session,
          };
          publishStore(next);
          throw error;
        }
      }

      if (currentStore.hydrationStatus !== 'ready') {
        throw new Error(
          `Cannot dispatch ${event.type} while session hydration is ${currentStore.hydrationStatus}`,
        );
      }

      let nextSession: SessionState | null;
      try {
        if (event.type === 'UNIT_STARTED') {
          const attemptNumber = await readNextUnitAttemptNumber(resolvedStorage);
          nextSession = createSessionState(event.payload, attemptNumber);
        } else {
          nextSession = reduceSessionEvent(currentStore.session, event);
        }

        if (nextSession) {
          await persistSession(resolvedStorage, nextSession);
        } else {
          await clearPersistedSession(resolvedStorage);
        }
        publishStore({
          hydrationStatus: 'ready',
          hydrationError: null,
          session: nextSession,
        });
      } catch (error) {
        if (error instanceof SessionEventError) {
          throw error;
        }
        publishStore({
          hydrationStatus: 'error',
          hydrationError: errorMessage(error),
          session: currentStore.session,
        });
        throw error;
      }
    },
    [publishStore, resolvedStorage],
  );

  const dispatch = useCallback(
    (event: SessionEvent) => {
      const pending = queueRef.current.then(() => applyEvent(event));
      queueRef.current = pending.catch(() => undefined);
      return pending;
    },
    [applyEvent],
  );

  const value = useMemo<SessionContextValue>(() => ({ store, dispatch }), [dispatch, store]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider.');
  return context;
}
