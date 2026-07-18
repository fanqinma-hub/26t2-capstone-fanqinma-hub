import type { ImageSourcePropType } from 'react-native';

export type Role2DevSceneKey = 'park' | 'toy-box' | 'farmers-market' | 'beach-day';
export type Role2DevAspectRatio = '3:2' | '5:4';

export type Role2DevNormalizedRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type Role2DevFocusTarget = Readonly<{
  id: `activity-${2 | 3 | 4 | 5}:${string}`;
  label: string;
  objectName: string;
  rect: Role2DevNormalizedRect;
}>;

export type Role2DevSceneAsset = Readonly<{
  activity: 2 | 3 | 4 | 5;
  key: Role2DevSceneKey;
  source: ImageSourcePropType;
  sourceFile: string;
  aspectRatio: Role2DevAspectRatio;
  pixelWidth: number;
  pixelHeight: number;
  checksumSha256: string;
  accessibilityLabel: string;
  sourceNote: string;
  focusTargets: readonly Role2DevFocusTarget[];
}>;

export const role2DevSceneAssets = {
  park: {
    activity: 2,
    key: 'park',
    source: require('../../../../assets/client/scenes/activity-02.png'),
    sourceFile: 'assets/client/scenes/activity-02.png',
    aspectRatio: '3:2',
    pixelWidth: 1536,
    pixelHeight: 1024,
    checksumSha256: '5b91079e57d5ea8f1134cbd5d39f08bb0a65f623b96e9f397c2cf6c03025c699',
    accessibilityLabel:
      'Sunny Australian park with a huge gum tree, a tiny yellow flower at its base, a large golden dog, and a small bird.',
    sourceNote: 'Existing client-provided Activity 2 scene; no visible answer labels.',
    focusTargets: [
      { id: 'activity-2:gum-tree', label: 'Huge gum tree', objectName: 'gum tree', rect: { x: 0.02, y: 0.0, width: 0.54, height: 0.95 } },
      { id: 'activity-2:flower', label: 'Tiny yellow flower', objectName: 'flower', rect: { x: 0.3, y: 0.85, width: 0.05, height: 0.08 } },
      { id: 'activity-2:dog', label: 'Large golden dog', objectName: 'dog', rect: { x: 0.51, y: 0.4, width: 0.31, height: 0.52 } },
      { id: 'activity-2:bird', label: 'Small bird', objectName: 'bird', rect: { x: 0.82, y: 0.86, width: 0.1, height: 0.1 } },
    ],
  },
  'toy-box': {
    activity: 3,
    key: 'toy-box',
    source: require('../../../../assets/client/scenes/activity-03.png'),
    sourceFile: 'assets/client/scenes/activity-03.png',
    aspectRatio: '5:4',
    pixelWidth: 1402,
    pixelHeight: 1122,
    checksumSha256: 'db26b63dc36d82474f18ec231394013dd5393f5945f629659754d209a6d6d527',
    accessibilityLabel:
      'Warm child bedroom with a gigantic teddy bear, a tiny red toy car on the rug, and a medium bookshelf.',
    sourceNote: 'Client-provided Activity 3 scene copied unchanged from the supplied attachment and Excel workbook.',
    focusTargets: [
      { id: 'activity-3:teddy-bear', label: 'Gigantic teddy bear', objectName: 'teddy bear', rect: { x: 0.33, y: 0.02, width: 0.61, height: 0.88 } },
      { id: 'activity-3:toy-car', label: 'Tiny red toy car', objectName: 'toy car', rect: { x: 0.505, y: 0.81, width: 0.105, height: 0.09 } },
      { id: 'activity-3:bookshelf', label: 'Medium bookshelf', objectName: 'bookshelf', rect: { x: 0.1, y: 0.41, width: 0.29, height: 0.42 } },
    ],
  },
  'farmers-market': {
    activity: 4,
    key: 'farmers-market',
    source: require('../../../../assets/client/scenes/activity-04.png'),
    sourceFile: 'assets/client/scenes/activity-04.png',
    aspectRatio: '5:4',
    pixelWidth: 1402,
    pixelHeight: 1122,
    checksumSha256: '7dae67bae72712600a35ff3a8b844bb901c6d2c85d3b4b900c7662405a0a4ec9',
    accessibilityLabel:
      'Australian farmers market stall with big, medium, and small pumpkins, a bunch of bananas, and a small bunch of grapes; pumpkin placards are blank.',
    sourceNote:
      'Label-free local derivative of the permanently retained client original. Only the three pumpkin placard faces were edited; see assets/client/scenes/review.',
    focusTargets: [
      { id: 'activity-4:big-pumpkin', label: 'Big pumpkin', objectName: 'big pumpkin', rect: { x: 0.04, y: 0.24, width: 0.343, height: 0.46 } },
      { id: 'activity-4:medium-pumpkin', label: 'Medium pumpkin', objectName: 'medium pumpkin', rect: { x: 0.386, y: 0.4, width: 0.191, height: 0.3 } },
      { id: 'activity-4:small-pumpkin', label: 'Small pumpkin', objectName: 'small pumpkin', rect: { x: 0.58, y: 0.5, width: 0.13, height: 0.2 } },
      { id: 'activity-4:bananas', label: 'Large bunch of bananas', objectName: 'bananas', rect: { x: 0.69, y: 0.42, width: 0.305, height: 0.28 } },
      { id: 'activity-4:grapes', label: 'Small bunch of grapes', objectName: 'grapes', rect: { x: 0.86, y: 0.61, width: 0.13, height: 0.12 } },
    ],
  },
  'beach-day': {
    activity: 5,
    key: 'beach-day',
    source: require('../../../../assets/client/scenes/activity-05.png'),
    sourceFile: 'assets/client/scenes/activity-05.png',
    aspectRatio: '3:2',
    pixelWidth: 1536,
    pixelHeight: 1024,
    checksumSha256: 'eff553ba235fa03beb9894afc8da9e9d5924c455bc8bcea2591bf2f2885fee82',
    accessibilityLabel:
      'Bright Australian beach with a huge wave, medium sandcastle, tiny shell, big umbrella, small crab, and gigantic rock.',
    sourceNote: 'Client-provided Activity 5 scene copied unchanged from the supplied attachment and Excel workbook.',
    focusTargets: [
      { id: 'activity-5:wave', label: 'Huge wave', objectName: 'wave', rect: { x: 0.31, y: 0.18, width: 0.51, height: 0.49 } },
      { id: 'activity-5:sandcastle', label: 'Medium sandcastle', objectName: 'sandcastle', rect: { x: 0.49, y: 0.44, width: 0.38, height: 0.48 } },
      { id: 'activity-5:shell', label: 'Tiny shell', objectName: 'shell', rect: { x: 0.34, y: 0.88, width: 0.09, height: 0.07 } },
      { id: 'activity-5:umbrella', label: 'Big beach umbrella', objectName: 'umbrella', rect: { x: 0.72, y: 0.13, width: 0.28, height: 0.55 } },
      { id: 'activity-5:crab', label: 'Small crab', objectName: 'crab', rect: { x: 0.14, y: 0.7, width: 0.08, height: 0.11 } },
      { id: 'activity-5:rock', label: 'Gigantic rock', objectName: 'rock', rect: { x: 0.05, y: 0.18, width: 0.26, height: 0.38 } },
    ],
  },
} as const satisfies Readonly<Record<Role2DevSceneKey, Role2DevSceneAsset>>;

export const role2DevSceneList = Object.values(role2DevSceneAssets);
