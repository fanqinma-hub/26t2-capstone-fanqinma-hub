import { activity01Definition } from '../../fixtures/activity-01.fixture';
import type { ActivityPromptDefinition } from '../../types/activity.types';
import { buildActivitySpeechAttempt } from '../activity-response';

const watermelonPrompt = activity01Definition.prompts[0];
const strawberryPrompt = activity01Definition.prompts[1];
const teacupPrompt = activity01Definition.prompts[4];

function buildAttempt(
  transcript: string,
  prompt: ActivityPromptDefinition = watermelonPrompt,
) {
  return buildActivitySpeechAttempt({
    activityId: activity01Definition.id,
    confidence: null,
    id: `${prompt.id}-${transcript || 'empty'}`,
    prompt,
    scaffoldUsed: false,
    source: 'web',
    timestamp: '2026-06-30T00:00:00.000Z',
    transcript,
  });
}

describe('Activity response matching', () => {
  it('accepts Chrome truncation for the watermelon prompt without upgrading Tier', () => {
    const result = buildAttempt('water');

    expect(result.accepted).toBe(true);
    expect(result.attempt.tier).toBe('noun_only');
  });

  it('accepts common watermelon split variants', () => {
    const result = buildAttempt('water lemon');

    expect(result.accepted).toBe(true);
    expect(result.attempt.tier).toBe('noun_only');
  });

  it('keeps object success separate from deterministic Tier 2 scoring', () => {
    const result = buildAttempt('big watermelon');

    expect(result.accepted).toBe(true);
    expect(result.attempt.tier).toBe('adjective_used');
  });

  it('keeps object success separate from deterministic Tier 3 scoring', () => {
    const result = buildAttempt('watermelon is bigger');

    expect(result.accepted).toBe(true);
    expect(result.attempt.tier).toBe('rich_description');
  });

  it('rejects unrelated transcripts for retry', () => {
    const result = buildAttempt('banana');

    expect(result.accepted).toBe(false);
    expect(result.attempt.status).toBe('no_match');
  });

  it('accepts teacup-specific truncation only for the teacup prompt', () => {
    expect(buildAttempt('tea', teacupPrompt).accepted).toBe(true);
    expect(buildAttempt('tea', watermelonPrompt).accepted).toBe(false);
  });

  it('accepts Chrome truncation "straw" for the strawberry prompt without upgrading Tier', () => {
    const result = buildAttempt('straw', strawberryPrompt);

    expect(result.accepted).toBe(true);
    expect(result.attempt.tier).toBe('noun_only');
  });

  it('rejects "straw" for unrelated prompts', () => {
    expect(buildAttempt('straw', watermelonPrompt).accepted).toBe(false);
    expect(buildAttempt('straw', teacupPrompt).accepted).toBe(false);
  });
});
