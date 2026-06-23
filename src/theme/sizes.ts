import { Platform } from 'react-native';

export const ComponentSizes = {
  minimumTouchTarget: 48,
  microphoneButton: 88,
  progressBarHeight: 12,
  contentMaxWidth: 800,
} as const;

export const MaxContentWidth = ComponentSizes.contentMaxWidth;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
