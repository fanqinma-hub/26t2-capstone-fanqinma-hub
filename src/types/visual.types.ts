export type MascotState =
  | 'idle'
  | 'speaking'
  | 'listening'
  | 'thinking'
  | 'success';

export interface MascotAnimatorProps {
  state: MascotState;
  celebrationIntensity: 'gentle' | 'standard' | 'enhanced' | null;
  reducedMotion: boolean;
  accessibilityLabel: string;
}
