import { Platform } from 'react-native';

import { clamp, scale } from './responsive';

export const ComponentSizes = {
  // Never let the touch target fall below the 44pt accessibility floor.
  minimumTouchTarget: clamp(scale(56), 44, 72),
  microphoneButton: scale(104),
  progressBarHeight: scale(12),
  contentMaxWidth: 800,
} as const;

export const MaxContentWidth = ComponentSizes.contentMaxWidth;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
