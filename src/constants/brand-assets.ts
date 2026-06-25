import type { ImageSourcePropType } from 'react-native';

type BrandRuntimeAsset = Readonly<{
  source: ImageSourcePropType;
  label: string;
}>;

function brandAsset(source: ImageSourcePropType, label: string): BrandRuntimeAsset {
  return { source, label };
}

/**
 * Runtime-ready client-provided brand assets. The colour-reference image and
 * original character sheet deliberately remain documentation-only assets.
 */
export const brandAssets = {
  logos: {
    main: brandAsset(require('../../assets/brand/logos/funwattle-logo.png'), 'FunWattle logo'),
    tagline: brandAsset(require('../../assets/brand/logos/funwattle-logo-tagline.png'), 'FunWattle logo and tagline'),
  },
  kool: {
    idle: brandAsset(require('../../assets/brand/kool/kool-idle.png'), 'Kool standing and ready'),
    wave: brandAsset(require('../../assets/brand/kool/kool-wave.png'), 'Kool waving hello'),
    speaking: brandAsset(require('../../assets/brand/kool/kool-speaking.png'), 'Kool speaking'),
    listening: brandAsset(require('../../assets/brand/kool/kool-listening.png'), 'Kool listening'),
    thinking: brandAsset(require('../../assets/brand/kool/kool-thinking.png'), 'Kool thinking'),
    retry: brandAsset(require('../../assets/brand/kool/kool-retry.png'), 'Kool practising together'),
    success: brandAsset(require('../../assets/brand/kool/kool-success.png'), 'Kool celebrating'),
    breathe: brandAsset(require('../../assets/brand/kool/kool-breathe.png'), 'Kool taking a breath'),
  },
} as const;

export type KoolMascotAssetState = keyof typeof brandAssets.kool;
