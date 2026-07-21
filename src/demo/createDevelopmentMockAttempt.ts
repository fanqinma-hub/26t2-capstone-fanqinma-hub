import type { ActivityId, ActivityPromptDefinition } from '@/types/activity.types';
import type { SpeechAttempt } from '@/types/session.types';

import type { Activity1DemoOutcome } from './useActivity1DemoFlow';

type CreateDevelopmentMockAttemptOptions = {
  activityId: ActivityId;
  id: string;
  outcome: Activity1DemoOutcome;
  prompt: ActivityPromptDefinition;
  scaffoldUsed: boolean;
  timestamp: string;
};

function normaliseTranscript(transcript: string) {
  return transcript.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Produces a pre-scored development fixture after the demo microphone resolves.
 *
 * This is not speech recognition or the production tier classifier. Role 5 can
 * replace it with the real voice/STT scoring path without changing SessionState.
 */
export function createDevelopmentMockAttempt({
  activityId,
  id,
  outcome,
  prompt,
  scaffoldUsed,
  timestamp,
}: CreateDevelopmentMockAttemptOptions): SpeechAttempt {
  if (outcome === 'retry') {
    return {
      id,
      activityId,
      promptId: prompt.id,
      promptText: prompt.promptText,
      transcript: '',
      normalizedTranscript: '',
      confidence: null,
      source: 'mock',
      status: 'no_match',
      errorCode: 'no_match',
      tier: null,
      detectedKeywords: [],
      detectedPrimaryWords: [],
      isSpontaneous: !scaffoldUsed,
      scaffoldStage: scaffoldUsed ? 2 : 0,
      createdAt: timestamp,
    };
  }

  const transcript =
    prompt.acceptedExamples.tier2[0] ??
    prompt.acceptedExamples.tier3[0] ??
    prompt.recastText;
  const targetAdjective = prompt.targetAdjectives[0] ?? null;

  return {
    id,
    activityId,
    promptId: prompt.id,
    promptText: prompt.promptText,
    transcript,
    normalizedTranscript: normaliseTranscript(transcript),
    confidence: 0.98,
    source: 'mock',
    status: 'mocked',
    errorCode: null,
    tier: targetAdjective ? 'adjective_used' : 'noun_only',
    detectedKeywords: targetAdjective ? [targetAdjective] : [],
    detectedPrimaryWords: targetAdjective ? [targetAdjective] : [],
    isSpontaneous: !scaffoldUsed,
    scaffoldStage: scaffoldUsed ? 2 : 0,
    createdAt: timestamp,
  };
}
