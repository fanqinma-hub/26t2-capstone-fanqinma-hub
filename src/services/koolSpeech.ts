import * as Speech from 'expo-speech';

const koolVoiceOptions: Speech.SpeechOptions = {
  language: 'en-AU',
  pitch: 1,
  rate: 0.84,
};

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

    Speech.speak(message, {
      ...koolVoiceOptions,
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
