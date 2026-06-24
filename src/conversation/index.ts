/**
 * conversation/index.ts
 *
 * Public API for the conversation engine module (Role 4).
 * Other roles should import from '@/conversation' rather than
 * reaching into individual files.
 */

// State machine
export { createInitialState, transition } from './dialogue-state-machine';

// Dialogue action generators
export {
  generateRecast,
  generateReprompt,
  generateHelpResponse,
  generateCelebration,
  generateFallback,
} from './dialogue-actions';

// Child-safe guardrails
export {
  isChildSafe,
  sanitizeKoolMessage,
  getFallbackMessage,
  guardLLMOutput,
} from './child-safe-guardrails';
