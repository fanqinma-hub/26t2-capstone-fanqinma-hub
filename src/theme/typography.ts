import { Platform } from 'react-native';

import { moderateScale } from './responsive';

export const FontFamilies = {
  bodyRegular: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  headingSemiBold: 'Raleway_600SemiBold',
  headingBold: 'Raleway_700Bold',
} as const;

// Font sizes are tempered-scaled to the device so copy stays comfortably large
// for 6–8 year-olds on small phones without inflating on tablets. Consumers
// keep spreading `...Typography.x`; no per-component font sizing.
export const Typography = {
  body: {
    fontFamily: FontFamilies.bodyRegular,
    fontSize: moderateScale(20),
    lineHeight: moderateScale(30),
  },
  bodyStrong: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: moderateScale(20),
    lineHeight: moderateScale(30),
  },
  bodySmall: {
    fontFamily: FontFamilies.bodyRegular,
    fontSize: moderateScale(18),
    lineHeight: moderateScale(26),
  },
  label: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: moderateScale(20),
    lineHeight: moderateScale(28),
  },
  heading: {
    fontFamily: FontFamilies.headingBold,
    fontSize: moderateScale(36),
    lineHeight: moderateScale(44),
  },
  headingSmall: {
    fontFamily: FontFamilies.headingSemiBold,
    fontSize: moderateScale(26),
    lineHeight: moderateScale(34),
  },
  status: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: moderateScale(22),
    lineHeight: moderateScale(30),
  },
  speech: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: moderateScale(24),
    lineHeight: moderateScale(34),
  },
  button: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: moderateScale(22),
    lineHeight: moderateScale(28),
  },
} as const;

export const Fonts = {
  sans: FontFamilies.bodyRegular,
  serif: FontFamilies.headingSemiBold,
  rounded: FontFamilies.bodyRegular,
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace', web: 'var(--font-mono)' }) ?? 'monospace',
} as const;
