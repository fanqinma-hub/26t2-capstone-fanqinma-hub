/**
 * @file mock-speech.adapter.test.ts
 * @description Unit tests for the MockSpeechAdapter.
 * Validates contract compliance: capability flag, start/stop lifecycle,
 * speak delivery, cancel/stopAll idempotency, and operation mismatch.
 *
 * Owner: Role 5 (STT & Scoring Lead)
 */
import { MockSpeechAdapter, createMockSpeechAdapter } from '../mock-speech.adapter';

describe('MockSpeechAdapter', () => {
  let adapter: MockSpeechAdapter;

  beforeEach(() => {
    adapter = new MockSpeechAdapter();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes capability = "mock"', () => {
    expect(adapter.capability).toBe('mock');
  });

  describe('startListening → stopListening lifecycle', () => {
    it('returns ok from startListening', async () => {
      const result = await adapter.startListening({
        operationId: 'op-1',
        locale: 'en-AU',
      });
      expect(result).toEqual({ ok: true, value: undefined });
    });

    it('returns a captured recognition result on stopListening', async () => {
      await adapter.startListening({ operationId: 'op-1', locale: 'en-AU' });
      const result = await adapter.stopListening('op-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.operationId).toBe('op-1');
        expect(result.value.source).toBe('mock');
        expect(result.value.status).toBe('captured');
        expect(typeof result.value.transcript).toBe('string');
        expect(result.value.transcript.length).toBeGreaterThan(0);
        expect(typeof result.value.normalizedTranscript).toBe('string');
        expect(result.value.confidence).toBe(0.92);
      }
    });

    it('calls onAudioLevel callback during listening', async () => {
      const onAudioLevel = jest.fn();
      await adapter.startListening({
        operationId: 'op-2',
        locale: 'en-AU',
        onAudioLevel,
      });

      // Advance timers to trigger audio level callbacks
      jest.advanceTimersByTime(500);
      expect(onAudioLevel).toHaveBeenCalled();
      const levels = onAudioLevel.mock.calls.map((c: any[]) => c[0]);
      levels.forEach((level: number) => {
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(1);
      });

      await adapter.stopListening('op-2');
    });

    it('calls onPartialTranscript callback during listening', async () => {
      const onPartialTranscript = jest.fn();
      await adapter.startListening({
        operationId: 'op-3',
        locale: 'en-AU',
        onPartialTranscript,
      });

      // Advance timers to trigger partial transcript callbacks
      jest.advanceTimersByTime(3000);
      expect(onPartialTranscript).toHaveBeenCalled();
      // Each call should have progressively more words
      const partials = onPartialTranscript.mock.calls.map((c: any[]) => c[0]);
      for (let i = 1; i < partials.length; i++) {
        expect(partials[i].length).toBeGreaterThanOrEqual(partials[i - 1].length);
      }

      await adapter.stopListening('op-3');
    });
  });

  describe('speak', () => {
    it('returns a delivered result after simulated TTS', async () => {
      const speakPromise = adapter.speak({
        operationId: 'op-speak-1',
        text: 'Hello there',
        kind: 'prompt',
        words: [],
        primaryWords: [],
      });

      // Advance past the simulated TTS duration
      jest.advanceTimersByTime(5000);
      const result = await speakPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.operationId).toBe('op-speak-1');
        expect(result.value.kind).toBe('prompt');
        expect(result.value.text).toBe('Hello there');
        expect(result.value.status).toBe('delivered');
        expect(result.value.errorCode).toBeNull();
        expect(result.value.completedAt).toBeTruthy();
      }
    });
  });

  describe('operation mismatch', () => {
    it('returns failure on stopListening with wrong operationId', async () => {
      await adapter.startListening({ operationId: 'op-a', locale: 'en-AU' });
      const result = await adapter.stopListening('op-wrong');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.failure.code).toBe('cancelled');
      }
    });
  });

  describe('cancel and stopAll idempotency', () => {
    it('cancel does not throw when no operation is active', async () => {
      await expect(adapter.cancel('non-existent')).resolves.toBeUndefined();
    });

    it('cancel without operationId clears active operation', async () => {
      await adapter.startListening({ operationId: 'op-c', locale: 'en-AU' });
      await expect(adapter.cancel()).resolves.toBeUndefined();
      // After cancel, stopListening should fail
      const result = await adapter.stopListening('op-c');
      expect(result.ok).toBe(false);
    });

    it('stopAll does not throw when nothing is active', async () => {
      await expect(adapter.stopAll()).resolves.toBeUndefined();
    });

    it('stopAll clears active listening', async () => {
      await adapter.startListening({ operationId: 'op-s', locale: 'en-AU' });
      await expect(adapter.stopAll()).resolves.toBeUndefined();
      const result = await adapter.stopListening('op-s');
      expect(result.ok).toBe(false);
    });
  });

  describe('createMockSpeechAdapter factory', () => {
    it('returns a SpeechAdapter with capability "mock"', () => {
      const factoryAdapter = createMockSpeechAdapter();
      expect(factoryAdapter.capability).toBe('mock');
    });
  });
});
