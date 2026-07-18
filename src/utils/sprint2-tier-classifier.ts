import type {
  TargetAdjective,
  SizeWordKeyword,
  ResponseTier,
  ActivityPromptDefinition,
} from '../types/activity.types';
import type { TierResult } from '../types/speech.types';

export const CORE_ADJECTIVES: SizeWordKeyword[] = [
  'big',
  'small',
  'tiny',
  'huge',
  'gigantic',
  'medium',
  'little',
  'large',
  'giant',
  'enormous',
  'teeny',
];

export const COMPARATIVE_SUPERLATIVE_MAP: Record<string, SizeWordKeyword> = {
  bigger: 'big',
  biggest: 'big',
  smaller: 'small',
  smallest: 'small',
  tinier: 'tiny',
  tiniest: 'tiny',
  huger: 'huge',
  hugest: 'huge',
  giganticer: 'gigantic',
  giganticest: 'gigantic',
  mediumer: 'medium',
  mediumest: 'medium',
  littler: 'little',
  littlest: 'little',
  larger: 'large',
  largest: 'large',
  gianter: 'giant',
  giantest: 'giant',
  enormouser: 'enormous',
  enormousest: 'enormous',
  teenier: 'teeny',
  teeniest: 'teeny',
};

const KEYWORD_TO_PRIMARY_MAP: Record<SizeWordKeyword, TargetAdjective> = {
  big: 'big',
  small: 'small',
  tiny: 'tiny',
  huge: 'huge',
  gigantic: 'gigantic',
  medium: 'medium',
  little: 'small',
  large: 'big',
  giant: 'huge',
  enormous: 'gigantic',
  teeny: 'tiny',
};

/**
 * Computes the Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[a.length][b.length];
}

/**
 * Computes a normalized similarity ratio between two strings (0.0 to 1.0).
 */
export function getSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  const distance = getLevenshteinDistance(a, b);
  return 1.0 - distance / maxLength;
}

interface MatchCandidate {
  matchedWord: string; // The candidate string tested (e.g. "gigantic" or "bigger")
  canonical: SizeWordKeyword; // The canonical size keyword (e.g. "gigantic" or "big")
  isComp: boolean;
  similarity: number;
}

/**
 * Helper to match a single word against the vocabulary.
 */
function matchSingleWord(word: string): MatchCandidate | null {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) return null;

  // For words with length <= 3, require exact match to prevent false positives
  if (cleanWord.length <= 3) {
    if (CORE_ADJECTIVES.includes(cleanWord as SizeWordKeyword)) {
      return {
        matchedWord: cleanWord,
        canonical: cleanWord as SizeWordKeyword,
        isComp: false,
        similarity: 1.0,
      };
    }
    if (cleanWord in COMPARATIVE_SUPERLATIVE_MAP) {
      return {
        matchedWord: cleanWord,
        canonical: COMPARATIVE_SUPERLATIVE_MAP[cleanWord],
        isComp: true,
        similarity: 1.0,
      };
    }
    return null;
  }

  let bestMatch: MatchCandidate | null = null;

  // 1. Check against core adjectives
  for (const core of CORE_ADJECTIVES) {
    const sim = getSimilarity(cleanWord, core);
    if (!bestMatch || sim > bestMatch.similarity) {
      bestMatch = {
        matchedWord: core,
        canonical: core,
        isComp: false,
        similarity: sim,
      };
    }
  }

  // 2. Check against comparative/superlative forms
  for (const comp in COMPARATIVE_SUPERLATIVE_MAP) {
    const sim = getSimilarity(cleanWord, comp);
    if (!bestMatch || sim > bestMatch.similarity) {
      bestMatch = {
        matchedWord: comp,
        canonical: COMPARATIVE_SUPERLATIVE_MAP[comp],
        isComp: true,
        similarity: sim,
      };
    }
  }

  // Enforce the threshold requirement of > 0.65
  if (bestMatch && bestMatch.similarity > 0.65) {
    return bestMatch;
  }

  return null;
}

/**
 * Classifies size words within the child's response.
 * Implements deterministic Levenshtein fuzzy similarity matching.
 */
export const classifySizeWords = (input: {
  prompt: ActivityPromptDefinition;
  transcript: string;
}): TierResult => {
  const { transcript } = input;
  if (!transcript || !transcript.trim()) {
    return {
      tier: 'noun_only',
      detectedKeywords: [],
      detectedPrimaryWords: [],
      matchedVariants: [],
    };
  }

  // Parse words from transcription: lowercase, strip punctuation, split on whitespace
  const words = transcript
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const matchedVariantsList: {
    heard: string;
    canonical: SizeWordKeyword;
    primaryEquivalent: TargetAdjective;
    similarity: number;
  }[] = [];

  const detectedKeywordsSet = new Set<SizeWordKeyword>();
  const detectedPrimarySet = new Set<TargetAdjective>();
  let hasComparativeOrSuperlative = false;

  for (const word of words) {
    const match = matchSingleWord(word);
    if (match) {
      const primaryEquivalent = KEYWORD_TO_PRIMARY_MAP[match.canonical];
      
      matchedVariantsList.push({
        heard: word,
        canonical: match.canonical,
        primaryEquivalent,
        similarity: match.similarity,
      });

      detectedKeywordsSet.add(match.canonical);
      detectedPrimarySet.add(primaryEquivalent);

      if (match.isComp) {
        hasComparativeOrSuperlative = true;
      }
    }
  }

  const detectedKeywords = Array.from(detectedKeywordsSet);
  const detectedPrimaryWords = Array.from(detectedPrimarySet);

  // Compute ResponseTier:
  // Tier 3 (rich_description): 2+ unique size keywords detected OR 1+ comparative/superlative used
  // Tier 2 (adjective_used): exactly 1 size keyword detected and no comparative/superlative
  // Tier 1 (noun_only): 0 size keywords detected
  let tier: ResponseTier = 'noun_only';
  if (detectedKeywords.length >= 2 || (detectedKeywords.length >= 1 && hasComparativeOrSuperlative)) {
    tier = 'rich_description';
  } else if (detectedKeywords.length === 1) {
    tier = 'adjective_used';
  }

  return {
    tier,
    detectedKeywords,
    detectedPrimaryWords,
    matchedVariants: matchedVariantsList,
  };
};
