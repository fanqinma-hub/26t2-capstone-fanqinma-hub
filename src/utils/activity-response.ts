import type { ActivityPromptDefinition, SizeWordKeyword, TargetAdjective } from '@/types/activity.types';
import type { SpeechAttempt, TranscriptSource } from '@/types/session.types';

import { classifyTier } from './tier-classifier';

type BuildActivitySpeechAttemptOptions = {
  activityId: string;
  alternatives?: readonly {
    confidence: number | null;
    transcript: string;
  }[];
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

const splitWordsPattern = /\s+/g;

export function normalizeActivityTranscript(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/water\s+lemon/g, 'watermelon')
    .replace(/straw\s+berry/g, 'strawberry')
    .replace(/tea\s+cup/g, 'teacup')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"“”‘’]/g, ' ')
    .replace(splitWordsPattern, ' ')
    .trim();
}

function normalizePhrase(phrase: string): string {
  return normalizeActivityTranscript(phrase);
}

function containsPhrase(transcript: string, phrase: string): boolean {
  const normalizedPhrase = normalizePhrase(phrase);
  if (!normalizedPhrase) return false;

  const paddedTranscript = ` ${transcript} `;
  const paddedPhrase = ` ${normalizedPhrase} `;
  return paddedTranscript.includes(paddedPhrase);
}

function getPromptAwareAliases(prompt: ActivityPromptDefinition): string[] {
  const aliases = new Set<string>();
  const expectedNouns = prompt.expectedNouns.map((noun) => normalizePhrase(noun));
  const hotspotId = prompt.hotspotId;

  if (expectedNouns.includes('watermelon')) {
    aliases.add('watermelon');
    aliases.add('water melon');
    aliases.add('water lemon');
    aliases.add('melon');
    aliases.add('water');
  }

  if (expectedNouns.includes('strawberry')) {
    aliases.add('strawberry');
    aliases.add('straw berry');
    aliases.add('strawberries');
    aliases.add('berry');
    aliases.add('berries');
    // Chrome commonly truncates "strawberry" to "straw"; accept it as the
    // object for the strawberry prompt only, mirroring "water" for watermelon.
    aliases.add('straw');
  }

  if (expectedNouns.includes('pot') || expectedNouns.includes('cooking pot')) {
    aliases.add('pot');
    aliases.add('cooking pot');
  }

  if (hotspotId === 'teacup' || expectedNouns.includes('teacup') || expectedNouns.includes('cup')) {
    aliases.add('teacup');
    aliases.add('tea cup');
    aliases.add('cup');
    aliases.add('tea');
  }

  return Array.from(aliases);
}

function isAcceptedResponse(prompt: ActivityPromptDefinition, normalizedCandidates: readonly string[]): boolean {
  const candidates = normalizedCandidates.filter(Boolean);
  if (!candidates.length) return false;
  if (prompt.acceptsAnyResponse) return true;

  const expectedPhrases = [
    ...prompt.expectedNouns,
    ...getPromptAwareAliases(prompt),
    ...prompt.acceptedResponses.minimum,
    ...prompt.acceptedResponses.target,
    ...prompt.acceptedResponses.bonus,
  ];

  return candidates.some((candidate) =>
    expectedPhrases.some((phrase) => containsPhrase(candidate, phrase)),
  );
}

function toDetectedSizeWords(words: readonly string[]): SizeWordKeyword[] {
  return words.filter(Boolean) as SizeWordKeyword[];
}

function resolveTargetAdjectiveUsed(
  prompt: ActivityPromptDefinition,
  detectedWords: readonly SizeWordKeyword[],
): TargetAdjective | null {
  const promptTargets = new Set<TargetAdjective>(prompt.targetAdjectives);
  return (
    detectedWords.find((word): word is TargetAdjective =>
      promptTargets.has(word as TargetAdjective),
    ) ?? null
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
  const normalizedCandidates = Array.from(
    new Set([
      normalizedTranscript,
      ...alternatives.map((alternative) =>
        normalizeActivityTranscript(alternative.transcript),
      ),
    ]),
  );
  const classification = classifyTier(transcript);
  const detectedSizeWords = toDetectedSizeWords(classification.detectedWords);
  const accepted = isAcceptedResponse(prompt, normalizedCandidates);
  const targetAdjectiveUsed = resolveTargetAdjectiveUsed(prompt, detectedSizeWords);

  return {
    accepted,
    attempt: {
      id,
      activityId,
      promptId: prompt.id,
      promptText: prompt.koolPrompt,
      transcript,
      normalizedTranscript,
      detectedSizeWords,
      matchedVariants: detectedSizeWords.map((word) => ({
        canonical: word,
        confidence,
        heard: word,
      })),
      tier: classification.status,
      targetAdjectiveUsed,
      scaffoldUsed,
      confidence,
      source,
      status: accepted ? 'captured' : 'no_match',
      timestamp,
    },
  };
}

export function formatResponseTier(tier: SpeechAttempt['tier']): string {
  switch (tier) {
    case 'adjective_used':
      return 'Tier 2';
    case 'rich_description':
      return 'Tier 3';
    case 'noun_only':
    default:
      return 'Tier 1';
  }
}
