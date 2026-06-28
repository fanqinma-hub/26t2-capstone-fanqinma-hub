import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export interface UseAudioRecorderResult {
  /** True when microphone is active and recording audio */
  isRecording: boolean;
  /** Current recording duration in milliseconds */
  recordingDuration: number;
  /** Stores any permission or hardware error message, null otherwise */
  error: string | null;
  /** Requests permissions if necessary and starts recording audio */
  startRecording: () => Promise<void>;
  /** Stops the recording session and returns the local file URI of the recorded audio, or null if failed */
  stopRecording: () => Promise<string | null>;
  /** Clears any active error state */
  clearError: () => void;
}

/**
 * @file use-audio-recorder.ts
 * @description Custom React Hook to manage local audio recording using Expo AV.
 * Handles microphone permissions, audio mode settings, active status tracking,
 * and ensures proper cleanup of hardware resources on unmount.
 *
 * Compliance Guidelines (Dr. Marium Malik / PROJ-12):
 * - Audio recording hardware resources are completely unloaded upon completion/unmount to prevent memory leaks.
 * - Full utterance transcripts are preserved for final NDIS clinical report generation.
 * - Clinical tier scoring utilizes deterministic front-end rules instead of ML models.
 *
 * This hook is pure logic and contains no UI components.
 *
 * Owner: Role 5 (STT & Scoring Lead)
 */
export function useAudioRecorder(): UseAudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to clear the duration interval timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Helper to start the duration interval timer
  const startTimer = () => {
    stopTimer();
    setRecordingDuration(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setRecordingDuration(Date.now() - startTime);
    }, 100);
  };

  const startRecording = async () => {
    try {
      setError(null);

      // 1. Check and request microphone permission
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        setError('Microphone permission was not granted.');
        return;
      }

      // 2. Configure audio mode for recording (critical for both iOS and Android)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 3. Clean up any leftover recording instance
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // Ignore failure to stop previous recording
        }
        recordingRef.current = null;
      }

      // 4. Create and start a new recording session
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      setError(err?.message || 'Failed to start audio recording.');
      setIsRecording(false);
      stopTimer();
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    stopTimer();
    setIsRecording(false);

    const recording = recordingRef.current;
    if (!recording) {
      return null;
    }

    try {
      // 1. Stop and unload recording resource
      await recording.stopAndUnloadAsync();

      // 2. Reset audio mode to prevent holding the microphone on active playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // 3. Extract the local file path URI
      const uri = recording.getURI();
      recordingRef.current = null;
      return uri;
    } catch (err: any) {
      setError(err?.message || 'Failed to stop audio recording.');
      recordingRef.current = null;
      return null;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Ensure active recording and hardware resources are released on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      const currentRecording = recordingRef.current;
      if (currentRecording) {
        currentRecording.stopAndUnloadAsync().catch((err) => {
          console.warn('Failed to stop and unload recording on unmount:', err);
        });
      }
    };
  }, []);

  return {
    isRecording,
    recordingDuration,
    error,
    startRecording,
    stopRecording,
    clearError,
  };
}
