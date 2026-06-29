import { Platform } from 'react-native';

/**
 * Lightweight microphone level meter used only to drive the "I can hear you"
 * waveform while the child holds the mic. Web-only (Web Audio API); a no-op
 * everywhere else. It is purely cosmetic and never blocks speech capture, so any
 * failure is swallowed silently.
 */
export type AudioLevelMeter = {
  start: () => Promise<void>;
  stop: () => void;
};

type WindowWithAudio = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

const NOOP_METER: AudioLevelMeter = {
  start: async () => undefined,
  stop: () => undefined,
};

export function createAudioLevelMeter(onLevel: (level: number) => void): AudioLevelMeter {
  if (
    Platform.OS !== 'web' ||
    typeof window === 'undefined' ||
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    return NOOP_METER;
  }

  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let rafId: number | null = null;
  let stopped = false;

  const stop = () => {
    stopped = true;
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (context && context.state !== 'closed') void context.close();
    context = null;
    onLevel(0);
  };

  const start = async () => {
    try {
      const win = window as WindowWithAudio;
      const AudioContextCtor = win.AudioContext ?? win.webkitAudioContext;
      if (!AudioContextCtor) return;

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stopped) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
        return;
      }

      context = new AudioContextCtor();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const samples = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (stopped) return;
        analyser.getByteTimeDomainData(samples);
        let sumSquares = 0;
        for (let index = 0; index < samples.length; index += 1) {
          const centered = (samples[index] - 128) / 128;
          sumSquares += centered * centered;
        }
        const rms = Math.sqrt(sumSquares / samples.length);
        // Amplify and clamp so normal speaking volume fills most of the meter.
        onLevel(Math.min(1, rms * 3.2));
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    } catch {
      stop();
    }
  };

  return { start, stop };
}
