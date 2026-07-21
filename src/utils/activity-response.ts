import type {
  ActivityId,
  ActivityPromptDefinition,
  ResponseTier,
  SizeWordKeyword,
  TargetAdjective,
} from '@/types/activity.types';
import type { SpeechAttempt, TranscriptSource } from '@/types/session.types';

import { classifyTier } from './tier-classifier';

type BuildActivitySpeechAttemptOptions = {
  activityId: ActivityId;
  alternatives?: readonly { confidence: number | null; transcript: string }[];
  confidence: number | null;
  id: string;
  prompt: ActivityPromptDefinition;
  scaffoldUsed: boolean;
  source: TranscriptSource;
  timestamp: string;
  transcript: string;
};

export type ActivitySpeechResult = {
  accepted: boolean;
  attempt: SpeechAttempt;
};

export function normalizeActivityTranscript(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/water\s+lemon/g, 'watermelon')
    .replace(/straw\s+berry/g, 'strawberry')
    .replace(/tea\s+cup/g, 'teacup')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhrase(transcript: string, phrase: string) {
  const normalizedPhrase = normalizeActivityTranscript(phrase);
  return (
    normalizedPhrase.length > 0 &&
    ` ${transcript} `.includes(` ${normalizedPhrase} `)
  );
}

function isAcceptedResponse(
  prompt: ActivityPromptDefinition,
  normalizedCandidates: readonly string[],
) {
  const candidates = normalizedCandidates.filter(Boolean);
  if (candidates.length === 0) return false;
  if (prompt.acceptedExamples.tier1.includes('any spoken response')) return true;

  const phrases = [
    ...prompt.expectedNouns,
    ...prompt.nounAliases,
    ...prompt.acceptedExamples.tier1,
    ...prompt.acceptedExamples.tier2,
    ...prompt.acceptedExamples.tier3,
  ];
  return candidates.some((candidate) =>
    phrases.some((phrase) => containsPhrase(candidate, phrase)),
  );
}

function resolvePrimaryWords(
  prompt: ActivityPromptDefinition,
  detectedWords: readonly SizeWordKeyword[],
) {
  const promptTargets = new Set<TargetAdjective>(prompt.targetAdjectives);
  return detectedWords.filter((word): word is TargetAdjective =>
    promptTargets.has(word as TargetAdjective),
  );
}

export function buildActivitySpeechAttempt({
  activityId,
  alternatives = [],
  confidence,
  id,
  prompt,
  scaffoldUsed,
  source,
  timestamp,
  transcript,
}: BuildActivitySpeechAttemptOptions): ActivitySpeechResult {
  const normalizedTranscript = normalizeActivityTranscript(transcript);
  const normalizedCandidates = [
    normalizedTranscript,
    ...alternatives.map(({ transcript: alternative }) =>
      normalizeActivityTranscript(alternative),
    ),
  ];
  const classification = classifyTier(transcript);
  const detectedKeywords = classification.detectedWords as SizeWordKeyword[];
  const accepted = isAcceptedResponse(prompt, normalizedCandidates);
  const canonicalSource = source === 'azure' ? 'azure' : 'mock';

  return {
    accepted,
    attempt: {
      id,
      activityId,
      promptId: prompt.id,
      promptText: prompt.promptText,
      transcript,
      normalizedTranscript,
      confidence,
      status: accepted
        ? canonicalSource === 'azure'
          ? 'captured'
          : 'mocked'
        : 'no_match',
      source: canonicalSource,
      errorCode: accepted ? null : 'no_match',
      tier: accepted ? classification.status : null,
      detectedKeywords,
      detectedPrimaryWords: resolvePrimaryWords(prompt, detectedKeywords),
      isSpontaneous: !scaffoldUsed,
      scaffoldStage: scaffoldUsed ? 2 : 0,
      createdAt: timestamp,
    },
  };
}

export function formatResponseTier(tier: ResponseTier | null): string {
  switch (tier) {
    case 'adjective_used':
      return 'Tier 2';
    case 'rich_description':
      return 'Tier 3';
    case 'noun_only':
      return 'Tier 1';
    default:
      return 'No valid Tier';
  }
}
