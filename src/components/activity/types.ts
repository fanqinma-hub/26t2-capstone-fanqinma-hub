import type { ImageSourcePropType } from 'react-native';
import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { FeedbackBubbleVariant, KoolMascotState, MicrophoneButtonState } from '@/components/child-ui';

export type ActivityScreenVisualState =
  | 'prompt'
  | 'listening'
  | 'gentleCue'
  | 'reprompt'
  | 'tapHelpAvailable'
  | 'cluePresented'
  | 'finalListening'
  | 'processing'
  | 'success'
  | 'retry'
  | 'complete'
  | 'error';

export type ActivityHotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ActivityFeedback = {
  title: string;
  message: string;
  variant: FeedbackBubbleVariant;
};

export type ActivityScreenProps = {
  activityId: string;
  title: string;
  sceneSource: ImageSourcePropType;
  koolMessage: string;
  currentActivity: number;
  totalActivities: number;
  visualState: ActivityScreenVisualState;
  microphoneState: MicrophoneButtonState;
  mascotState?: KoolMascotState;
  isKoolSpeaking?: boolean;
  statusLine?: string;
  tierBadge?: string;
  audioLevel?: SharedValue<number>;
  feedback?: ActivityFeedback;
  hotspots?: readonly ActivityHotspot[];
  activeHotspotId?: string;
  onBackPress?: () => void;
  onMicrophonePress?: () => void;
  onMicrophonePressIn?: () => void;
  onMicrophonePressOut?: () => void;
  onSkipPress?: () => void;
  onHotspotPress?: (hotspotId: string) => void;
  onCompletePress?: () => void;
  completeActionLabel?: string;
  developmentControls?: ReactNode;
};
