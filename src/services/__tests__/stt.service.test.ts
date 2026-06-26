import { getSTTService, MockSTTAdapter } from '../stt.service';

describe('STT Service & Adapters', () => {
  describe('getSTTService Factory', () => {
    it('should return a MockSTTAdapter instance when useMock is true', () => {
      const service = getSTTService(true);
      expect(service).toBeInstanceOf(MockSTTAdapter);
    });
  });

  describe('MockSTTAdapter', () => {
    it('should return a transcript string after simulated network delay', async () => {
      const adapter = new MockSTTAdapter();
      const startTime = Date.now();

      const transcript = await adapter.transcribeAudio('file:///test-audio.m4a');
      const duration = Date.now() - startTime;

      expect(typeof transcript).toBe('string');
      expect(transcript.length).toBeGreaterThan(0);
      // Verify simulated network delay is at least 1 second (1000ms) minus a small CPU processing margin
      expect(duration).toBeGreaterThanOrEqual(950);
    });

    it('should throw an error if an empty or invalid URI is provided', async () => {
      const adapter = new MockSTTAdapter();
      await expect(adapter.transcribeAudio('')).rejects.toThrow(
        'MockSTTAdapter: Invalid or empty audio file URI provided.'
      );
    });
  });
});
