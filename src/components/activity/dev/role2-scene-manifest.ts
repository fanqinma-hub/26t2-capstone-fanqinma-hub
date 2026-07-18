import type { SceneAssetKey, SceneAspectRatio, NormalizedRect, FocusTarget } from '@/types/visual.types';

import { sceneAssetManifest } from '../scene-asset-manifest';

export type Role2DevSceneKey = Exclude<SceneAssetKey, 'kitchen-bench'>;
export type Role2DevAspectRatio = SceneAspectRatio;
export type Role2DevNormalizedRect = Readonly<NormalizedRect>;
export type Role2DevFocusTarget = Readonly<FocusTarget>;

type Role2DevSceneEvidence = Readonly<{
  activity: 2 | 3 | 4 | 5;
  sourceFile: string;
  checksumSha256: string;
}>;

const evidence: Readonly<Record<Role2DevSceneKey, Role2DevSceneEvidence>> = {
  park: {
    activity: 2,
    sourceFile: 'assets/client/scenes/activity-02.png',
    checksumSha256: '5b91079e57d5ea8f1134cbd5d39f08bb0a65f623b96e9f397c2cf6c03025c699',
  },
  'toy-box': {
    activity: 3,
    sourceFile: 'assets/client/scenes/activity-03.png',
    checksumSha256: 'db26b63dc36d82474f18ec231394013dd5393f5945f629659754d209a6d6d527',
  },
  'farmers-market': {
    activity: 4,
    sourceFile: 'assets/client/scenes/activity-04-original.png',
    checksumSha256: 'c059f8ac339e60f571a2f151ffdd16515d56618ffdd1233fbed579543fe14ea2',
  },
  'beach-day': {
    activity: 5,
    sourceFile: 'assets/client/scenes/activity-05.png',
    checksumSha256: 'eff553ba235fa03beb9894afc8da9e9d5924c455bc8bcea2591bf2f2885fee82',
  },
};

export const role2DevSceneAssets = {
  park: { ...sceneAssetManifest.park, ...evidence.park },
  'toy-box': { ...sceneAssetManifest['toy-box'], ...evidence['toy-box'] },
  'farmers-market': { ...sceneAssetManifest['farmers-market'], ...evidence['farmers-market'] },
  'beach-day': { ...sceneAssetManifest['beach-day'], ...evidence['beach-day'] },
} as const;

export const role2DevSceneList = Object.values(role2DevSceneAssets);
