import { classifySizeWords, getSimilarity } from '../sprint2-tier-classifier';
import type { ActivityPromptDefinition } from '../../types/activity.types';

const mockPrompt: ActivityPromptDefinition = {
  id: 'activity-1:watermelon',
  sequence: 1,
  koolPrompt: 'What is that big green thing?',
  helpPrompt: 'It is a watermelon.',
  recastText: 'A big watermelon!',
  targetAdjectives: ['big', 'gigantic'],
  expectedNouns: ['watermelon'],
  acceptedResponses: {
    minimum: ['watermelon'],
    target: ['a big watermelon'],
    bonus: ['a huge gigantic watermelon']
  }
};

describe('Sprint 2 Tier Classifier & Levenshtein Algorithm', () => {
  describe('Levenshtein Similarity', () => {
    it('exact match equals 1.0', () => {
      expect(getSimilarity('big', 'big')).toBe(1.0);
    });

    it('completely different equals 0.0', () => {
      expect(getSimilarity('abc', 'xyz')).toBe(0.0);
    });
  });

  describe('classifySizeWords', () => {
    it('handles empty transcript', () => {
      const result = classifySizeWords({ prompt: mockPrompt, transcript: '' });
      expect(result.tier).toBe('noun_only');
      expect(result.detectedKeywords).toEqual([]);
      expect(result.detectedPrimaryWords).toEqual([]);
      expect(result.matchedVariants).toEqual([]);
    });

    it('enforces exact match for short words <= 3 chars to prevent false positives', () => {
      // 'pig' vs 'big' similarity = 2/3 = 0.67 (>0.65).
      // However, because length <= 3, it should NOT match.
      const result = classifySizeWords({ prompt: mockPrompt, transcript: 'I see a pig' });
      expect(result.tier).toBe('noun_only');
      expect(result.detectedKeywords).toEqual([]);
      expect(result.detectedPrimaryWords).toEqual([]);
    });

    it('exact match for short words <= 3 chars succeeds', () => {
      const result = classifySizeWords({ prompt: mockPrompt, transcript: 'It is big' });
      expect(result.tier).toBe('adjective_used');
      expect(result.detectedKeywords).toEqual(['big']);
      expect(result.detectedPrimaryWords).toEqual(['big']);
    });

    it('fuzzy matches child mispronunciations > 0.65 for long words', () => {
      // 'gigannick' vs 'gigantic' length 9, distance 2 -> sim = 7/9 ≈ 0.77 (>0.65)
      const result = classifySizeWords({ prompt: mockPrompt, transcript: 'it is gigannick' });
      expect(result.tier).toBe('adjective_used');
      expect(result.detectedKeywords).toEqual(['gigantic']);
      expect(result.detectedPrimaryWords).toEqual(['gigantic']);
      expect(result.matchedVariants[0]).toEqual({
        heard: 'gigannick',
        canonical: 'gigantic',
        primaryEquivalent: 'gigantic',
        similarity: expect.closeTo(0.777, 2),
      });
    });

    it('maps synonym words to primary equivalents', () => {
      // 'little' -> canonical 'little' -> primary 'small'
      const result = classifySizeWords({ prompt: mockPrompt, transcript: 'a little strawberry' });
      expect(result.tier).toBe('adjective_used');
      expect(result.detectedKeywords).toEqual(['little']);
      expect(result.detectedPrimaryWords).toEqual(['small']);
    });

    it('classifies Tier 3 (rich_description) for comparative/superlative form usage', () => {
      const result = classifySizeWords({ prompt: mockPrompt, transcript: 'this is the biggest' });
      expect(result.tier).toBe('rich_description');
      expect(result.detectedKeywords).toEqual(['big']);
      expect(result.detectedPrimaryWords).toEqual(['big']);
    });

    it('classifies Tier 3 (rich_description) for 2+ distinct size adjectives', () => {
      const result = classifySizeWords({ prompt: mockPrompt, transcript: 'it is huge and gigantic' });
      expect(result.tier).toBe('rich_description');
      expect(result.detectedKeywords).toEqual(['huge', 'gigantic']);
      expect(result.detectedPrimaryWords).toEqual(['huge', 'gigantic']);
    });
  });
});
