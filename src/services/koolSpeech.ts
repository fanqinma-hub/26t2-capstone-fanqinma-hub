import * as Speech from 'expo-speech';

const koolVoiceOptions: Speech.SpeechOptions = {
  language: 'en-AU',
  pitch: 1,
  rate: 0.84,
};

let speechRequestId = 0;

/** Local, replaceable TTS used only by the Sprint 1 visual demo. */
export async function speakKoolPrompt(message: string) {
  if (!message.trim()) return false;

  const requestId = ++speechRequestId;

  try {
    await Speech.stop();
    if (requestId !== speechRequestId) return false;

    Speech.speak(message, koolVoiceOptions);
    return true;
  } catch {
    // The visible dialogue bubble is the accessible fallback when a platform
    // cannot provide local speech.
    return false;
  }
}

export function stopKoolSpeech() {
  speechRequestId += 1;
  void Speech.stop().catch(() => undefined);
}
