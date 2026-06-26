import type { ImageSourcePropType } from 'react-native';

export type TargetAdjective = 'big' | 'small' | 'tiny' | 'huge' | 'gigantic' | 'medium';

export type SizeWordKeyword =
  | TargetAdjective
  | 'little'
  | 'large'
  | 'giant'
  | 'enormous'
  | 'teeny';

export type ResponseTier = 'noun_only' | 'adjective_used' | 'rich_description';

export type AcceptedResponseExamples = {
  minimum: readonly string[];
  target: readonly string[];
  bonus: readonly string[];
};

export type ActivityHotspotDefinition = {
  id: string;
  label: string;
  objectName: string;
  /** Normalized scene coordinates from 0 to 1. */
  x: number;
  y: number;
  width: number;
  height: number;
  helpPrompt: string;
};

export type ActivityPromptDefinition = {
  id: string;
  sequence: number;
  koolPrompt: string;
  expectedNouns: readonly string[];
  targetAdjectives: readonly TargetAdjective[];
  acceptedResponses: AcceptedResponseExamples;
  recastText: string;
  helpPrompt: string;
  hotspotId?: string;
  acceptsAnyResponse?: boolean;
};

export type ActivityScriptExchange = {
  id: string;
  title: string;
  approximateDurationSeconds: number;
  promptIds: readonly string[];
};

export type ActivityRewardCheckpoint = {
  id: string;
  kind: 'coin';
  afterPromptId: string;
  koolMessage: string;
};

export type ActivityDefinition = {
  id: string;
  slug: string;
  order: number;
  title: string;
  scene: {
    assetKey: string;
    source: ImageSourcePropType;
    accessibilityLabel: string;
  };
  runtimeSeconds: number;
  targetAdjectives: readonly TargetAdjective[];
  teachingTechnique: string;
  introMessage: string;
  exchanges: readonly ActivityScriptExchange[];
  prompts: readonly ActivityPromptDefinition[];
  hotspots: readonly ActivityHotspotDefinition[];
  rewardCheckpoint?: ActivityRewardCheckpoint;
  clinicalNote: string;
};

export type LearningUnitDefinition = {
  id: string;
  version: string;
  title: string;
  type: 'expressive_language';
  targetAge: {
    minimum: number;
    maximum: number;
  };
  targetAdjectives: readonly TargetAdjective[];
  totalActivities: number;
  expectedRuntimeMinutes: {
    minimum: number;
    maximum: number;
  };
  activities: readonly ActivityDefinition[];
};
