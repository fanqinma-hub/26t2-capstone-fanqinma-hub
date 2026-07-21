import type { FocusTargetId, SceneAssetKey } from './visual.types';

export type ActivityId =
  | 'activity-1'
  | 'activity-2'
  | 'activity-3'
  | 'activity-4'
  | 'activity-5';

/** Prompt IDs are globally unique because they include their owning activity. */
export type PromptId = `${ActivityId}:${string}`;

export type TargetAdjective =
  | 'big'
  | 'small'
  | 'tiny'
  | 'huge'
  | 'gigantic'
  | 'medium';

export type SizeWordKeyword =
  | TargetAdjective
  | 'little'
  | 'large'
  | 'giant'
  | 'enormous'
  | 'teeny';

export type ResponseTier =
  | 'noun_only'
  | 'adjective_used'
  | 'rich_description';

export type RewardCheckpointId =
  | 'coin-after-activity-1'
  | 'coin-after-activity-3'
  | 'coin-after-activity-5';

export interface AcceptedResponseExamples {
  tier1: readonly string[];
  tier2: readonly string[];
  tier3: readonly string[];
}

export interface ActivityPromptDefinition {
  id: PromptId;
  sequence: number;
  kind: 'open';
  promptText: string;
  repromptText: string;
  helpText: string;
  recastText: string;
  targetAdjectives: readonly TargetAdjective[];
  expectedNouns: readonly string[];
  nounAliases: readonly string[];
  focusTargetIds: readonly FocusTargetId[];
  readinessEligible: boolean;
  acceptedExamples: AcceptedResponseExamples;
}

export interface ActivityDefinition {
  id: ActivityId;
  order: 1 | 2 | 3 | 4 | 5;
  title: string;
  sceneAssetKey: SceneAssetKey;
  runtimeSeconds: number;
  targetAdjectives: readonly TargetAdjective[];
  teachingTechnique: string;
  introText: string;
  prompts: readonly ActivityPromptDefinition[];
  rewardCheckpointId?: RewardCheckpointId;
}

export interface LearningUnitDefinition {
  id: 'size-words-unit';
  contentVersion: string;
  title: 'Big, Small and Everything in Between!';
  type: 'expressive_language';
  targetAge: { minimum: 6; maximum: 8 };
  expectedRuntimeMinutes: { minimum: 5; maximum: 10 };
  primaryWords: readonly ['big', 'small', 'tiny', 'huge', 'gigantic', 'medium'];
  activities: readonly ActivityDefinition[];
}
