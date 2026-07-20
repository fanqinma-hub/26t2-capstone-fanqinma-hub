import { conversationTiming } from '@/config/conversation-timing.config';

import type { FormalActivityDemoProgress } from './formal-activity-demo.state';

/** These durations simulate delivery only; silence timings come from the shared config. */
export const formalDemoFixtureTiming = {
  deliveryMs: 2_200,
  processingMs: 700,
} as const;

export function getFormalDemoScheduledTransition(
  progress: FormalActivityDemoProgress,
): Readonly<{
  action: 'DELIVERY_SETTLED' | 'SILENCE_STAGE_DUE' | 'PROCESSING_SETTLED';
  delayMs: number;
}> | null {
  if (progress.isCapturing || progress.rewardVisible) return null;
  if (
    progress.visualState === 'prompt' ||
    progress.visualState === 'gentleCue' ||
    progress.visualState === 'reprompt' ||
    progress.visualState === 'cluePresented'
  ) {
    return { action: 'DELIVERY_SETTLED', delayMs: formalDemoFixtureTiming.deliveryMs };
  }
  if (progress.visualState === 'listening') {
    const delayMs = progress.scaffoldStage === 0
      ? conversationTiming.gentleCueMs
      : progress.scaffoldStage === 1
        ? conversationTiming.repromptMs
        : conversationTiming.tapToHelpMs;
    return { action: 'SILENCE_STAGE_DUE', delayMs };
  }
  if (progress.visualState === 'finalListening') {
    return { action: 'SILENCE_STAGE_DUE', delayMs: conversationTiming.finalListeningMs };
  }
  if (progress.visualState === 'processing') {
    return { action: 'PROCESSING_SETTLED', delayMs: formalDemoFixtureTiming.processingMs };
  }
  return null;
}
