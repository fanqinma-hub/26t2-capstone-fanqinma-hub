// child-safe Kool copywriting
import type { TierFeedbackInput } from '@/types/conversation';

export const KOOL_SILENCE_COPY = {
  intro: 'Hi! Let’s find some size words together.',
  prompt: 'What can you see in this picture?',
  listening: 'I’m listening. Tell me a size word when you are ready.',
  gentleCue: 'Take your time. What looks very big?',
  reprompt: 'Look at the watermelon and the cup. Which one is big?',
  tapHelpAvailable: 'Need a clue? Tap the little question mark.',
  cluePresented: 'This is a watermelon. Can you tell me its size?',
  finalListening: 'One last try. Is it big, small, tiny, huge, or medium?',
  processing: 'Kool is thinking…',
  autoAdvance: 'Good try. Let’s keep going.',
  complete: 'You finished Activity 1. Let’s look at your demo report!',
} as const;

export const KOOL_FALLBACK_COPY = {
  genericError: 'That’s okay. Let’s try again together.',
  speechUnavailable: 'I could not hear that clearly. Let’s try once more.',
  safeFallback: 'Nice trying. We can keep going together.',
} as const;

export function getTierFeedbackCopy(input: TierFeedbackInput): string {
  if (input.tier === 'noun_only') {
    const target = input.targetAdjective ?? 'big';
    return `Nice talking! We can also say it is ${target}.`;
  }

  if (input.tier === 'adjective_used') {
    const word = input.detectedWords?.[0];
    return word ? `Great size word! You said ${word}.` : 'Great size word!';
  }

  return 'Wow, that was a rich description!';
}
