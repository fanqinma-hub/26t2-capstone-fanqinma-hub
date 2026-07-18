import type { ImageSourcePropType } from 'react-native';

import type { ActivityDefinition } from './activity.types';

export type SceneAssetKey =
  | 'kitchen-bench'
  | 'park'
  | 'toy-box'
  | 'farmers-market'
  | 'beach-day';

export type SceneAspectRatio = '3:2' | '5:4';

export type FocusTargetId = `activity-${1 | 2 | 3 | 4 | 5}:${string}`;

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FocusTarget {
  id: FocusTargetId;
  label: string;
  objectName: string;
  rect: NormalizedRect;
}

export interface SceneAssetManifestEntry {
  key: SceneAssetKey;
  source: ImageSourcePropType;
  aspectRatio: SceneAspectRatio;
  pixelWidth: number;
  pixelHeight: number;
  accessibilityLabel: string;
  sourceNote: string;
  focusTargets: readonly FocusTarget[];
}

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
  size?: 'small' | 'medium';
  /** Exact height of the visible artwork; overrides the size preset. */
  visualHeight?: number;
}

export type RewardEffectKind = 'coin' | 'sparkle' | 'confetti';

export interface RewardEffectProps {
  effect: RewardEffectKind;
  intensity: 'gentle' | 'standard' | 'enhanced';
  playKey: string;
  reducedMotion: boolean;
  onComplete(): void;
}

export interface LoadingEffectProps {
  visible: boolean;
  reducedMotion: boolean;
  accessibilityLabel: string;
}

export type ChildVisualState =
  | 'prompt'
  | 'listening'
  | 'gentleCue'
  | 'reprompt'
  | 'tapHelpAvailable'
  | 'cluePresented'
  | 'finalListening'
  | 'processing'
  | 'feedback'
  | 'complete'
  | 'error';

export interface ActivityScreenViewModel {
  // Role 3 owns the final ActivityId alias. Referencing its current canonical
  // definition keeps this visual contract compatible without editing Role 3's file.
  activityId: ActivityDefinition['id'];
  title: string;
  sceneAssetKey: SceneAssetKey;
  sceneAspectRatio: SceneAspectRatio;
  focusTargets: readonly FocusTarget[];
  activityProgress: { current: number; total: 5 };
  questionProgress: { current: number; total: number };
  visualState: ChildVisualState;
  koolMessage: string;
  statusLine?: string;
  mascotState: MascotState;
  microphoneState: 'idle' | 'listening' | 'processing' | 'disabled' | 'error';
  audioLevel: number;
  activeFocusTargetIds: readonly FocusTargetId[];
  showClueTargets: boolean;
  celebrationIntensity: 'gentle' | 'standard' | 'enhanced' | null;
  canBack: boolean;
  canSkip: boolean;
  canReplay: boolean;
  canContinue: boolean;
  canStartMicrophone: boolean;
  canStopMicrophone: boolean;
}

export interface ActivityScreenActions {
  onBack(): void;
  onReplay(): void;
  onMicrophoneStart(): void;
  onMicrophoneStop(): void;
  onClue(targetId: FocusTargetId): void;
  onSkip(): void;
  onContinue(): void;
}
