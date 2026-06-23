import type { ImageSourcePropType } from 'react-native';

export type ClientAsset = Readonly<{
  source: ImageSourcePropType;
  label: string;
}>;

function clientAsset(source: ImageSourcePropType, label: string): ClientAsset {
  return { source, label };
}

// Keep this runtime registry limited to assets rendered by the current Role 2 UI.
// The complete source-to-file mapping remains in docs/client-assets.md.
export const clientScenes = {
  activity1: clientAsset(require('../../assets/client/scenes/activity-01.png'), 'Activity 1 client-provided scene'),
} as const satisfies Record<string, ClientAsset>;

export const clientUiAssets = {
  thinking: clientAsset(require('../../assets/client/icons/icon-56.png'), 'Thinking'),
  successCelebration: clientAsset(require('../../assets/client/icons/icon-60.png'), 'Birthday celebration'),
} as const satisfies Record<string, ClientAsset>;

export type ClientSceneKey = keyof typeof clientScenes;
export type ClientUiAssetKey = keyof typeof clientUiAssets;
