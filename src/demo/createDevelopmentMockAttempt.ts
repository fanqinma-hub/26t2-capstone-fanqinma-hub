import type { ActivityPromptDefinition } from '@/types/activity.types';
import type { SpeechAttempt } from '@/types/session.types';

import type { Activity1DemoOutcome } from './useActivity1DemoFlow';

type CreateDevelopmentMockAttemptOptions = {
  activityId: string;
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
      promptText: prompt.koolPrompt,
      transcript: '',
      normalizedTranscript: '',
      detectedSizeWords: [],
      matchedVariants: [],
      tier: 'noun_only',
      targetAdjectiveUsed: null,
      scaffoldUsed,
      confidence: null,
      source: 'mock',
      status: 'no_match',
      timestamp,
    };
  }

  const transcript =
    prompt.acceptedResponses.target[0] ??
    prompt.acceptedResponses.bonus[0] ??
    prompt.recastText;
  const targetAdjective = prompt.targetAdjectives[0] ?? null;

  return {
    id,
    activityId,
    promptId: prompt.id,
    promptText: prompt.koolPrompt,
    transcript,
    normalizedTranscript: normaliseTranscript(transcript),
    detectedSizeWords: targetAdjective ? [targetAdjective] : [],
    matchedVariants: targetAdjective
      ? [
          {
            heard: targetAdjective,
            canonical: targetAdjective,
            confidence: 0.98,
          },
        ]
      : [],
    tier: 'adjective_used',
    targetAdjectiveUsed: targetAdjective,
    scaffoldUsed,
    confidence: 0.98,
    source: 'mock',
    status: 'mocked',
    timestamp,
  };
}
