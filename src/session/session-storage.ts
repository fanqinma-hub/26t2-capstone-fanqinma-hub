export const SESSION_STORAGE_KEY = '@funwattle/size-words/session/v1';
export const ATTEMPT_COUNTER_STORAGE_KEY =
  '@funwattle/size-words/attempt-counter/v1';

/** The subset shared by AsyncStorage and browser localStorage wrappers. */
export interface SessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
}

/**
 * Role 1 can pass the installed AsyncStorage 2.2.0 module through this adapter
 * without Role 3 owning package.json or the lockfile.
 */
export function createAsyncStorageSessionStorage(
  asyncStorage: AsyncStorageLike,
): SessionStorage {
  return {
    getItem: (key) => asyncStorage.getItem(key),
    setItem: async (key, value) => {
      await asyncStorage.setItem(key, value);
    },
    removeItem: async (key) => {
      await asyncStorage.removeItem(key);
    },
  };
}

export function createMemorySessionStorage(
  seed: Readonly<Record<string, string>> = {},
): SessionStorage {
  const values = new Map(Object.entries(seed));
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
}

function createBrowserSessionStorage(): SessionStorage | null {
  if (typeof globalThis.localStorage === 'undefined') return null;
  return {
    getItem: async (key) => globalThis.localStorage.getItem(key),
    setItem: async (key, value) => {
      globalThis.localStorage.setItem(key, value);
    },
    removeItem: async (key) => {
      globalThis.localStorage.removeItem(key);
    },
  };
}

/**
 * Docker Chrome persists immediately through localStorage. Native integration
 * supplies AsyncStorage through createAsyncStorageSessionStorage once Role 1's
 * dependency baseline is present.
 */
export function createDefaultSessionStorage(): SessionStorage {
  return createBrowserSessionStorage() ?? createMemorySessionStorage();
}
