export type MascotAnimationState =
  | 'idle'
  | 'speaking'
  | 'listening'
  | 'thinking'
  | 'encouraging'
  | 'celebrating'
  | 'error';

export type MascotRenderer = 'lottie' | 'static';

export interface MascotAnimatorProps {
  state: MascotAnimationState;
  size?: number;
  renderer?: MascotRenderer;
  accessibilityLabel?: string;
}