import * as Speech from 'expo-speech';

// Tuned for a 6–8 y/o: a touch slower than natural and a slightly higher pitch
// reads as warm and friendly rather than robotic.
const koolVoiceOptions: Speech.SpeechOptions = {
  language: 'en-AU',
  pitch: 1.1,
  rate: 0.9,
};

// Preferred natural voices, best first. We match loosely (case-insensitive
// substring) against whatever the OS/browser exposes and fall back gracefully.
const PREFERRED_VOICE_NAMES = [
  'karen', // en-AU (Apple)
  'catherine', // en-AU (Apple, enhanced)
  'matilda', // en-AU
  'google uk english female',
  'libby', // en-GB (Microsoft natural)
  'sonia', // en-GB (Microsoft natural)
  'serena',
  'fiona',
  'tessa',
  'samantha', // en-US (Apple)
  'aria', // en-US (Microsoft natural)
  'jenny', // en-US (Microsoft natural)
  'google us english',
];

let cachedVoiceIdentifier: string | null | undefined;
let voiceLookupPromise: Promise<string | null> | null = null;

function scoreVoice(voice: Speech.Voice): number {
  const language = (voice.language ?? '').toLowerCase();
  if (!language.startsWith('en')) return -1;

  let score = 0;
  if (language.startsWith('en-au')) score += 6;
  else if (language.startsWith('en-gb')) score += 4;
  else if (language.startsWith('en-us')) score += 3;
  else score += 1;

  if (voice.quality === Speech.VoiceQuality.Enhanced) score += 5;

  const name = (voice.name ?? '').toLowerCase();
  const preferredIndex = PREFERRED_VOICE_NAMES.findIndex((candidate) => name.includes(candidate));
  if (preferredIndex >= 0) score += 10 - preferredIndex;
  if (/(female|woman)/.test(name)) score += 2;
  if (/(natural|neural|premium|enhanced)/.test(name)) score += 2;

  return score;
}

async function resolvePreferredVoice(): Promise<string | null> {
  if (cachedVoiceIdentifier !== undefined) return cachedVoiceIdentifier;
  if (voiceLookupPromise) return voiceLookupPromise;

  voiceLookupPromise = (async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (!voices?.length) {
        // Web voices can load late; leave unresolved so we retry next time.
        return null;
      }

      let best: Speech.Voice | null = null;
      let bestScore = 0;
      for (const voice of voices) {
        const score = scoreVoice(voice);
        if (score > bestScore) {
          bestScore = score;
          best = voice;
        }
      }

      cachedVoiceIdentifier = best?.identifier ?? null;
      return cachedVoiceIdentifier;
    } catch {
      return null;
    } finally {
      voiceLookupPromise = null;
    }
  })();

  return voiceLookupPromise;
}

/** Warm up voice selection so the first spoken line already uses a good voice. */
export function primeKoolVoice() {
  void resolvePreferredVoice();
}

let speechRequestId = 0;

type SpeakKoolPromptOptions = {
  /**
   * Called when the current Kool speech finishes normally.
   * The activity can use this to resume the silence timer.
   */
  onDone?: () => void;

  /**
   * Called when local TTS fails.
   * The visible dialogue bubble remains the fallback.
   */
  onError?: () => void;
};

/** Local, replaceable TTS used only by the Sprint 1 visual demo. */
export async function speakKoolPrompt(
  message: string,
  options: SpeakKoolPromptOptions = {},
) {
  if (!message.trim()) return false;

  const requestId = ++speechRequestId;
  let hasFinished = false;

  const finishCurrentSpeech = () => {
    if (hasFinished) return;
    if (requestId !== speechRequestId) return;

    hasFinished = true;
    options.onDone?.();
  };

  const failCurrentSpeech = () => {
    if (hasFinished) return;
    if (requestId !== speechRequestId) return;

    hasFinished = true;

    options.onError?.();

    // If no explicit error handler is provided, still continue the flow.
    if (!options.onError) {
      options.onDone?.();
    }
  };

  try {
    await Speech.stop();

    if (requestId !== speechRequestId) return false;

    const voiceIdentifier = await resolvePreferredVoice();

    if (requestId !== speechRequestId) return false;

    Speech.speak(message, {
      ...koolVoiceOptions,
      ...(voiceIdentifier ? { voice: voiceIdentifier } : {}),
      onDone: finishCurrentSpeech,
      onStopped: finishCurrentSpeech,
      onError: failCurrentSpeech,
    });

    return true;
  } catch {
    failCurrentSpeech();
    return false;
  }
}

export function stopKoolSpeech() {
  speechRequestId += 1;
  void Speech.stop().catch(() => undefined);
}
