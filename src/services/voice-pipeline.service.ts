/**
 * @file voice-pipeline.service.ts
 * @description The main control pipeline for processing children's voice inputs.
 * Orchestrates Audio STT transcription and clinical grading rules, compiling the
 * finalized SpeechAttempt data transfer object.
 *
 * Compliance Guidelines (Dr. Marium Malik / PROJ-12):
 * - Clinical scoring of size adjectives strictly utilizes deterministic front-end rules (no ML model scoring).
 * - Full utterance transcripts (FULL utterance transcripts) are preserved as part of the SpeechAttempt payload for final NDIS clinical report generation.
 * - Underlying audio recording resources are completely unloaded/cleaned up upon completing a recording to prevent memory leaks.
 *
 * NOTE: The resulting SpeechAttempt output from this pipeline must be stored inside
 * the SessionContext. It serves as the single source of truth for Role 6 to generate
 * the final NDIS clinical report.
 *
 * This file is purely business logic and contains no UI rendering.
 *
 * Owner: Role 5 (STT & Scoring Lead)
 */

import { getSTTService } from './stt.service';
import { classifyTier } from '../utils/tier-classifier';
import type { SpeechAttempt } from '../types/scoring.types';

/**
 * Normalizes transcription text by lowe-casing, removing punctuation, and stripping whitespace.
 *
 * @param text Raw transcription.
 * @returns Cleaned normalized transcription string.
 */
function normalizeTranscriptText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Processes the child's recorded utterance.
 * Orchestrates the STT conversion, clinical grading analysis, and data packaging.
 *
 * @param audioUri The local file path URI of the audio recording.
 * @param promptId The unique identifier of the active prompt/activity question.
 * @param scaffoldUsed Indicates if the child requested a visual clue/scaffold prior to recording.
 * @returns A promise resolving to the fully assembled SpeechAttempt object.
 * @throws Error if STT fails, allowing the dialogue engine to execute fallback logic.
 */
export async function processChildUtterance(
  audioUri: string,
  promptId: string,
  scaffoldUsed: boolean
): Promise<SpeechAttempt> {
  try {
    // 1. Resolve the Speech-to-Text service.
    // Defaults to mock adapter unless EXPO_PUBLIC_USE_MOCK_STT is explicitly set to 'false'.
    const useMock = process.env.EXPO_PUBLIC_USE_MOCK_STT !== 'false';
    const sttService = getSTTService(useMock);

    // 2. Perform STT transcription to get full child utterance.
    const rawTranscript = await sttService.transcribeAudio(audioUri);

    // 3. Normalize transcription.
    const normalizedTranscript = normalizeTranscriptText(rawTranscript);

    // 4. Classify clinical tier and extract matched size adjectives.
    const classification = classifyTier(rawTranscript);

    // 5. Assemble and return the finalized SpeechAttempt object.
    const attempt: SpeechAttempt = {
      transcript: rawTranscript,
      normalizedTranscript,
      detectedSizeWords: classification.detectedWords,
      tier: classification.tier,
      status: classification.status,
      timestamp: Date.now(),
      promptId,
      confidence: 1.0, // STT confidence placeholder as mandated by the spec
      scaffoldUsed,
    };

    return attempt;
  } catch (err: any) {
    // Wrap and propagate error so that Role 4's dialogue state machine can capture it and transition to safe fallbacks.
    throw new Error(`VoicePipelineService error: ${err?.message || err}`);
  }
}
