import { Platform } from 'react-native';

import type { TranscriptSource } from '@/types/session.types';

export type Sprint1SpeechAlternative = {
  confidence: number | null;
  transcript: string;
};

export type Sprint1SpeechResult = {
  alternatives: readonly Sprint1SpeechAlternative[];
  confidence: number | null;
  source: TranscriptSource;
  transcript: string;
};

/**
 * Press-and-hold capture handle.
 *
 * `stop()` finalises the current recognition (Chrome flushes any pending
 * interim result into a final one) and resolves with everything heard while the
 * button was held. Holding the whole utterance window is what stops Chrome from
 * truncating `watermelon` to `water` or `strawberry` to `straw`.
 */
export type Sprint1CaptureHandle = {
  stop: () => Promise<Sprint1SpeechResult>;
  abort: () => void;
};

type CaptureManualFallbackOptions = {
  allowManualFallback?: boolean;
};

type WebSpeechAlternative = {
  confidence?: number;
  transcript?: string;
};

type WebSpeechResult = {
  [index: number]: WebSpeechAlternative;
  isFinal?: boolean;
  length: number;
};

type WebSpeechResultList = {
  [index: number]: WebSpeechResult;
  length: number;
};

type WebSpeechRecognitionEvent = {
  results: WebSpeechResultList;
};

type WebSpeechRecognition = {
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type WebSpeechRecognitionConstructor = new () => WebSpeechRecognition;

type SpeechWindow = Window & {
  SpeechRecognition?: WebSpeechRecognitionConstructor;
  webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
};

const PERMISSION_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture']);

function getWebSpeechConstructor(): WebSpeechRecognitionConstructor | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function collectAlternatives(result: WebSpeechResult | undefined): Sprint1SpeechAlternative[] {
  if (!result) return [];

  const alternatives: Sprint1SpeechAlternative[] = [];
  for (let index = 0; index < result.length; index += 1) {
    const alternative = result[index];
    const transcript = alternative?.transcript?.trim() ?? '';
    if (!transcript) continue;

    alternatives.push({
      confidence: typeof alternative.confidence === 'number' ? alternative.confidence : null,
      transcript,
    });
  }

  return alternatives;
}

type CaptureSnapshot = {
  finalTranscript: string;
  interimTranscript: string;
  alternatives: Sprint1SpeechAlternative[];
};

// The results list is cumulative in continuous mode, so we can recompute the
// whole snapshot on every event instead of tracking deltas.
function readEvent(event: WebSpeechRecognitionEvent): CaptureSnapshot {
  const { results } = event;
  const finalParts: string[] = [];
  const interimParts: string[] = [];
  const alternatives: Sprint1SpeechAlternative[] = [];

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    const resultAlternatives = collectAlternatives(result);
    const best = resultAlternatives[0];
    if (!best) continue;

    if (result.isFinal) {
      finalParts.push(best.transcript);
      alternatives.push(...resultAlternatives);
    } else {
      interimParts.push(best.transcript);
    }
  }

  return {
    finalTranscript: finalParts.join(' ').replace(/\s+/g, ' ').trim(),
    interimTranscript: interimParts.join(' ').replace(/\s+/g, ' ').trim(),
    alternatives,
  };
}

const EMPTY_SNAPSHOT: CaptureSnapshot = {
  finalTranscript: '',
  interimTranscript: '',
  alternatives: [],
};

function buildResult(snapshot: CaptureSnapshot): Sprint1SpeechResult {
  const transcript = snapshot.finalTranscript || snapshot.interimTranscript || '';
  const alternatives = snapshot.alternatives.length
    ? snapshot.alternatives
    : transcript
      ? [{ confidence: null, transcript }]
      : [];

  return {
    alternatives,
    confidence: alternatives[0]?.confidence ?? null,
    source: 'web',
    transcript,
  };
}

/**
 * Starts microphone capture immediately and returns a handle. Call `stop()` when
 * the child releases the button to finalise and read the transcript.
 */
export function startSprint1Capture(): Sprint1CaptureHandle {
  const Recognition = getWebSpeechConstructor();
  if (!Recognition) {
    const unavailable = new Error('Web Speech recognition is unavailable in this browser.');
    return {
      stop: () => Promise.reject(unavailable),
      abort: () => undefined,
    };
  }

  const recognition = new Recognition();
  let snapshot: CaptureSnapshot = EMPTY_SNAPSHOT;
  let permissionError: Error | null = null;
  let ended = false;
  let settled = false;
  let pendingResolve: ((result: Sprint1SpeechResult) => void) | null = null;
  let pendingReject: ((error: Error) => void) | null = null;

  const settlePending = () => {
    if (settled || (!pendingResolve && !pendingReject)) return;
    settled = true;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;

    if (permissionError) {
      pendingReject?.(permissionError);
    } else {
      pendingResolve?.(buildResult(snapshot));
    }

    pendingResolve = null;
    pendingReject = null;
  };

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 5;

  recognition.onresult = (event) => {
    snapshot = readEvent(event);
  };

  recognition.onerror = (event) => {
    // `no-speech`/`aborted` are non-fatal: resolve with whatever we heard.
    // Only a real permission/hardware failure rejects so the screen can show
    // the genuine "Microphone unavailable" error.
    if (event.error && PERMISSION_ERRORS.has(event.error)) {
      permissionError = new Error(
        'Microphone unavailable. Check the browser microphone permission and try again.',
      );
    }
  };

  recognition.onend = () => {
    ended = true;
    settlePending();
  };

  try {
    recognition.start();
  } catch (error) {
    permissionError = error instanceof Error ? error : new Error('Speech recognition failed to start.');
  }

  return {
    stop() {
      return new Promise<Sprint1SpeechResult>((resolve, reject) => {
        pendingResolve = resolve;
        pendingReject = reject;

        if (ended || permissionError) {
          settlePending();
          return;
        }

        try {
          recognition.stop();
        } catch {
          settlePending();
        }
      });
    },
    abort() {
      settled = true;
      pendingResolve = null;
      pendingReject = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // Ignore: aborting an already-stopped recognition is a no-op.
      }
    },
  };
}

/**
 * Dev-only typed transcript escape hatch. Surfaced exclusively behind
 * `?devControls=1` so the live demo never presents typing as the main path.
 */
export function captureManualFallback({
  allowManualFallback = false,
}: CaptureManualFallbackOptions = {}): Sprint1SpeechResult | null {
  if (!allowManualFallback || Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  const transcript = window.prompt('Dev speech fallback: type the child transcript.');
  const trimmed = transcript?.trim() ?? '';
  if (!trimmed) return null;

  return {
    alternatives: [{ confidence: null, transcript: trimmed }],
    confidence: null,
    source: 'manual',
    transcript: trimmed,
  };
}
