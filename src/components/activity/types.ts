import type { ImageSourcePropType } from 'react-native';

import type { FeedbackBubbleVariant, MicrophoneButtonState } from '@/components/child-ui';

export type ActivityScreenVisualState =
  | 'prompt'
  | 'listening'
  | 'gentleCue'
  | 'reprompt'
  | 'tapHelpAvailable'
  | 'finalListening'
  | 'processing'
  | 'success'
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
  feedback?: ActivityFeedback;
  hotspots?: ActivityHotspot[];
  onMicrophonePress: () => void;
  onHotspotPress?: (hotspotId: string) => void;
};
