import {
  extractSizeWords,
  classifyTier,
  getSimilarity,
  CORE_ADJECTIVES,
} from '../tier-classifier';

describe('Tier Classifier & Fuzzy Matching Algorithm', () => {
  describe('String Similarity (Levenshtein Distance)', () => {
    it('should return 1.0 for exact matches', () => {
      expect(getSimilarity('big', 'big')).toBe(1.0);
      expect(getSimilarity('gigantic', 'gigantic')).toBe(1.0);
    });

    it('should return 0.0 for completely different strings', () => {
      expect(getSimilarity('abc', 'xyz')).toBe(0.0);
    });

    it('should calculate partial similarity correctly', () => {
      // gigantic (len 8) vs giganticest (len 11) -> 8 matches, similarity 8/11 ≈ 0.727
      expect(getSimilarity('gigantic', 'giganticest')).toBeCloseTo(0.727, 2);
    });
  });

  describe('extractSizeWords', () => {
    it('should return empty array for empty transcripts', () => {
      expect(extractSizeWords('')).toEqual([]);
      expect(extractSizeWords('   ')).toEqual([]);
    });

    it('should extract correct core adjectives ignoring case and punctuation', () => {
      expect(extractSizeWords('Look at the BIG watermelon!')).toEqual(['big']);
      expect(extractSizeWords('It is a small, tiny cup...')).toEqual(['small', 'tiny']);
    });

    it('should map comparative and superlative forms to their canonical base form', () => {
      expect(extractSizeWords('This watermelon is the biggest!')).toEqual(['big']);
      expect(extractSizeWords('It is smaller than that one.')).toEqual(['small']);
    });

    it('should fuzzy match typical child pronunciation errors above 0.65 similarity', () => {
      // "gigannick" vs "gigantic": max length 9, edit distance 2. Similarity = 7/9 = 0.778 (> 0.65)
      expect(extractSizeWords('I see a gigannick fruit.')).toEqual(['gigantic']);

      // "teeny" mispronounced as "teemy": max length 5, edit distance 1. Similarity = 4/5 = 0.80 (> 0.65)
      expect(extractSizeWords('Look at the teemy bug')).toEqual(['teeny']);
    });

    it('should not match words below 0.65 similarity', () => {
      // "pig" vs "big" -> max length 3, distance 1. Similarity = 2/3 ≈ 0.67.
      // Wait, "pig" is 0.67, so it actually matches "big" under the threshold! Let's test a word that is definitely below 0.65, e.g. "car" vs "big".
      expect(extractSizeWords('The car is red.')).toEqual([]);
    });
  });

  describe('classifyTier', () => {
    it('should classify Tier 1 (noun_only) when no size adjectives are detected', () => {
      const result = classifyTier('Look at the watermelon.');
      expect(result).toEqual({
        tier: 1,
        status: 'noun_only',
        detectedWords: [],
      });
    });

    it('should classify Tier 2 (adjective_used) when exactly one base size word is detected', () => {
      const result = classifyTier('Look at the big watermelon.');
      expect(result).toEqual({
        tier: 2,
        status: 'adjective_used',
        detectedWords: ['big'],
      });
    });

    it('should classify Tier 2 (adjective_used) when fuzzy matching matches one mispronounced word', () => {
      const result = classifyTier('The watermelon is gigannick!');
      expect(result).toEqual({
        tier: 2,
        status: 'adjective_used',
        detectedWords: ['gigantic'],
      });
    });

    it('should classify Tier 3 (rich_description) when two or more distinct size words are used', () => {
      const result = classifyTier('I see a big watermelon and a tiny strawberry.');
      expect(result).toEqual({
        tier: 3,
        status: 'rich_description',
        detectedWords: ['big', 'tiny'],
      });
    });

    it('should classify Tier 3 (rich_description) when a comparative or superlative size word is used', () => {
      const result1 = classifyTier('This watermelon is the biggest!');
      expect(result1).toEqual({
        tier: 3,
        status: 'rich_description',
        detectedWords: ['big'],
      });

      const result2 = classifyTier('It is teenier than the other one.');
      expect(result2).toEqual({
        tier: 3,
        status: 'rich_description',
        detectedWords: ['teeny'],
      });
    });
  });
});
