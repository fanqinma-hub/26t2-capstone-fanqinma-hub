import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import type {
  SpeechAdapter,
  SpeechOutcome,
  RecognitionResult,
  DeliveryResult,
  SpeechOperationId,
  DeliveryKind,
  AzureSpeechRuntimeConfig,
  SpeechAdapterInitResult,
} from '../../types/speech.types';
import type { SizeWordKeyword, TargetAdjective } from '../../types/activity.types';

export class AzureSpeechAdapter implements SpeechAdapter {
  readonly capability = 'live-azure';

  private speechConfig: SpeechSDK.SpeechConfig;
  private currentRecognizer: SpeechSDK.SpeechRecognizer | null = null;
  private currentSynthesizer: SpeechSDK.SpeechSynthesizer | null = null;
  private activeOperationId: SpeechOperationId | null = null;

  // Web Audio resources for live microphone levels
  private audioStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private audioLevelInterval: any = null;

  // Settle transcript storage
  private currentTranscript = '';

  constructor(config: AzureSpeechRuntimeConfig) {
    this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(config.subscriptionKey, config.region);
    // Custom child-friendly, less robotic en-AU female voice:
    this.speechConfig.speechSynthesisVoiceName = 'en-AU-NatashaNeural';
  }

  async startListening(input: {
    operationId: SpeechOperationId;
    locale: 'en-AU';
    onAudioLevel?(level: number): void;
    onPartialTranscript?(transcript: string): void;
  }): Promise<SpeechOutcome<void>> {
    try {
      await this.cleanupListening();

      this.activeOperationId = input.operationId;
      this.currentTranscript = '';

      // Initialize Web Analyser for Audio Level Meter
      if (input.onAudioLevel) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
        const source = this.audioCtx.createMediaStreamSource(this.audioStream);
        const analyser = this.audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        this.audioLevelInterval = setInterval(() => {
          if (!analyser || !this.audioCtx) return;
          analyser.getByteTimeDomainData(dataArray);

          // Calculate Root Mean Square (RMS) volume level
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const val = (dataArray[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / bufferLength);
          // Scale and clamp value between 0.0 and 1.0
          const level = Math.max(0, Math.min(1.0, rms * 4));
          input.onAudioLevel?.(level);
        }, 100);
      }

      // Setup Speech SDK Recognizer
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, audioConfig);

      recognizer.recognizing = (s, e) => {
        if (this.activeOperationId === input.operationId) {
          input.onPartialTranscript?.(e.result.text);
        }
      };

      recognizer.recognized = (s, e) => {
        if (this.activeOperationId === input.operationId && e.result.text) {
          this.currentTranscript += ' ' + e.result.text;
        }
      };

      this.currentRecognizer = recognizer;

      // Start asynchronous recognition
      await new Promise<void>((resolve, reject) => {
        recognizer.startContinuousRecognitionAsync(
          () => resolve(),
          (err) => reject(new Error(err))
        );
      });

      return { ok: true, value: undefined };
    } catch (err: any) {
      await this.cleanupListening();
      return {
        ok: false,
        failure: {
          operationId: input.operationId,
          code: err?.name === 'NotAllowedError' ? 'permission_denied' : 'service',
          message: err?.message || 'Failed to start Azure recognition.',
        },
      };
    }
  }

  async stopListening(operationId: SpeechOperationId): Promise<SpeechOutcome<RecognitionResult>> {
    if (this.activeOperationId !== operationId || !this.currentRecognizer) {
      return {
        ok: false,
        failure: {
          operationId,
          code: 'cancelled',
          message: 'Operation mismatched or not listening.',
        },
      };
    }

    const recognizer = this.currentRecognizer;
    this.currentRecognizer = null;
    this.activeOperationId = null;

    // Stop continuous recognition
    try {
      await new Promise<void>((resolve, reject) => {
        recognizer.stopContinuousRecognitionAsync(
          () => resolve(),
          (err) => reject(new Error(err))
        );
      });
      recognizer.close();
    } catch (e) {
      // Ignore intermediate close errors
    }

    await this.cleanupListening();

    const finalTranscript = this.currentTranscript.trim();

    return {
      ok: true,
      value: {
        operationId,
        transcript: finalTranscript,
        normalizedTranscript: finalTranscript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ''),
        confidence: 0.95,
        status: finalTranscript ? 'captured' : 'no_match',
        source: 'azure',
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
    try {
      this.cancelSynthesizer();
      this.activeOperationId = input.operationId;

      // Create browser-native speaker output synthesizer
      const synthesizer = new SpeechSDK.SpeechSynthesizer(this.speechConfig, undefined as any);
      this.currentSynthesizer = synthesizer;

      const result = await new Promise<SpeechSDK.SpeechSynthesisResult>((resolve, reject) => {
        synthesizer.speakTextAsync(
          input.text,
          (res) => resolve(res),
          (err) => reject(new Error(err))
        );
      });

      this.cancelSynthesizer();

      if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
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
      } else {
        return {
          ok: false,
          failure: {
            operationId: input.operationId,
            code: 'service',
            message: `Speech synthesis failed with reason: ${result.reason}`,
          },
        };
      }
    } catch (err: any) {
      this.cancelSynthesizer();
      return {
        ok: false,
        failure: {
          operationId: input.operationId,
          code: 'service',
          message: err?.message || 'Azure speech synthesis failed.',
        },
      };
    }
  }

  async cancel(operationId?: SpeechOperationId): Promise<void> {
    if (!operationId || this.activeOperationId === operationId) {
      if (this.currentRecognizer) {
        try {
          this.currentRecognizer.stopContinuousRecognitionAsync();
          this.currentRecognizer.close();
        } catch (e) {}
        this.currentRecognizer = null;
      }
      this.cancelSynthesizer();
      await this.cleanupListening();
      this.activeOperationId = null;
    }
  }

  async stopAll(): Promise<void> {
    if (this.currentRecognizer) {
      try {
        this.currentRecognizer.stopContinuousRecognitionAsync();
        this.currentRecognizer.close();
      } catch (e) {}
      this.currentRecognizer = null;
    }
    this.cancelSynthesizer();
    await this.cleanupListening();
    this.activeOperationId = null;
  }

  private cancelSynthesizer() {
    if (this.currentSynthesizer) {
      try {
        this.currentSynthesizer.close();
      } catch (e) {}
      this.currentSynthesizer = null;
    }
  }

  private async cleanupListening() {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    if (this.audioCtx) {
      try {
        await this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
  }
}

export const createLiveAzureSpeechAdapter = (config: AzureSpeechRuntimeConfig): SpeechAdapterInitResult => {
  if (!config.subscriptionKey || !config.region) {
    return {
      ok: false,
      code: 'configuration',
      message: 'Azure Speech subscription key or region is missing.',
    };
  }
  try {
    const adapter = new AzureSpeechAdapter(config);
    return { ok: true, adapter };
  } catch (err: any) {
    return {
      ok: false,
      code: 'configuration',
      message: err?.message || 'Failed to initialize Azure Speech adapter.',
    };
  }
};
