import { processChildUtterance } from '../voice-pipeline.service';
import { getSTTService } from '../stt.service';

jest.mock('../stt.service');

describe('Voice Pipeline Service', () => {
  const mockTranscribeAudio = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getSTTService as jest.Mock).mockReturnValue({
      transcribeAudio: mockTranscribeAudio,
    });
  });

  it('should successfully process a child utterance and compile a SpeechAttempt object', async () => {
    // Mock the STT service to return a successful transcript containing size word
    mockTranscribeAudio.mockResolvedValue('Look at the gigantic watermelon');

    const result = await processChildUtterance('file:///test-audio.m4a', 'prompt_1', false);

    expect(result).toBeDefined();
    expect(result.transcript).toBe('Look at the gigantic watermelon');
    expect(result.normalizedTranscript).toBe('look at the gigantic watermelon');
    expect(result.detectedSizeWords).toEqual(['gigantic']);
    expect(result.tier).toBe(2);
    expect(result.status).toBe('adjective_used');
    expect(result.promptId).toBe('prompt_1');
    expect(result.scaffoldUsed).toBe(false);
    expect(typeof result.timestamp).toBe('number');
    expect(result.confidence).toBe(1.0);
  });

  it('should propagate errors and throw if the STT service fails', async () => {
    // Mock the STT service to throw a network error
    mockTranscribeAudio.mockRejectedValue(new Error('Network error or invalid API key'));

    await expect(
      processChildUtterance('file:///test-audio.m4a', 'prompt_1', false)
    ).rejects.toThrow('VoicePipelineService error: Network error or invalid API key');
  });
});
