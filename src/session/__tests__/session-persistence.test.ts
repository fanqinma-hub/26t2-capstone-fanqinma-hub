import { createMediumParticipationSession } from '@/fixtures/sprint2-session.fixtures';

import {
  clearPersistedSession,
  deserializeSession,
  hydrateSession,
  persistSession,
  readNextUnitAttemptNumber,
} from '../session-persistence';
import {
  ATTEMPT_COUNTER_STORAGE_KEY,
  createAsyncStorageSessionStorage,
  createMemorySessionStorage,
  SESSION_STORAGE_KEY,
  type SessionStorage,
} from '../session-storage';

describe('session persistence and reset policy', () => {
  it('hydrates no stored session as ready with null', async () => {
    await expect(hydrateSession(createMemorySessionStorage())).resolves.toEqual({
      hydrationStatus: 'ready',
      hydrationError: null,
      session: null,
    });
  });

  it('round-trips a versioned session across a reload', async () => {
    const storage = createMemorySessionStorage();
    const session = createMediumParticipationSession();
    await persistSession(storage, session);

    await expect(hydrateSession(storage)).resolves.toEqual({
      hydrationStatus: 'ready',
      hydrationError: null,
      session,
    });
    expect(deserializeSession(JSON.stringify(session))).toEqual(session);
  });

  it('discards invalid stored data without crashing or resetting the counter', async () => {
    const storage = createMemorySessionStorage({
      [SESSION_STORAGE_KEY]: '{not valid JSON',
      [ATTEMPT_COUNTER_STORAGE_KEY]: '7',
    });

    await expect(hydrateSession(storage)).resolves.toMatchObject({
      hydrationStatus: 'ready',
      session: null,
    });
    await expect(storage.getItem(SESSION_STORAGE_KEY)).resolves.toBeNull();
    await expect(readNextUnitAttemptNumber(storage)).resolves.toBe(8);
  });

  it('keeps unit attempt numbers monotonic when current progress is reset', async () => {
    const storage = createMemorySessionStorage();
    expect(await readNextUnitAttemptNumber(storage)).toBe(1);
    await persistSession(storage, createMediumParticipationSession());
    await clearPersistedSession(storage);

    await expect(storage.getItem(SESSION_STORAGE_KEY)).resolves.toBeNull();
    expect(await readNextUnitAttemptNumber(storage)).toBe(2);
  });

  it('reports storage failure as hydration error', async () => {
    const failedStorage: SessionStorage = {
      getItem: async () => {
        throw new Error('storage unavailable');
      },
      setItem: async () => undefined,
      removeItem: async () => undefined,
    };

    await expect(hydrateSession(failedStorage)).resolves.toEqual({
      hydrationStatus: 'error',
      hydrationError: 'storage unavailable',
      session: null,
    });
  });

  it('adapts the AsyncStorage contract without changing storage keys', async () => {
    const values = new Map<string, string>();
    const asyncStorage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };
    const storage = createAsyncStorageSessionStorage(asyncStorage);

    await persistSession(storage, createMediumParticipationSession());
    await clearPersistedSession(storage);

    expect(asyncStorage.setItem).toHaveBeenCalledWith(
      SESSION_STORAGE_KEY,
      expect.any(String),
    );
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(SESSION_STORAGE_KEY);
  });
});
