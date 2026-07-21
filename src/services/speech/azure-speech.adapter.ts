import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import type {
  SpeechAdapter,
  SpeechOutcome,
  RecognitionResult,
  DeliveryResult,
  SpeechOperationId,
  SpeechErrorCode,
  DeliveryKind,
  AzureSpeechRuntimeConfig,
  SpeechAdapterInitResult,
} from '../../types/speech.types';
import type { SizeWordKeyword, TargetAdjective } from '../../types/activity.types';

// ── Child-friendly TTS voice parameters ──────────────────────────────────────
// Tuned for a 6–8 year-old: slightly slower rate, warmer pitch, clear volume.
// Matches the Sprint 1 koolSpeech.ts style (rate: 0.9, pitch: 1.1).
const KOOL_VOICE_NAME = 'en-AU-NatashaNeural';
const KOOL_TTS_RATE = '0.9';      // 90% of normal speed
const KOOL_TTS_PITCH = '+10%';    // slightly higher for warmth
const KOOL_TTS_VOLUME = 'loud';   // clear for children

/**
 * Builds an SSML document for Azure Neural TTS with fixed prosody.
 * XML-escapes the text to prevent injection from user-facing content.
 */
function buildKoolSsml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  return [
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-AU">',
    `  <voice name="${KOOL_VOICE_NAME}">`,
    `    <prosody rate="${KOOL_TTS_RATE}" pitch="${KOOL_TTS_PITCH}" volume="${KOOL_TTS_VOLUME}">`,
    `      ${escaped}`,
    '    </prosody>',
    '  </voice>',
    '</speak>',
  ].join('\n');
}

/**
 * Maps a raw Azure SDK / browser error to the contract SpeechErrorCode.
 * Provides finer granularity than the previous inline check.
 */
function mapAzureError(err: any): SpeechErrorCode {
  if (err?.name === 'NotAllowedError') return 'permission_denied';
  if (err?.name === 'NotFoundError') return 'unsupported';
  const msg = (err?.message ?? '').toLowerCase();
  if (msg.includes('network') || msg.includes('websocket') || msg.includes('connection'))
    return 'network';
  if (msg.includes('timeout') || msg.includes('timed out'))
    return 'timeout';
  if (msg.includes('cancelled') || msg.includes('canceled'))
    return 'cancelled';
  return 'service';
}

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

  // Settle transcript and confidence storage
  private currentTranscript = '';
  private lastConfidence: number | null = null;

  constructor(config: AzureSpeechRuntimeConfig) {
    this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(config.subscriptionKey, config.region);
    // STT: explicit en-AU locale for Australian English child speech
    this.speechConfig.speechRecognitionLanguage = 'en-AU';
    // TTS: child-friendly en-AU Neural voice (SSML controls rate/pitch/volume)
    this.speechConfig.speechSynthesisVoiceName = KOOL_VOICE_NAME;
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
      this.lastConfidence = null;

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

          // Extract real confidence from Azure SDK JSON response
          try {
            const jsonStr = e.result.properties?.getProperty(
              SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult,
            );
            if (jsonStr) {
              const parsed = JSON.parse(jsonStr);
              const bestConfidence = parsed?.NBest?.[0]?.Confidence;
              if (typeof bestConfidence === 'number') {
                this.lastConfidence = bestConfidence;
              }
            }
          } catch {
            // Confidence extraction failed — leave previous value
          }
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
          code: mapAzureError(err),
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
        confidence: this.lastConfidence,
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

      // Use SSML for precise control over rate, pitch, and volume
      const ssml = buildKoolSsml(input.text);
      const result = await new Promise<SpeechSDK.SpeechSynthesisResult>((resolve, reject) => {
        synthesizer.speakSsmlAsync(
          ssml,
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
          code: mapAzureError(err),
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
