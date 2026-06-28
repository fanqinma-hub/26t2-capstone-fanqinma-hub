/**
 * @file tier-classifier.ts
 * @description Central clinical speech grading engine for matching and categorizing
 * child size word utterances without the use of an LLM.
 *
 * Owner: Role 5 (STT & Scoring Lead)
 */

/**
 * CORE_ADJECTIVES
 * The official target size words list mandated by the client.
 */
export const CORE_ADJECTIVES = [
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

/**
 * COMPARATIVE_SUPERLATIVE_MAP
 * Maps common comparative and superlative forms back to their canonical base size adjectives.
 */
export const COMPARATIVE_SUPERLATIVE_MAP: Record<string, string> = {
  // big
  bigger: 'big',
  biggest: 'big',
  // small
  smaller: 'small',
  smallest: 'small',
  // tiny
  tinier: 'tiny',
  tiniest: 'tiny',
  // huge
  huger: 'huge',
  hugest: 'huge',
  // gigantic
  giganticer: 'gigantic',
  giganticest: 'gigantic',
  // medium
  mediumer: 'medium',
  mediumest: 'medium',
  // little
  littler: 'little',
  littlest: 'little',
  // large
  larger: 'large',
  largest: 'large',
  // giant
  gianter: 'giant',
  giantest: 'giant',
  // enormous
  enormouser: 'enormous',
  enormousest: 'enormous',
  // teeny
  teenier: 'teeny',
  teeniest: 'teeny',
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

/**
 * Attempts to match a single word against the core list or comparative/superlative forms.
 * Supports fuzzy matching for children's pronunciation errors.
 *
 * @param word The normalized input word to test.
 * @returns An object containing the canonical base word and whether it was a comparative/superlative, or null if no match.
 */
export function matchWord(word: string): { base: string; isComparativeOrSuperlative: boolean } | null {
  // Clinical safeguard: For very short words (length <= 3), we require exact matches
  // to avoid false positives (e.g., "bug", "bag", "pig" matching "big").
  if (word.length <= 3) {
    if (CORE_ADJECTIVES.includes(word)) {
      return { base: word, isComparativeOrSuperlative: false };
    }
    if (word in COMPARATIVE_SUPERLATIVE_MAP) {
      return { base: COMPARATIVE_SUPERLATIVE_MAP[word], isComparativeOrSuperlative: true };
    }
    return null;
  }

  let bestMatch: string | null = null;
  let bestSimilarity = 0;

  // 1. Scan core adjectives
  for (const core of CORE_ADJECTIVES) {
    const sim = getSimilarity(word, core);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestMatch = core;
    }
  }

  // 2. Scan comparative and superlative keys
  for (const comp in COMPARATIVE_SUPERLATIVE_MAP) {
    const sim = getSimilarity(word, comp);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestMatch = comp;
    }
  }

  // Clinical requirement: Threshold > 0.65 represents a match for words length > 3
  if (bestSimilarity > 0.65 && bestMatch !== null) {
    const isComp = bestMatch in COMPARATIVE_SUPERLATIVE_MAP;
    const base = isComp ? COMPARATIVE_SUPERLATIVE_MAP[bestMatch] : bestMatch;
    return { base, isComparativeOrSuperlative: isComp };
  }

  return null;
}

/**
 * Extracts and normalizes size words from a child's transcript.
 * Removes punctuation, ignores case, and runs fuzzy matching.
 * Returns an array of unique canonical base words.
 *
 * @param transcript The transcription string.
 * @returns Array of unique canonical base adjectives found in the transcript.
 */
export function extractSizeWords(transcript: string): string[] {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  // Lowercase and strip punctuation
  const words = transcript
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const detected = new Set<string>();

  for (const word of words) {
    const match = matchWord(word);
    if (match) {
      detected.add(match.base);
    }
  }

  return Array.from(detected);
}

/**
 * Classifies a child's transcript into clinical scaffolding tiers.
 *
 * @param transcript The transcription string.
 * @returns Object with the classified tier (1/2/3), status enum, and canonical detected words.
 */
export function classifyTier(transcript: string): {
  tier: 1 | 2 | 3;
  status: 'noun_only' | 'adjective_used' | 'rich_description';
  detectedWords: string[];
} {
  if (!transcript || transcript.trim().length === 0) {
    return { tier: 1, status: 'noun_only', detectedWords: [] };
  }

  const words = transcript
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const detectedBases = new Set<string>();
  let hasComparativeOrSuperlative = false;

  for (const word of words) {
    const match = matchWord(word);
    if (match) {
      detectedBases.add(match.base);
      if (match.isComparativeOrSuperlative) {
        hasComparativeOrSuperlative = true;
      }
    }
  }

  const detectedWords = Array.from(detectedBases);
  const count = detectedWords.length;

  // Tier 3: 2+ unique size adjectives, or any comparative/superlative used (e.g., biggest)
  if (count >= 2 || (count >= 1 && hasComparativeOrSuperlative)) {
    return {
      tier: 3,
      status: 'rich_description',
      detectedWords,
    };
  }

  // Tier 2: Exactly 1 size adjective used in its base form
  if (count === 1) {
    return {
      tier: 2,
      status: 'adjective_used',
      detectedWords,
    };
  }

  // Tier 1: 0 size adjectives detected (e.g. noun only: "it is a watermelon")
  return {
    tier: 1,
    status: 'noun_only',
    detectedWords: [],
  };
}
