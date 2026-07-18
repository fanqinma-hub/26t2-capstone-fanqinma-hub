import type {
  SpeechAdapter,
  SpeechOutcome,
  RecognitionResult,
  DeliveryResult,
  SpeechOperationId,
  DeliveryKind,
} from '../../types/speech.types';
import type { SizeWordKeyword, TargetAdjective } from '../../types/activity.types';

export class MockSpeechAdapter implements SpeechAdapter {
  readonly capability = 'mock';

  private activeOperationId: SpeechOperationId | null = null;
  private partialIntervalId: any = null;
  private audioLevelIntervalId: any = null;

  private readonly mockSentences = [
    'Look at the gigantic watermelon',
    'It is a small strawberry',
    'I see a big balloon',
    'There is a tiny cup on the table',
    'The elephant is huge',
    'This is a medium pumpkin',
    'it is gigannick',
    'Look at the teemy bug',
    'no words',
  ];

  async startListening(input: {
    operationId: SpeechOperationId;
    locale: 'en-AU';
    onAudioLevel?(level: number): void;
    onPartialTranscript?(transcript: string): void;
  }): Promise<SpeechOutcome<void>> {
    this.cleanupListening();

    this.activeOperationId = input.operationId;

    // Simulate audio level pulse
    if (input.onAudioLevel) {
      let levelDirection = 1;
      let currentLevel = 0.1;
      this.audioLevelIntervalId = setInterval(() => {
        currentLevel += 0.15 * levelDirection;
        if (currentLevel >= 0.9) {
          levelDirection = -1;
        } else if (currentLevel <= 0.1) {
          levelDirection = 1;
        }
        input.onAudioLevel?.(Math.max(0, Math.min(1, currentLevel)));
      }, 150);
    }

    // Simulate partial transcript arrival
    if (input.onPartialTranscript) {
      const targetSentence = this.getRandomSentence();
      const words = targetSentence.split(' ');
      let currentWordIndex = 0;
      this.partialIntervalId = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentWordIndex++;
          const partial = words.slice(0, currentWordIndex).join(' ');
          input.onPartialTranscript?.(partial);
        } else {
          clearInterval(this.partialIntervalId);
          this.partialIntervalId = null;
        }
      }, 600);
    }

    return { ok: true, value: undefined };
  }

  async stopListening(operationId: SpeechOperationId): Promise<SpeechOutcome<RecognitionResult>> {
    if (this.activeOperationId !== operationId) {
      return {
        ok: false,
        failure: {
          operationId,
          code: 'cancelled',
          message: 'Operation was cancelled or mismatched.',
        },
      };
    }

    this.cleanupListening();

    // Settle with a transcript
    const transcript = this.getRandomSentence();
    const cleanTranscript = transcript.toLowerCase().trim();

    return {
      ok: true,
      value: {
        operationId,
        transcript,
        normalizedTranscript: cleanTranscript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ''),
        confidence: 0.92,
        status: cleanTranscript ? 'captured' : 'no_match',
        source: 'mock',
      },
    };
  }

  async speak(input: {
    operationId: SpeechOperationId;
    text: string;
    kind: DeliveryKind;
    words: readonly SizeWordKeyword[];
    primaryWords: readonly TargetAdjective[];
  }): Promise<SpeechOutcome<DeliveryResult>> {
    this.activeOperationId = input.operationId;

    // Simulate TTS synthesis duration based on word count
    const wordCount = input.text.split(/\s+/).length;
    const playDuration = Math.max(1000, wordCount * 250);

    await new Promise((resolve) => setTimeout(resolve, playDuration));

    if (this.activeOperationId !== input.operationId) {
      return {
        ok: false,
        failure: {
          operationId: input.operationId,
          code: 'cancelled',
          message: 'Speech synthesis was interrupted.',
        },
      };
    }

    return {
      ok: true,
      value: {
        operationId: input.operationId,
        kind: input.kind,
        text: input.text,
        words: input.words,
        primaryWords: input.primaryWords,
        status: 'delivered',
        errorCode: null,
        completedAt: new Date().toISOString(),
      },
    };
  }

  async cancel(operationId?: SpeechOperationId): Promise<void> {
    if (!operationId || this.activeOperationId === operationId) {
      this.cleanupListening();
      this.activeOperationId = null;
    }
  }

  async stopAll(): Promise<void> {
    this.cleanupListening();
    this.activeOperationId = null;
  }

  private cleanupListening() {
    if (this.partialIntervalId) {
      clearInterval(this.partialIntervalId);
      this.partialIntervalId = null;
    }
    if (this.audioLevelIntervalId) {
      clearInterval(this.audioLevelIntervalId);
      this.audioLevelIntervalId = null;
    }
  }

  private getRandomSentence(): string {
    const idx = Math.floor(Math.random() * this.mockSentences.length);
    return this.mockSentences[idx];
  }
}

export const createMockSpeechAdapter = (): SpeechAdapter => {
  return new MockSpeechAdapter();
};
